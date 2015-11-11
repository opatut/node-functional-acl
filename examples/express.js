import express from 'express';
import {enforce, build, deny, allow} from '../src';
import aclExpress from '../src/express';

import {restricted, Model} from './_definitions';

// a simple route that has the same rule applied every request, or whose rule can be
// fully determined by the request
function simpleRoute(req, res, next) {
    res.status(200).end(`${req.user || "guest"} is allowed access to ${req.url}`);
}

// a more complex example with a data-driven ACL (depends on the owner of the resource requested)
function complexRoute(req, res, next) {
    // the owner of the model is determined by the URL parameter 'owner'
    const modelInstance = new Model(req.params.owner);
    const rule = modelInstance.getRule();

    console.log(rule.ruleName);

    // Check if the current user is allowed to read.
    enforce(rule, {
        user: req.user,
        operation: 'write',
    });

    // the enforcement above was successful, let's return the model
    res.status(200).end(`Model was successful read by ${req.user || "guest"} (${req.url})`);
}

const ruleMiddleware = aclExpress({
    deriveContext(req) {
        const {user} = req;
        console.log('derived context', {user});
        return {user};
    },
    createDirectContext(operation) {
        return {operation};
    },
    onDeny(rule, context, req, res, next) {
        res.status(403).end('Access denied');
    },
});


const app = express();

// login middlewre that sets req.user
app.use((req, res, next) => {
    req.user = req.headers['x-user'];
    console.log('Found user', req.user);
    next();
});

app.use('/simple-read',
    ruleMiddleware(restricted, 'read'),
    simpleRoute);

app.use('/simple-write',
    ruleMiddleware(restricted, 'write'),
    simpleRoute);

app.use('/complex/:owner',
    complexRoute);

app.listen(8080, () => {
    console.log('Running on :8080');
});