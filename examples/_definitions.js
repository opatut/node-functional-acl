import {build, deny, allow} from '../src';

// some predicate definitions, we are using the keys
// 'user' and 'operation'
export function admins({user}) {
    return user && ['admin1', 'admin2'].indexOf(user) !== -1;
}

export function guests({user}) {
    return !user;
}

export function oneUser(theUser) {
    return function oneUserRule({user}) {
        console.log('checking oneUserRule', user, theUser);
        return theUser == user;
    }
}

export function reading({operation}) {
    return operation === 'read';
}

export function writing({operation}) {
    return operation === 'write';
}


export const restricted = build(
    deny(guests),  // guests may not even read (below)
    allow(admins),
    allow(reading),
    // all other requests are denied
);

export class Model {
    // model stuff
    // ...
    constructor(owner) {
        this.owner = owner;
    }

    getRule() {
        return build(
            // inherits all the above common rules
            restricted,

            // but if none matches, check if the model owner is trying to write
            allow(writing, oneUser(this.owner))
        );
    }
}
