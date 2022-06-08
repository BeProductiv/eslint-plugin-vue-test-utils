const { flatMap } = require('lodash');

const rule = require('../../../src/rules/no-deprecated-selectors'),
    RuleTester = require('eslint').RuleTester;

const componentOnlyWrapperMembers = ['vm', 'props', 'setData', 'setProps', 'emitted'];

describe('version independent tests', () => {
    const ruleTester = new RuleTester({
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
        settings: { vtu: { version: '1.2.0' } },
    });
    ruleTester.run('no-deprecated-selectors', rule, {
        valid: [
            { code: 'import MyComponent from "./MyComponent.vue"; wrapper.findAllComponents(MyComponent)' },
            { code: 'import MyComponent from "./MyComponent.vue"; wrapper.findComponent(MyComponent)' },
            { code: 'wrapper.findAllComponents({ name: "MyComponent" })' },
            { code: 'wrapper.findComponent({ name: "MyComponent" })' },
            { code: "wrapper.findAll('div')" },
            { code: "wrapper.find('div')" },
            { code: "wrapper.get('div')" },
            { code: "const button = 'button'; wrapper.get(button);" },
            { code: 'import MyComponent from "./MyComponent.vue"; wrapper.getComponent(MyComponent)' },
            { code: 'wrapper.getComponent({ name: "MyComponent" })' },
            { code: 'wrapper.vm' },
            ...flatMap(componentOnlyWrapperMembers, member => [
                { code: `wrapper.getComponent("div").${member}` },
                { code: `wrapper.get("div").getComponent("div").${member}` },
                { code: `wrapper.findAllComponents("div").at(0).${member}` },
            ]),
            {
                // normally illegal but passes because of options
                code: 'import MyComponent from "./MyComponent.vue"; wrapper.find(MyComponent)',
                options: [{ wrapperNames: ['foo'] }],
            },
        ],

        invalid: [
            {
                code: 'import MyComponent from "./MyComponent.vue"; wrapper.find(MyComponent)',
                errors: [{ messageId: 'deprecatedComponentSelector' }],
                output: 'import MyComponent from "./MyComponent.vue"; wrapper.findComponent(MyComponent)',
            },
            {
                code: "wrapper.find({ name: 'MyComponent' })",
                errors: [{ messageId: 'deprecatedComponentSelector' }],
                output: "wrapper.findComponent({ name: 'MyComponent' })",
            },
            {
                // chained functions
                code: "import MyComponent from './MyComponent.vue'; wrapper.get(MyComponent).contains('div')",
                errors: [{ messageId: 'deprecatedComponentSelector', data: { functionName: 'get' } }],
                output:
                    "import MyComponent from './MyComponent.vue'; wrapper.getComponent(MyComponent).contains('div')",
            },
            {
                // chained functions with at()
                code: "import MyComponent from './MyComponent.vue'; wrapper.findAll(MyComponent).at(2).contains('div')",
                errors: [{ messageId: 'deprecatedComponentSelector', data: { functionName: 'findAll' } }],
                output:
                    "import MyComponent from './MyComponent.vue'; wrapper.findAllComponents(MyComponent).at(2).contains('div')",
            },
            ...flatMap(componentOnlyWrapperMembers, member => [
                {
                    // member usage off non-component selector function
                    code: `wrapper.get('div').${member}`,
                    errors: [
                        {
                            messageId: 'memberUsageFromDeprecatedSelector',
                            data: {
                                functionName: 'get',
                                alternateFunctionName: 'getComponent',
                                missingMemberName: member,
                            },
                        },
                    ],
                    output: `wrapper.get('div').${member}`,
                },
                {
                    // member usage off non-component findAll().at()
                    code: `wrapper.findAll('div').at(0).${member}`,
                    errors: [
                        {
                            messageId: 'memberUsageFromDeprecatedSelector',
                            data: {
                                functionName: 'findAll',
                                alternateFunctionName: 'findAllComponents',
                                missingMemberName: member,
                            },
                        },
                    ],
                    output: `wrapper.findAll('div').at(0).${member}`,
                },
                {
                    // chained member usage off non-component wrapper getter
                    code: `wrapper.get('div').get('div').${member}`,
                    errors: [
                        {
                            messageId: 'memberUsageFromDeprecatedSelector',
                            data: {
                                functionName: 'get',
                                alternateFunctionName: 'getComponent',
                                missingMemberName: member,
                            },
                        },
                    ],
                    output: `wrapper.get('div').get('div').${member}`,
                },
            ]),
            {
                // wrapperNames option
                code: 'import MyComponent from "./MyComponent.vue"; foo.find(MyComponent)',
                options: [{ wrapperNames: ['foo'] }],
                errors: [{ messageId: 'deprecatedComponentSelector' }],
                output: 'import MyComponent from "./MyComponent.vue"; foo.findComponent(MyComponent)',
            },
        ],
    });
});

describe('version 1.2.2', () => {
    const ruleTester = new RuleTester({
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
        settings: { vtu: { version: '1.2.2' } },
    });
    ruleTester.run('no-deprecated-selectors', rule, {
        valid: [{ code: 'wrapper.get("div").getComponent("div").vm' }],

        invalid: [
            {
                // deprecated selector chained off DOM selector cannot be autofixed until 1.3.0
                code: "import MyComponent from './MyComponent.vue'; wrapper.get('div').get(MyComponent)",
                errors: [
                    {
                        messageId: 'deprecatedComponentSelector',
                        data: { functionName: 'get' },
                    },
                ],
                output: "import MyComponent from './MyComponent.vue'; wrapper.get('div').get(MyComponent)",
            },
        ],
    });
});

describe('version 1.3.0', () => {
    const ruleTester = new RuleTester({
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
        settings: { vtu: { version: '1.3.0' } },
    });
    ruleTester.run('no-deprecated-selectors', rule, {
        valid: [{ code: 'wrapper.get("div").getComponent("div").vm' }],

        invalid: [
            {
                // deprecated selector chained off DOM selector can be autofixed in vtu 1.3.0
                code: "import MyComponent from './MyComponent.vue'; wrapper.get('div').get(MyComponent)",
                errors: [
                    {
                        messageId: 'deprecatedComponentSelector',
                        data: { functionName: 'get' },
                    },
                ],
                output: "import MyComponent from './MyComponent.vue'; wrapper.get('div').getComponent(MyComponent)",
            },
        ],
    });
});
