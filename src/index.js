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
        function rule(context) {
            console.log('running rule: ', rule.ruleName);
            // iterate over all predicates, see if they match
            for (let predicate of predicates) {
                // if the predicate does not match, the full rule does not
                // matche -> return null
                if (!predicate(context)) {
                    return null;
                }
            }

            // all predicates match -> return the result (true for allow, false for deny)
            return result;
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

export const allow = _createRuleFactory(true);
export const deny = _createRuleFactory(false);

// combines rules to a single rule: "build" the ACL
export function build(...rules) {
    const combinedRule = (context) => {
        console.log('running rule: ', combinedRule.ruleName);
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

