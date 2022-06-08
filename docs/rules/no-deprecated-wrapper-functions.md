# Checks that no Wrapper functions which are deprecated are used. (vue-test-utils/no-deprecated-wrapper-functions)

This rule helps with upgrading VTU from v1 to v2 by warning of function calls which are deprecated and have been removed in v2.

## Rule Details

This rule reports `Wrapper` instance method calls which are deprecated in `@vue/test-utils` v2.

### Options

This rule has an object option:

-   `wrapperNames` can be set to an array of variables names that are checked for deprecated function calls.

Examples of **incorrect** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-wrapper-functions: "error" */
const wrapper = mount(MyComponent);

expect(wrapper.is('div')).toBe(false);
expect(wrapper.contains('div')).toBe(false);
```

Examples of **correct** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-wrapper-functions: "error" */
const wrapper = mount(MyComponent);

expect(wrapper.element.tagName).toEqual('div');
expect(wrapper.find('div')).toBeTruthy();
```

Examples of **incorrect** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/no-deprecated-wrapper-functions: ["error", { "wrapperName": ["component"] }] */
const component = mount(MyComponent);

expect(component.is('div')).toBe(false);
expect(component.contains('div')).toBe(false);
```

Examples of **correct** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/no-deprecated-wrapper-functions: ["error", { "wrapperName": ["component"] }] */
const component = mount(MyComponent);

expect(component.element.tagName).toEqual('div');
expect(component.find('div')).toBeTruthy();

const wrapper = mount(MyComponent);

// these are not reported because `wrapper` is not in the list of `wrapperName`s
expect(wrapper.contains('div')).toBe(false);
```

## Limitations

-   This rule cannot detect wrappers if they are not stored into a local variable (eg, `mount(Foo).contains('div')` will never error)

## When Not To Use It

-   When you are using VTU 2 already

## Further Reading

-   [VTU 2 Wrapper compatibility list](https://github.com/vuejs/test-utils#wrapper-api-mount)
