const rule = require('../../../src/rules/no-deprecated-wrapper-functions'),
    RuleTester = require('eslint').RuleTester;

const removedFunctionNames = [
    'contains',
    'emittedByOrder',
    'setSelected',
    'setChecked',
    'is',
    'isEmpty',
    'isVueInstance',
    'name',
    'setMethods',
];

const alternativeSuggestions = {
    contains: 'exists()',
    is: 'classes(), attributes(), or element.tagName',
    isEmpty: 'exists(), isVisible(), or a custom matcher from jest-dom',
    name: 'vm.$options.name',
    emittedByOrder: 'emitted()',
};

const ruleTester = new RuleTester();
ruleTester.run('no-deprecated-wrapper-functions', rule, {
    valid: [
        { code: 'wrapper.html()' },
        { code: 'wrapper.contains(MyComponent)', options: [{ wrapperNames: ['foo'] }] }, // normally illegal but passes because of options
    ],

    invalid: [
        ...removedFunctionNames.map(functionName => ({
            code: `wrapper.${functionName}('div')`,
            errors: [
                {
                    messageId: 'deprecatedFunction',
                    data: {
                        identifier: functionName,
                        alternativeSuggestion: alternativeSuggestions[functionName]
                            ? ` Consider using ${alternativeSuggestions[functionName]} instead.`
                            : '',
                    },
                },
            ],
        })),
        {
            // chained functions with at()
            code: "wrapper.findAllComponents(MyComponent).at(2).contains('div')",
            errors: [
                {
                    messageId: 'deprecatedFunction',
                    data: { identifier: 'contains', alternativeSuggestion: ' Consider using exists() instead.' },
                },
            ],
        },
        {
            // chained functions
            code: "wrapper.get(MyComponent).contains('div')",
            errors: [
                {
                    messageId: 'deprecatedFunction',
                    data: { identifier: 'contains', alternativeSuggestion: ' Consider using exists() instead.' },
                },
            ],
        },
        {
            // wrapperNames option
            code: 'foo.contains(MyComponent)',
            options: [{ wrapperNames: ['foo'] }],
            errors: [
                {
                    messageId: 'deprecatedFunction',
                    data: { identifier: 'contains', alternativeSuggestion: ' Consider using exists() instead.' },
                },
            ],
        },
    ],
});
