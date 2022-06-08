# Checks that mount and shallowMount options are valid for the current version of VTU. (vue-test-utils/no-deprecated-mount-options)

The `--fix` option on the command line can automatically fix some of the problems reported by this rule.

## Rule Details

This rule reports when mount options that are deprecated or unsupported in the current version of VTU are used.

### Options

This rule has an object option:

-   `ignoreMountOptions` can be set to an array of property names that are ignored when checking for deprecated mount options.
    -   This option is primarily useful when using a compatibility layer for Vue 3 or VTU 2 such as `@vue/compat` or `vue-test-utils-compat`.

Examples of **incorrect** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-mount-options: "error" */
import { mount } from '@vue/test-utils';

// VTU 1
mount(MyComponent, {
  attachToDocument: true,
});

mount(MyComponent, {
  computed: { /* ... */ }
  methods: { /* ... */ },
});

// VTU 2
mount(MyComponent, {
  propsData: { /* ... */ }
})

mount(MyComponent, {
  stubs: [/* ... */]
})
```

Examples of **correct** code for this rule:

```js
/* eslint vue-test-utils/no-deprecated-mount-options: "error" */
import { mount } from '@vue/test-utils';

// VTU 1
mount(MyComponent, {
    attachTo: document.body,
});

mount(MyComponent, {
    mixins: [
        /* ... */
    ],
});

// VTU 2
mount(MyComponent, {
    props: {
        /* ... */
    },
});

mount(MyComponent, {
    global: {
        stubs: [
            /* ... */
        ],
    },
});
```

Examples of **correct** code with the `{ "ignoreMountOptions": ["store", "scopedSlots"] }` option:

```js
/* eslint vue-test-utils/no-deprecated-mount-options: ["error", { "ignoreMountOptions": ["store", "scopedSlots"] }] */
import { mount } from '@vue/test-utils';

// VTU 2
mount(MyComponent, {
    store: createStore(/* ... */),
});

mount(MyComponent, {
    scopedSlots: {
        /* ... */
    },
});
```

## Limitations

-   This rule cannot detect mount options if they are passed via a variable (eg, `let context = { methods: {} }; mount(Foo, context)` will never error).
-   This rule cannot detect mount options passed via object spread or if the mount option keys are not identifiers (eg, `mount(Foo, { ...context }))` and `mount(Foo, { ['methods']: {} })` will never error).

## When Not To Use It

-   You don't plan to update to Vue 3/VTU 2

## Further Reading

-   [VTU 1 mount options](https://vue-test-utils.vuejs.org/api/options.html#context)
-   [VTU 2 mount options](https://test-utils.vuejs.org/api/#mount)
