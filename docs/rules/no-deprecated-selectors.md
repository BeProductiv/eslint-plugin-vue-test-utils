# Checks that Wrapper methods are called with appropriate selectors. (vue-test-utils/no-deprecated-selectors)

The `--fix` option on the command line can automatically fix some of the problems reported by this rule.

## Rule Details

This rule reports `Wrapper` `find*` and `get*` calls which are using improper selectors for their return types. For example, `find` should be called with a CSS selector and should be expected to return a DOM element, and `findComponent` should be called with a component selector and should be expected to return a Vue component.

Addiitonally, this rule reports `wrapper.vm` usages which are chained off an improper selector function. For example, `wrapper.find('div')` always returns a DOM element in VTU 2, making `wrapper.find('div').vm` an incorrect usage.

### Options

This rule has an object option:

-   `wrapperNames` can be set to an array of variable names that are checked for deprecated function calls.

Examples of **incorrect** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-selectors: "error" */
import MyComponent from './MyComponent.vue';

const wrapper = mount(MyComponent);

wrapper.get('div').vm.$emit('click');
wrapper.get(MyComponent).setProps(/* ... */);
expect(wrapper.findAll(FooComponent)).at(0)).toBeTruthy();
```

Examples of **correct** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-selectors: "error" */
import MyComponent from './MyComponent.vue';

const wrapper = mount(MyComponent);

wrapper.getComponent(DivComponent).vm.$emit('click');
wrapper.getComponent(MyComponent).setProps(/* ... */);
expect(wrapper.findAllComponents(FooComponent).at(0)).toBeTruthy();
```

Examples of **incorrect** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/no-deprecated-selectors: ["error", { "wrapperName": ["component"] }] */
import MyComponent from './MyComponent.vue';

const component = mount(MyComponent);

component.get('div').vm.$emit('click');
component.get(MyComponent).setProps(/* ... */);
expect(component.findAll(FooComponent).at(0)).toBeTruthy();
```

Examples of **correct** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/no-deprecated-selectors: ["error", { "wrapperName": ["component"] }] */
import MyComponent from './MyComponent.vue';

const component = mount(MyComponent);

component.getComponent(DivComponent).vm.$emit('click');
component.getComponent(MyComponent).setProps(/* ... */);

const wrapper = mount(MyComponent);

// not reported because `wrapper` is not in the list of `wrapperName`s
wrapper.get(MyComponent).vm.$emit('click');
```

## Limitations

-   This rule cannot detect wrappers if they are not stored into a local variable with a name matching one of the names in the `wrapperNames` option (eg, `mount(Foo).get(MyComponent)` will never error)

## When Not To Use It

-   Never

## Further Reading

-   [VTU 1 docs](https://vue-test-utils.vuejs.org/api/wrapper/#find)
