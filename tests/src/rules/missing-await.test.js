const rule = require('../../../src/rules/missing-await'),
    RuleTester = require('eslint').RuleTester;

const functionsToCheck = ['setChecked', 'setData', 'setMethods', 'setProps', 'setSelected', 'setValue', 'trigger'];

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2020 } });
ruleTester.run('missing-await', rule, {
    valid: [
        ...functionsToCheck.map(fn => ({
            code: `async () => await wrapper.${fn}()`,
        })),
        { code: 'async () => await wrapper.vm.$emit("click")' },
        { code: 'async () => await wrapper.getComponent(MyComponent).vm.$emit("click")' },
        { code: 'async () => await wrapper.findComponent(MyComponent).vm.$emit("click")' },
        { code: 'async () => await wrapper.findAllComponents(MyComponent).at(0).vm.$emit("click")' },
        { code: 'wrapper.setChecked(MyComponent)', options: [{ wrapperNames: ['foo'] }] }, // normally illegal but passes because of options
    ],

    invalid: [
        ...functionsToCheck.map(fn => ({
            code: `() => wrapper.${fn}()`,
            errors: [{ messageId: 'missingAwait', data: { identifier: fn } }],
            output: `async () => await wrapper.${fn}()`,
        })),
        ...functionsToCheck.map(fn => ({
            code: `async () => wrapper.${fn}()`,
            errors: [{ messageId: 'missingAwait', data: { identifier: fn } }],
            output: `async () => await wrapper.${fn}()`,
        })),
        {
            code: '() => wrapper.vm.$emit("click")',
            errors: [{ messageId: 'missingAwait', data: { identifier: 'vm.$emit' } }],
            output: `async () => await wrapper.vm.$emit("click")`,
        },
        {
            code: '() => wrapper.getComponent(MyComponent).vm.$emit("click")',
            errors: [{ messageId: 'missingAwait', data: { identifier: 'vm.$emit' } }],
            output: `async () => await wrapper.getComponent(MyComponent).vm.$emit("click")`,
        },
        {
            code: '() => wrapper.findComponent(MyComponent).vm.$emit("click")',
            errors: [{ messageId: 'missingAwait', data: { identifier: 'vm.$emit' } }],
            output: `async () => await wrapper.findComponent(MyComponent).vm.$emit("click")`,
        },
        {
            code: '() => wrapper.findAllComponents(MyComponent).at(0).vm.$emit("click")',
            errors: [{ messageId: 'missingAwait', data: { identifier: 'vm.$emit' } }],
            output: `async () => await wrapper.findAllComponents(MyComponent).at(0).vm.$emit("click")`,
        },
        {
            // wrapperNames option
            code: '() => foo.trigger(MyComponent)',
            options: [{ wrapperNames: ['foo'] }],
            errors: [{ messageId: 'missingAwait' }],
            output: `async () => await foo.trigger(MyComponent)`,
        },
    ],
});
