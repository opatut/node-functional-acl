# Functional Access Control Lists (node-functional-acl)

## About

From Wikipedia:

>  An ACL specifies which users or system processes are granted access to
>  objects, as well as what operations are allowed on given objects. Each entry
>  in a typical ACL specifies a subject and an operation.

Functional ACL are an implementation of this concept with functional
programming. It makes heavy use of [higher-order
functions](https://en.wikipedia.org/wiki/Higher-order_function) as
[predicates](https://en.wikipedia.org/wiki/Predicate_(mathematical_logic)) to
model user permissions.

#### What it is not

* a role-based permission system (though it can model one)
* a database wrapper (you have to model that part on your own)

## Installation

Get it as a node package from npm:

    npm install functional-acl

Import it, and off you go!

## Terminology / Tutorial

#### Context

An object that describes the situation you are checking permissions for. This
usually contains one or more of:

* the acting user (*user* / *subject*)
* the action to perform (*action* / *operation*)
* the target object (*target* / *object*)
* anything you need to identify whether or not to allow/deny the request

#### Predicate

A function that checks whether the context (or part of it) matches a certain
condition. Returns true or false. Examples:

* `admins = (context) => context.user.isAdmin`
* `guests = (context) => !context.user`
* `owner = (context) => context.user == context.target.owner`

#### Rule

A function that returns one of `true` (allow), `false` (deny) or `null`
(proceed with next rule) for a context. These rules can be easily built from
predicates using the `allow(predicate)` and `deny(predicate)`
functions. If the predicate matches on the context, they return the appropriate
boolean value, and `null` otherwise.

Multiple rules can be combined using the `combineRules(...rules)` function.
These are then tested in order, the first rule that matches decides the result
(`true` or `false`). If no rule matches, the combined rule returns `null`.

## API

#### `not(predicate) => predicate`

Create a predicate that matches if the original predicate did not match.

#### `invert(rule) => rule`

Create a rule that allows if the original rule would deny, and vice versa. Does
not decide if the original rule wouldn't.

#### `always() => true`

Predicate that always matches.

#### `never() => false`

Predicate that never matches.

#### `every(...predicates) => predicate`

Create a predicate that matches if all predicates match.

#### `some(...predicates) => predicate`

Create a predicate that matches if at least one of the predicates matches.

#### `none(...predicates) => predicate`

Create a predicate that matches if none of the predicates matches

#### `allow(predicate) => rule`

Create a rule that returns true if the predicate matches.

#### `deny(predicate) => rule`

Create a rule that returns false if the predicate matches.

#### `combineRules(...rules) => rule`

Create a rule that returns the result of the first matching rule, or null if
none matches

#### `forceDecisionIf(predicate, rule, undecidedResult = false) => rule`

Create a rule that is triggered only if the predicate matches, and if the rule
does not decide, return the `undecidedResult`.

#### `enforce(rule, context) => undefined`

Throws an `ACLRejectionError` if the `rule` rejects the `context`, or does not
decide on the `context` (i.e. returns `null`).

Instead of a `try/catch` switch, you can manually check a rule simply by
calling it with a context (it is a function after all, hence this package's
name). This would look something like:

    const myRule = combineRules(...);
    const myContext = { user: ..., operation: ..., foo: ... };

    if (!myRule(myContext)) {
        console.warn('You are denied access.');
    } else {
        performSuperSecretStuff();
    }


## Complete example

    import {combineRules, deny, allow} from '../src';

    const admins = ({user}) => user && user.isAdmin;
    const guests = ({user}) => !user;
    const reading = ({operation}) => operation === 'read';
    const writing = ({operation}) => operation === 'write';

    const restricted = combineRules(
        deny(guests),       // guests may not ever read
        allow(admins),      // admins may do everything
        allow(reading),     // everyone else may read
    );

    // now you can check permissions simply by calling
    const context = {user: myUser, operation: 'read'};
    const allowed = restricted(context);

    // or enforce a permission (throw ACLRejectedError otherwise)
    enforce(restricted, context);

## Express middleware

There is a helper in `functional-acl/express` that creates a customized
middleware factory. Sounds complicated? It's not! Here we go:

    import aclExpress from 'functional-acl/express';

    // our middleware factory is called 'applyAcl'
    const applyACL = aclExpress({
        deriveContext(req) { return { user: req.user; }},
        createDirectContext(operation) { return { operation }},
    });

    app.use(authMiddleware); // inject req.user

    // check "myRule" with {user: req.user, operation: 'read'}
    app.get('/', applyACL(myRule, 'read'), myRoute);

You find a full working example in the *examples* directory.

The function `aclExpress` creates a middleware factory using the following options:

#### `deriveContext: (req, res, next) => context`

Used to derive a partial context from the request. This can for example be used
to supply the current user in the context. Make sure to plug in an
authorization middleware (such as *passport*) somewhere, so you can access the
user (e.g. `req.user`) here.

#### `createDirectContext: (...args) => context`

Used to extract a partial context from the arguments passed into the resulting
middleware after the rule. In the example above, there is only one expected
argument after the rule, which is the `operation`. This is then merged into the
context at the key `operation`. You can see the value `'read'` being passed in
for the example route.

#### `onDeny: (rule, context, req, res, next) => undefined`

Used by the default *applyRule* as an error handler. Defaults to throwing an
`ACLRejectionError`.

#### `applyRule: (rule, directContext, extractedContext, req, res, next) => undefined`

*Advanced*: Overwrite how to apply the rule in the middleware.

By default, it builds a context from the direct and extracted partial contexts
(direct context overwrites extracted context) and applies the rule on it. If
that fails, `onDeny` is called.
