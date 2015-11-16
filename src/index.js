export class ACLRejectionError extends Error {
    constructor(rule, context) {
        const message = `ACL rejected: ${rule.ruleName}`;
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor.ruleName)
    }
}

function _createRuleFactory(result) {
    // the actual rule
    return function ruleFactory(...predicates) {
        // all predicates have to match, by default
        const predicate = all(...predicates);

        function rule(context) {
            // if all predicates match -> return the result (true for allow, false for deny)
            // otherwise -> return null (try next rule)
            return predicate(context) ? result : null;
        }

        const ruleName = (result ? 'allow:' : 'deny:') +
            predicates.map((predicate) => predicate.ruleName || predicate.name).join(',');
        return _enhanceRule(rule, ruleName);
    }
}

function _enhanceRule(rule, ruleName) {
    rule.enforce = (context) => enforce(rule, context);
    rule.extend = (...others) => build(rule, ...others);
    rule.ruleName = ruleName || 'unnamed_rule';
    return rule;
}


//  (...predicates) => predicate
export function all(...predicates) {
    return (...args) => predicates.every((predicate) => predicate(...args));
}

export function any(...predicates) {
    return (...args) => predicates.some((predicate) => predicate(...args));
}

export function none(...predicates) {
    return (...args) => predicates.every((predicate) => !predicate(...args));
}

//  (...predicates) => rule
export const allow = _createRuleFactory(true);
export const deny = _createRuleFactory(false);

// combines rules to a single rule: "build" the ACL
// (...rule) => rule
export function build(...rules) {
    const combinedRule = (context) => {
        for (let rule of rules) {
            const result = rule(context);
            if (result !== null) {
                return result;
            }
        }
        return null; // so this can be used as a rule again
    }

    const ruleName = '( ' + rules.map((rule) => rule.ruleName).join(' | ') + ' )';
    return _enhanceRule(combinedRule, ruleName);
}

// enforces that the rule matches
export function enforce(rule, context) {
    if (!rule(context)) {
        throw new ACLRejectionError(rule, context);
    }
}

