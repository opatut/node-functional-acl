<a name="0.5.0"></a>
# [0.5.0](https://github.com/opatut/node-functional-acl/compare/0.4.0...0.5.0) (2016-06-06)


### Features

* rename all->every and any->some to match JS spec ([ce706d4](https://github.com/opatut/node-functional-acl/commit/ce706d4))


### BREAKING CHANGES

* rename all->every, rename any->some



<a name="0.4.0"></a>
# [0.4.0](https://github.com/opatut/node-functional-acl/compare/0.3.1...0.4.0) (2016-06-01)


### Features

* renames and cleanup, add tests ([fe89a1d](https://github.com/opatut/node-functional-acl/commit/fe89a1d))


### BREAKING CHANGES

* Lots of renames, see new API description. Most
importantly, `build` is now called `combineRules`. Also some API
changes.



<a name="0.3.1"></a>
## [0.3.1](https://github.com/opatut/node-functional-acl/compare/0.3.0...0.3.1) (2016-05-31)


### Features

* update .npmignore ([08ee380](https://github.com/opatut/node-functional-acl/commit/08ee380))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/opatut/node-functional-acl/compare/0.2.0...0.3.0) (2016-05-31)


### Features

* export always/never, change `not` ([d0d4b71](https://github.com/opatut/node-functional-acl/commit/d0d4b71))


### BREAKING CHANGES

* `not` only takes a single predicate



<a name="0.2.0"></a>
# [0.2.0](https://github.com/opatut/node-functional-acl/compare/0.1.0...0.2.0) (2016-05-31)


### Features

* allow only one predicate for allow/deny ([398c37c](https://github.com/opatut/node-functional-acl/commit/398c37c))


### BREAKING CHANGES

* `allow`/`deny` now only take one argument, combine with `all` yourself!



<a name="0.1.0"></a>
# [0.1.0](https://github.com/opatut/node-functional-acl/compare/d8b74ab...0.1.0) (2016-05-31)


### Features

* export `not` as alias to `none` ([d8b74ab](https://github.com/opatut/node-functional-acl/commit/d8b74ab))



