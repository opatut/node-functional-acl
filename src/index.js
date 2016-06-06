// ----------------------------------------------------------------------------
// -- Predefined predicates
// ----------------------------------------------------------------------------

/**
  * Predicate that never matches.
  */
export function never() {
  return false;
}

/**
  * Predicate that always matches.
  */
export function always() {
  return true;
}


// ----------------------------------------------------------------------------
// -- Predicate helpers & combinators
// ----------------------------------------------------------------------------

/**
  * Create a predicate that matches if the original predicate did not match.
  */
export function not(predicate) {
  return (...args) => !predicate(...args);
}

/**
  * Create a predicate that matches if every predicates match.
  */
export function every(...predicates) {
  return (...args) => predicates.every((predicate) => predicate(...args));
}

/**
  * Create a predicate that matches if none of the predicates matches
  */
export function some(...predicates) {
  return (...args) => predicates.some((predicate) => predicate(...args));
}

/**
  */
export function none(...predicates) {
  return not(some(...predicates));
}

// ----------------------------------------------------------------------------
// -- Predicate -> Rule converters
// ----------------------------------------------------------------------------

/**
  * Create a rule that returns true if the predicate matches.
  */
export function allow(predicate) {
  return (...args) => (!predicate || predicate(...args)) ? true : null;
}

/**
  * Create a rule that returns false if the predicate matches.
  */
export function deny(predicate) {
  return (...args) => (!predicate || predicate(...args)) ? false : null;
}

// ----------------------------------------------------------------------------
// -- Rule helpers
// ----------------------------------------------------------------------------

/**
  * Create a rule that allows if the original rule would deny, and vice versa.
  * Does not decide if the original rule wouldn't.
  */
export function invert(rule) {
  return (...args) => {
    const result = rule(...args);
    return result === null ? null : !result;
  };
}

/**
  * Create a rule that is triggered only if the predicate matches, and if the
  * rule does not decide, return the `undecidedResult`.
  */
export function forceDecisionIf(predicate, rule, undecidedResult = false) {
  return (...args) => {
    if (predicate(...args)) {
      const result = rule(...args);
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
export function combineRules(...rules) {
  return (...args) => {
    for (const rule of rules) {
      const result = rule(...args);
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

export class ACLRejectionError extends Error {
  constructor(rule, ...args) {
    const message = 'ACL rejected';
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.args = args;
    Error.captureStackTrace(this, this.constructor.ruleName);
  }
}

/**
  * Throws an `ACLRejectionError` if the `rule` rejects the `context`, or does
  * not decide on the `context` (i.e. returns `null`).
  */
export function enforce(rule, ...args) {
  const result = rule(...args);
  if (!result) {
    throw new ACLRejectionError(rule, ...args);
  }
  return result;
}
