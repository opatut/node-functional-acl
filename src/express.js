// @flow

import {ACLRejectionError} from './index';

import type {TRule} from './index';

type TOptions<C1, C2> = {
  onDeny: (
    rule: TRule<C1 & C2>,
    context: C1 & C2,
    req: Request,
    res: Response,
    next: Function,
  ) => any,
  applyRule: (
    rule: TRule<C1 & C2>,
    directContext: C1,
    derivedContext: C2,
    req: Request,
    res: Response,
    next: Function,
  ) => void,
  createDirectContext: (...args: any) => C1,
  deriveContext: (req: Request, res: Response, next: Function) => C2,
};

export default function createMiddlewareFactory<C1, C2>(options: TOptions<C1, C2>): * {
  const {
    // Denial handler, used by the default 'applyRule'.
    // If none supplied, will throw `ACLRejectionError`.
    onDeny = (rule: TRule<C1 & C2>, context: C1 & C2): void => {
      throw new ACLRejectionError(rule, context);
    },

    applyRule = (rule: TRule<C1 & C2>, directContext: C1, derivedContext: C2, req: Request, res: Response, next: Function): void => {
      const context: C1 & C2 = {
        ...derivedContext,
        ...directContext,
      };

      if (!rule(context)) {
        onDeny(rule, context, req, res, next);
      }
    },

    // By default, no context is derived from the request
    // context.
    deriveContext = (): C2 => {
      return ({}: any);
    },

    // By default, the arguments have to be objects,
    // they are merged into the context in order.
    createDirectContext = (...args: Object[]): C1 => {
      return (Object.assign({}, ...args): any);
    },
  } = options;

  return function middlewareFactory(rule: TRule<C1 & C2>, ...args: any): * {
    return function middleware(req: Request, res: Response, next: Function): void {
      try {
        applyRule(
          rule,
          createDirectContext(...args),
          deriveContext(req, res, next),
          req,
          res,
          next,
        );
      } catch (error) {
        next(error);
      }
      next();
    };
  };
}
