// @flow

declare function describe(): any;
declare function it(): any;

// flow-disable-next-line
import assert from 'power-assert';

import * as ACL from './index';
import type {TPredicate} from './index';

type TTestContext = {
  user?: {
    name?: string,
    isAdmin?: boolean,
  },
  op?: string,
};

const isGuest: TPredicate<TTestContext> = ({user}: TTestContext) => !user;
const isAdmin: TPredicate<TTestContext> = ({user}: TTestContext) => !!user && !!user.isAdmin;
const isSteve: TPredicate<TTestContext> = ({user}: TTestContext) => !!user && user.name === 'steve';

const read: TPredicate<TTestContext> = ({op}: TTestContext) => op === 'read';
const write: TPredicate<TTestContext> = ({op}: TTestContext) => op === 'write';

const pete = {isAdmin: true, name: 'pete'};
const steve = {isAdmin: false, name: 'steve'};

describe('Test Fixtures', (): void => {
  it('predicates', (): void => {
    assert(isGuest({}));
    assert(!isGuest({user: pete}));

    assert(!isAdmin({}));
    assert(isAdmin({user: pete}));
    assert(!isAdmin({user: steve}));

    assert(isSteve({user: steve}));
    assert(!isSteve({user: pete}));

    assert(read({op: 'read'}));
    assert(write({op: 'write'}));
    assert(!write({op: 'read'}));
    assert(!read({op: 'write'}));
    assert(!read({}));
    assert(!write({}));
  });
});

describe('Predefined predicates', (): void => {
  it('never()', (): void => {
    assert(typeof ACL.never === 'function');
    assert(ACL.never() === false);
  });

  it('always()', (): void => {
    assert(typeof ACL.always === 'function');
    assert(ACL.always() === true);
  });
});

describe('Predicate helpers & cominators', (): void => {
  it('not(predicate)', (): void => {
    assert(typeof ACL.not === 'function');

    const isLoggedIn = ACL.not(isGuest);
    assert(typeof isLoggedIn === 'function');
    assert(!isLoggedIn({}));
    assert(isLoggedIn({user: pete}));
  });

  it('every(...predicates)', (): void => {
    assert(typeof ACL.every === 'function');

    const steveReads = ACL.every(read, isSteve);
    assert(typeof steveReads === 'function');
    assert(steveReads({user: steve, op: 'read'}));
    assert(!steveReads({user: pete, op: 'read'}));
    assert(!steveReads({user: steve, op: 'write'}));
    assert(!steveReads({}));

    const stillNever = ACL.every(ACL.never, isSteve);
    assert(typeof stillNever === 'function');
    assert(!stillNever({user: steve, op: 'read'}));
    assert(!stillNever({user: pete, op: 'read'}));
    assert(!stillNever({user: steve, op: 'write'}));
    assert(!stillNever({}));
  });

  it('some(...predicates)', (): void => {
    assert(typeof ACL.some === 'function');

    const steveOrReads = ACL.some(read, isSteve);
    assert(typeof steveOrReads === 'function');
    assert(steveOrReads({user: steve, op: 'read'}));
    assert(steveOrReads({user: pete, op: 'read'}));
    assert(steveOrReads({user: steve, op: 'write'}));
    assert(!steveOrReads({user: pete, op: 'write'}));
    assert(!steveOrReads({}));
  });

  it('none(...predicates)', (): void => {
    assert(typeof ACL.none === 'function');

    const neitherSteveNorReads = ACL.none(read, isSteve);
    assert(typeof neitherSteveNorReads === 'function');
    assert(!neitherSteveNorReads({user: steve, op: 'read'}));
    assert(!neitherSteveNorReads({user: pete, op: 'read'}));
    assert(!neitherSteveNorReads({user: steve, op: 'write'}));
    assert(neitherSteveNorReads({user: pete, op: 'write'}));
    assert(neitherSteveNorReads({}));
  });
});

