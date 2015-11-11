# Functional Access Control Lists (node-functional-acl)

## About 

From Wikipedia:

>  An ACL specifies which users or system processes are granted access to objects, as well as what operations are allowed on given objects. Each entry in a typical ACL specifies a subject and an operation.

Functional ACL are an implementation of this concept with functional programming. It makes heavy use of [higher-order functions](https://en.wikipedia.org/wiki/Higher-order_function) as [predicates](https://en.wikipedia.org/wiki/Predicate_(mathematical_logic)) to model user permissions.

### What it is not

* a role-based permission system (though it can model one)
* a database wrapper (you have to model that part on your own)

## Installation

Get it as a node package from npm:

    npm install functional-acl

Import it, and off you go!

## Here is what it looks like 

```javascript 
import {build, deny, allow} from '../src';

const admins = ({user}) => user && user.isAdmin;
const guests = ({user}) => !user;
const reading = ({operation}) => operation === 'read';
const writing = ({operation}) => operation === 'write';

const restricted = build(
    deny(guests),       // guests may not ever read
    allow(admins),      // admins may do everything
    allow(reading),     // everyone else may read
);

// now you can check permissions simply by calling
const allowed = restricted({ user: someUser, operation: someOperation });

// or enforce a permission (throw ACLRejectedError otherwise)
enforce(restricted(...));
```

## Express middleware

There is a helper in 'functional-acl/express' that creates a customized middleware factory. Sounds complicated? It's not! Here we go:

```javascript
import aclExpress from 'functional-acl/express';

// our middleware factory is called 'applyAcl'
const applyACL = aclExpress({
    deriveContext(req) { return { user: req.user; }},
    createDirectContext(operation) { return { operation }},
});

app.use(authMiddleware); // inject req.user

// check "myRule" with {user: req.user, operation: 'read'}
app.get('/', applyACL(myRule, 'read'), myRoute);
```