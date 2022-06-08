# Checks that Wrapper functions which trigger component updates are awaited. (vue-test-utils/missing-await)

The `--fix` option on the command line can automatically fix the problems reported by this rule.

This rule helps test writers make sure they have waited for any component updates to complete before trying to assert on them, preventing "but nothing happened!" syndrome.

## Rule Details

This rule reports wrapper function calls which return Promises and probably need to be awaited to observe their effect on the component wrapped by the wrapper.

### Options

This rule has an object option:

-   `wrapperNames` can be set to an array of variables names that are checked for deprecated function calls.

Examples of **incorrect** code for this rule:

```js
/* eslint vue-test-utils/missing-await: "error" */
it('does the thing', () => {
    const wrapper = mount(MyComponent);

    wrapper.get('button').trigger('click');
    wrapper.getComponent(Foo).vm.$emit('click');

    expect(wrapper.findAll('div').at(0)).toBeTruthy();
});
```

Examples of **correct** code for this rule:

```js
/* eslint vue-test-utils/missing-await: "error" */
it('does the thing', async () => {
    const wrapper = mount(MyComponent);

    await wrapper.get('button').trigger('click');
    await wrapper.getComponent(MyComponent).vm.$emit('click');

    expect(wrapper.findAll('div').at(0)).toBeTruthy();
});
```

Examples of **incorrect** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/missing-await: ["error", { "wrapperName": ["component"] }] */
it('does the thing', () => {
    const component = mount(MyComponent);

    component.get('button').trigger('click');
    component.getComponent(Foo).vm.$emit('click');

    expect(component.findAll('div').at(0)).toBeTruthy();
});
```

Examples of **correct** code with the `{ "wrapperName": ["component"] }` option:

```js
/* eslint vue-test-utils/missing-await: ["error", { "wrapperName": ["component"] }] */
it('does the thing', async () => {
    const component = mount(MyComponent);

    await component.get('button').trigger('click');
    await component.getComponent(MyComponent).vm.$emit('click');

    expect(component.findAll('div').at(0)).toBeTruthy();
});

it("doesn't the thing", () => {
    const wrapper = mount(MyComponent);

    // not reported because `wrapper` is not in the list of `wrapperName`s
    wrapper.getComponent(MyComponent).vm.$emit('click');
});
```

## Limitations

-   This rule cannot detect wrappers if they are not stored into a local variable (eg, `mount(Foo).trigger('click')` will never error)

## When Not To Use It

-   You are manually flushing component updates with `wrapper.$vm.nextTick()` or `flushPromises()`
-   You are using a VTU version from before these methods were made async

## Further Reading

-   [VTU 1 docs](https://vue-test-utils.vuejs.org/api/wrapper/#trigger)