describe('Predicate -> Rule converters', (): void => {
  it('allow(predicate)', (): void => {
    assert(typeof ACL.allow === 'function');

    const allowSteve = ACL.allow(isSteve);
    assert(typeof allowSteve === 'function');
    assert(allowSteve({user: steve}) === true);
    assert(allowSteve({user: pete}) === null);

    const allowAlways = ACL.allow();
    assert(typeof allowAlways === 'function');
    assert(allowAlways() === true);
  });

  it('deny(predicate)', (): void => {
    assert(typeof ACL.deny === 'function');

    const denySteve = ACL.deny(isSteve);
    assert(typeof denySteve === 'function');
    assert(denySteve({user: steve}) === false);
    assert(denySteve({user: pete}) === null);

    const denyAlways = ACL.deny();
    assert(typeof denyAlways === 'function');
    assert(denyAlways() === false);
  });
});

describe('Rule helpers', (): void => {
  it('invert(rule)', (): void => {
    assert(typeof ACL.invert === 'function');

    const denySteve = ACL.invert(ACL.allow(isSteve));
    assert(typeof denySteve === 'function');
    assert(denySteve({user: steve}) === false);
    assert(denySteve({user: pete}) === null);
  });

  it('forceDecisionIf(predicate, rule, undecidedResult)', (): void => {
    assert(typeof ACL.forceDecisionIf === 'function');

    const ifReadAllowSteveOrDeny = ACL.forceDecisionIf(read, ACL.allow(isSteve), false);
    assert(typeof ifReadAllowSteveOrDeny === 'function');
    assert(ifReadAllowSteveOrDeny({op: 'read', user: steve}) === true);
    assert(ifReadAllowSteveOrDeny({op: 'read', user: pete}) === false);
    assert(ifReadAllowSteveOrDeny({op: 'read'}) === false);
    assert(ifReadAllowSteveOrDeny({op: 'write', user: steve}) === null);
    assert(ifReadAllowSteveOrDeny({op: 'write', user: pete}) === null);
    assert(ifReadAllowSteveOrDeny({op: 'write'}) === null);

    const ifReadDenySteveOrAllow = ACL.forceDecisionIf(read, ACL.deny(isSteve), true);
    assert(typeof ifReadDenySteveOrAllow === 'function');
    assert(ifReadDenySteveOrAllow({op: 'read', user: steve}) === false);
    assert(ifReadDenySteveOrAllow({op: 'read', user: pete}) === true);
    assert(ifReadDenySteveOrAllow({op: 'read'}) === true);
    assert(ifReadDenySteveOrAllow({op: 'write', user: steve}) === null);
    assert(ifReadDenySteveOrAllow({op: 'write', user: pete}) === null);
    assert(ifReadDenySteveOrAllow({op: 'write'}) === null);
  });
});

describe('The main thing :)', (): void => {
  it('combineRules(...rules)', (): void => {
    assert(typeof ACL.combineRules === 'function');

    const combined1 = ACL.combineRules(
      ACL.deny(isGuest),
      ACL.allow(isSteve),
      ACL.allow(read),
      ACL.deny(),
    );
    assert(typeof combined1 === 'function');
    // guests are denied
    assert(combined1({}) === false);
    // steve can do everything
    assert(combined1({user: steve}) === true);
    assert(combined1({user: steve, op: 'write'}) === true);
    // pete can read
    assert(combined1({user: pete}) === false);
    assert(combined1({user: pete, op: 'write'}) === false);
    assert(combined1({user: pete, op: 'read'}) === true);

    // nobody else can do anything except read
    assert(combined1({user: {}, op: 'write'}) === false);
    assert(combined1({user: {}, op: 'read'}) === true);
  });
});

describe('And a small helper', (): void => {
  it('enforce(rule, context)', (): void => {
    assert(typeof ACL.enforce === 'function');

    const rule = ACL.allow(read);

    assert(ACL.enforce(rule, {op: 'read'}) === true);
    assert.throws(() => ACL.enforce(rule, {op: 'write'}));
  });
});
