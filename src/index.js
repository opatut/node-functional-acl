// @flow

// ----------------------------------------------------------------------------
// -- Flowtypes
// ----------------------------------------------------------------------------

export type TPredicate<C> = (context: C) => boolean;
export type TRule<C> = (context: C) => ?boolean;

// ----------------------------------------------------------------------------
// -- Predefined predicates
// ----------------------------------------------------------------------------

/**
  * Predicate that never matches.
  */
export function never(): boolean {
  return false;
}

/**
  * Predicate that always matches.
  */
export function always(): boolean {
  return true;
}


// ----------------------------------------------------------------------------
// -- Predicate helpers & combinators
// ----------------------------------------------------------------------------

/**
  * Create a predicate that matches if the original predicate did not match.
  */
export function not<C>(predicate: TPredicate<C>): TPredicate<C> {
  return (context) => !predicate(context);
}

/**
  * Create a predicate that matches if every predicates match.
  */
export function every<C>(...predicates: TPredicate<C>[]): TPredicate<C> {
  return (context) => predicates.every((predicate) => predicate(context));
}

/**
  * Create a predicate that matches if none of the predicates matches
  */
export function some<C>(...predicates: TPredicate<C>[]): TPredicate<C> {
  return (context) => predicates.some((predicate) => predicate(context));
}

/**
  */
export function none<C>(...predicates: TPredicate<C>[]): TPredicate<C> {
  return not(some(...predicates));
}

// ----------------------------------------------------------------------------
// -- Predicate -> Rule converters
// ----------------------------------------------------------------------------

/**
  * Create a rule that returns true if the predicate matches.
  */
export function allow<C>(predicate?: TPredicate<C>): TRule<C> {
  return (context) => (!predicate || predicate(context)) ? true : null;
}

/**
  * Create a rule that returns false if the predicate matches.
  */
export function deny<C>(predicate?: TPredicate<C>): TRule<C> {
  return (context) => (!predicate || predicate(context)) ? false : null;
}

// ----------------------------------------------------------------------------
// -- Rule helpers
// ----------------------------------------------------------------------------

/**
  * Create a rule that allows if the original rule would deny, and vice versa.
  * Does not decide if the original rule wouldn't.
  */
export function invert<C>(rule: TRule<C>): TRule<C> {
  return (context: C): ?boolean => {
    const result = rule(context);
    return result === null ? null : !result;
  };
}

/**
  * Create a rule that is triggered only if the predicate matches, and if the
  * rule does not decide, return the `undecidedResult`.
  */
export function forceDecisionIf<C>(predicate: TPredicate<C>, rule: TRule<C>, undecidedResult: boolean = false): TRule<C> {
  return (context: C): ?boolean => {
    if (predicate(context)) {
      const result = rule(context);
      return result === null ? undecidedResult : result;
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// -- The main thing :)
// ----------------------------------------------------------------------------

/**
  * Create a rule that returns the result of the first matching rule, or `null` if
  * none matches.
  */
export function combineRules<C>(...rules: TRule<C>[]): TRule<C> {
  return (context: C): ?boolean => {
    for (const rule of rules) {
      const result = rule(context);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// -- And a small helper
// ----------------------------------------------------------------------------

export class ACLRejectionError<C> extends Error {
  context: C;
  message: string;
  name: string;

  constructor(rule: TRule<C>, context: C): void {
    const message = 'ACL rejected';
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
  * Throws an `ACLRejectionError` if the `rule` rejects the `context`, or does
  * not decide on the `context` (i.e. returns `null`).
  */
export function enforce<C>(rule: TRule<C>, context: C): ?boolean {
  const result = rule(context);
  if (!result) {
    throw new ACLRejectionError(rule, context);
  }
  return result;
}
