import {ACLRejectionError} from './index';

export default function createMiddlewareFactory(options) {
    const {
        // Denial handler, used by the default 'applyRule'.
        // If none supplied, will throw `ACLRejectionError`.
        onDeny = null,

        applyRule = (rule, directContext, extractedContext, req, res, next) => {
            const context = {...extractedContext, ...directContext};

            console.log('context', context);

            if (!rule(context)) {
                if (onDeny) {
                    onDeny(rule, context, req, res, next);
                } else {
                    next(new ACLRejectionError(rule, context));
                }
            }
        },

        // By default, no context is derived from the request
        // context.
        deriveContext = (req, res, next) => {
            return {};
        },

        // By default, the arguments have to be objects,
        // they are merged into the context in order.
        createDirectContext = (...args) => {
            return Object.assign({}, ...args);
        },
    } = options;

    return function middlewareFactory(rule, ...args) {
        return function middleware(req, res, next) {
            try {
                applyRule(rule,
                    createDirectContext(...args),
                    deriveContext(req, res, next),
                    req, res, next);
            } catch (error) {
                next(error);
            }
            next();
        };
    };
}
