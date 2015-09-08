# Functional Access Control Lists (node-functional-acl)

## About 

From Wikipedia:

>  An ACL specifies which users or system processes are granted access to objects, as well as what operations are allowed on given objects. Each entry in a typical ACL specifies a subject and an operation.

Functional ACL are an implementation of this concept with functional aspects to identify subjects (users) and operations. It makes heavy use of [higher-order functions](https://en.wikipedia.org/wiki/Higher-order_function) as [predicates](https://en.wikipedia.org/wiki/Predicate_(mathematical_logic)) to model groups and operations.

### What it is not

* a role-based permission system (though it can model one)
* a database wrapper (you have to model that part on your own)

## Installation

Get it as a node package from npm:

    npm install functional-acl

Require/import it, and off you go!

## Here is what it looks like 

1. Create predicates to match subjects (users):

    ```javascript
    let isAdmin = (user) => user.isAdmin();
    let isGuest = (user) => user == null;
    let isPete = (user) => user.id == 4;
    let isAnyone => (user) => true;
    ```

2. Create predicates to match operations (actions):
    
    ```javascript
    let opRead = (op) => op == 'read';
    let opWrite = (op) => op == 'write';
    let opBoth = (op) => opRead(op) || opWrite(op);
    let opAny = (op) => true;
    ```

3. Create an ACL object:

    ```javascript
    let acl = new ACL();
    acl.allow(isAdmin, opAny);      // admins can do everything
    acl.deny(isGuest, opWrite);     // guests may never write
    acl.allow(isPete, opWrite);     // pete may write
    acl.deny(isAnyone, opAny);      // everything else is denied
    ```

4. Check if the current user may do their current operation:

    ```javascript
    acl.check(getCurrentUser(), 'write');
    ```


## Some suggestions

### Use higher order functions

Instead of writing above predicates yourself, you can almost always generate them with the help of a few higher-order functions (they return functions, such as our predicates!). You can use your own set, or find a package for that :) I created [higher-order-functions](https://github.com/opatut/higher-order-functions) for that purpose.

```javascript
import { getter, is, always, compose } from 'higher-order-functions';

let acl = new ACL();

// admins can do everything
acl.allow(getter('admin'), always);                     

// guests may never write
acl.deny(is(null), is('write'));                        

// pete may write
acl.allow(compose(is(4), getter('id')), is('write'));   

// everything else is denied
acl.deny(always, always);                               
```



