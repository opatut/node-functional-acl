const CACHE_KEY = '_functional_acl';

export default class ACL {
    rules = [];

    static get (obj) {
        if (!obj[CACHE_KEY]) {
            obj[CACHE_KEY] = new ACL();
            obj.fillACL(obj[CACHE_KEY]);
            obj.clearACL = () => {
                delete obj[CACHE_KEY];
            }
        }
        return obj[CACHE_KEY];
    }

    // @param userPredicate   (user) -> bool
    // @param operationPredicate (action) -> bool
    add(subject, operation, result) {
        let matches = (s, o, args) => subject(s, ...args) && operation(o, ...args);

        this.rules.push({ matches, result });
    }

    allow(subject, operation) {
        this.add(subject, operation, true);
    }

    deny(subject, operation) {
        this.add(subject, operation, false);
    }

    check(subject, operation, ...args) {
        for (let rule of this.rules) {
            if (rule.matches(subject, operation, args)) {
                return rule.result;
            }
        }
        return false;
    }
}

