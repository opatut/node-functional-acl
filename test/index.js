import { assert } from 'chai';

import ACL from '../src';

function is(x) {
    return (y) => x == y;
}

let always = () => true;
let never = () => false;

let users = {
    alice: Symbol('alice'),
    bob: Symbol('bob')
};

let operations = {
    read: Symbol('READ'),
    write: Symbol('WRITE')
};

class TestEntity {
    constructor(owner) {
        this.owner = owner;
    }

    fillACL(acl) {
        acl.allow(is(this.owner), always);
        acl.allow(always, is(operations.read));
    }
}


describe('ACL', () => {
    describe('empty list', () => {
        let acl = new ACL();

        it('should deny any operation', () => {
            assert.equal(acl.check(users.bob, operations.write), false);
            assert.equal(acl.check(users.bob, operations.read), false);
            assert.equal(acl.check(null, null), false);
        });
    });

    describe('allow-all list', () => {
        let acl = new ACL();
        acl.allow(always, always);

        it('should allow any operation', () => {
            assert.equal(acl.check(users.bob, operations.write), true);
            assert.equal(acl.check(users.bob, operations.read), true);
            assert.equal(acl.check(null, null), true);
        });
    });

    describe('user predicate only list', () => {
        let acl = new ACL();
        acl.allow(is(users.bob), always);

        it('should allow any operation for the specified user', () => {
            assert.equal(acl.check(users.bob, operations.write), true);
            assert.equal(acl.check(users.bob, operations.read), true);
            assert.equal(acl.check(users.bob, null), true);
        });

        it('should deny any operation for other users', () => {
            assert.equal(acl.check(users.alice, operations.write), false);
            assert.equal(acl.check(users.alice, operations.read), false);
            assert.equal(acl.check(users.alice, null), false);
            assert.equal(acl.check(null, null), false);
        });
    });

    describe('operation predicate only list', () => {
        let acl = new ACL();
        acl.allow(always, is(operations.read));

        it('should allow the operation for any user', () => {
            assert.equal(acl.check(users.bob, operations.read), true);
            assert.equal(acl.check(users.alice, operations.read), true);
            assert.equal(acl.check(null, operations.read), true);
        });

        it('should deny any other operation', () => {
            assert.equal(acl.check(users.bob, operations.write), false);
            assert.equal(acl.check(users.alice, 123), false);
            assert.equal(acl.check(null, null), false);
        });
    });

    describe('complex allow list', () => {
        let acl = new ACL();
        acl.allow(is(users.alice), always);
        acl.allow(always, is(operations.read));

        it('should work as expected', () => {
            assert.equal(acl.check(users.alice, operations.write), true);
            assert.equal(acl.check(users.alice, operations.read), true);
            assert.equal(acl.check(users.bob, operations.write), false);
            assert.equal(acl.check(users.bob, operations.read), true);
        });
    });

    describe('complex mixed list', () => {
        let acl = new ACL();
        acl.allow(is(users.alice), always);     // Alice can do everything
        acl.deny(is(null), always);             // guests cannot do anything
        acl.deny(always, is(operations.write));  // nobody except Alice can write
        acl.allow(always, is(operations.read));  // everyone else can read

        it('should work as expected', () => {
            assert.equal(acl.check(users.alice, operations.write), true);
            assert.equal(acl.check(users.alice, operations.read), true);
            assert.equal(acl.check(users.bob, operations.write), false);
            assert.equal(acl.check(users.bob, operations.read), true);
            assert.equal(acl.check(null, operations.write), false);
            assert.equal(acl.check(null, operations.read), false);

            // weird request
            assert.equal(acl.check(123, 5123), false);
        });
    });

    describe('construct from entity', () => {
        let entity = new TestEntity(users.alice);
        let acl = ACL.get(entity);

        it('should be an ACL', () => {
            assert.equal(acl !== undefined, true);
            assert.equal(acl instanceof Object, true);
            assert.equal(acl instanceof ACL, true);
        });

        it('should work as expected', () => {
            assert.equal(acl.check(users.alice, operations.write), true);
            assert.equal(acl.check(users.alice, operations.read), true);
            assert.equal(acl.check(users.bob, operations.write), false);
            assert.equal(acl.check(users.bob, operations.read), true);
            assert.equal(acl.check(null, operations.write), false);
            assert.equal(acl.check(null, operations.read), true);
        });

        it('should be cached and reset correctly', () => {
            // cache is equal
            assert.equal(acl, ACL.get(entity));

            // reset cache
            entity.clearACL();

            // cache is not the same object anymore
            assert.notEqual(acl, ACL.get(entity));
        });
    });
});
