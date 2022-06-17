This plugin provides the following rules:

# [vue-test-utils/missing-await](./missing-await.md)

Checks that Wrapper functions which trigger component updates are awaited.

This rule helps test writers make sure they have waited for any component updates to complete before trying to assert on them, preventing "but nothing happened!" syndrome.

# [vue-test-utils/no-deprecated-mount-options](./no-deprecated-mount-options.md)

Checks that mount and shallowMount options are valid for the current version of VTU.

This rule reports when mount options that are deprecated or unsupported in the current version of VTU are used.

# [vue-test-utils/no-deprecated-selectors](./no-deprecated-selectors.md)

Checks that Wrapper methods are called with appropriate selectors.

This rule reports `Wrapper` `find*` and `get*` calls which are using improper selectors for their return types. For example, `find` should be called with a CSS selector and should be expected to return a DOM element, and `findComponent` should be called with a component selector and should be expected to return a Vue component.

Additionally, this rule reports `wrapper.vm` usages which are chained off an improper selector function. For example, `wrapper.find('div')` always returns a DOM element in VTU 2, making `wrapper.find('div').vm` an incorrect usage.

# [vue-test-utils/no-deprecated-wrapper-functions](./no-deprecated-wrapper-functions.md)

Checks that no Wrapper functions which are deprecated are used.
This rule helps with upgrading VTU from v1 to v2 by warning of function calls which are deprecated and have been removed in v2.
This rule reports `Wrapper` instance method calls which are deprecated in `@vue/test-utils` v2.
