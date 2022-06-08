const { flatMap } = require('lodash');

const rule = require('../../../src/rules/no-deprecated-mount-options'),
    RuleTester = require('eslint').RuleTester;

function genCodeString(mountFunctionName, mountFunctionOptions) {
    return `
        import { ${mountFunctionName} } from '@vue/test-utils';
        ${mountFunctionName}(MyComponent, ${
        typeof mountFunctionOptions === 'object' ? JSON.stringify(mountFunctionOptions) : mountFunctionOptions
    });
    `;
}

function mount(options) {
    return genCodeString('mount', options);
}

function shallowMount(options) {
    return genCodeString('shallowMount', options);
}

function makePassingTestCases(tests) {
    return flatMap(tests, ([mountOptions, ignoreMountOptions]) => [
        { code: mount(mountOptions), ...(ignoreMountOptions ? { options: [{ ignoreMountOptions }] } : {}) },
        {
            code: shallowMount(mountOptions),
            ...(ignoreMountOptions ? { options: [{ ignoreMountOptions }] } : {}),
        },
    ]);
}

function makeFailingTestCases(tests) {
    return flatMap(tests, ([mountOptions, errors, { ignoreMountOptions, fixedMountOptions } = {}]) =>
        [mount, shallowMount].map(fn => ({
            code: fn(mountOptions),
            errors: Array.isArray(errors) ? errors : [errors],
            ...(ignoreMountOptions ? { options: [{ ignoreMountOptions }] } : {}),
            ...(fixedMountOptions ? { output: fn(fixedMountOptions) } : {}),
        }))
    );
}

function makeDeprecatedMountOptionTestCase(mountOptionName, replacement) {
    return [
        { [mountOptionName]: {} },
        {
            messageId: 'deprecatedMountOption',
            data: {
                mountOption: mountOptionName,
                replacementOption: replacement ? ` Use '${replacement}' instead.` : '',
            },
        },
    ];
}

const falsePositiveTests = [
    { code: 'mount({ sync: true })' },
    { code: 'app.mount({ sync: true })' },
    { code: 'import { mount } from "@vue/test-utils"; app.mount({ sync: true });' },
    { code: 'import { mount } from "enzyme"; mount({ sync: true });' },
];

const vtu1InvalidTests = makeFailingTestCases([
    /* mountOptions, error(s), fixedOptions/pluginOptions */
    [{ sync: true }, { messageId: 'syncIsRemoved' }, { fixedMountOptions: {} }],
    [
        { attachToDocument: true },
        {
            messageId: 'deprecatedMountOption',
            data: { mountOption: 'attachToDocument', replacementOption: " Use 'attachTo' instead." },
        },
        { fixedMountOptions: '{attachTo:document.body}' },
    ],
    makeDeprecatedMountOptionTestCase('filters'),
    [
        { methods: {}, computed: {} },
        ['methods', 'computed'].map(opt => ({
            messageId: 'unknownMountOption',
            data: { mountOption: opt },
        })),
    ],
]);

describe('VTU 1', () => {
    const ruleTester = new RuleTester({
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
        settings: { vtu: { version: '1.3.0' } },
    });
    ruleTester.run('no-deprecated-mount-options', rule, {
        valid: [
            ...falsePositiveTests,
            ...makePassingTestCases([
                [
                    {
                        data() {},
                        slots: {},
                        scopedSlots: {},
                        stubs: [],
                        mocks: {},
                        localVue: {},
                        attachTo: null,
                        attrs: {},
                        propsData: {},
                        provide: {},
                        listeners: {},
                        components: {},
                        directives: {},
                        mixins: {},
                        store: {},
                        router: {},
                    },
                ],
                [{ filters: {} }, ['filters']],
            ]),
        ],

        invalid: vtu1InvalidTests,
    });
});

describe('VTU 2', () => {
    const ruleTester = new RuleTester({
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
        settings: { vtu: { version: '2.0.0' } },
    });
    ruleTester.run('no-deprecated-mount-options', rule, {
        valid: [
            ...falsePositiveTests,
            ...makePassingTestCases([
                [{ attachTo: null, attrs: {}, data() {}, props: {}, slots: {}, global: {}, shallow: true }],
                [
                    {
                        attachTo: null,
                        attrs: {},
                        data() {},
                        props: {},
                        slots: {},
                        global: {},
                        shallow: true,
                        localVue: null,
                        store: {},
                    },
                    ['localVue', 'store'],
                ],
            ]),
        ],

        invalid: [
            ...vtu1InvalidTests,
            ...makeFailingTestCases([
                makeDeprecatedMountOptionTestCase('context'),
                makeDeprecatedMountOptionTestCase('listeners', 'props'),
                makeDeprecatedMountOptionTestCase('stubs', 'global.stubs'),
                makeDeprecatedMountOptionTestCase('mocks', 'global.mocks'),
                makeDeprecatedMountOptionTestCase('propsData', 'props'),
                makeDeprecatedMountOptionTestCase('provide', 'global.provide'),
                makeDeprecatedMountOptionTestCase('localVue', 'global'),
                makeDeprecatedMountOptionTestCase('scopedSlots', 'slots'),
                makeDeprecatedMountOptionTestCase('components', 'global.components'),
                makeDeprecatedMountOptionTestCase('directives', 'global.directives'),
                makeDeprecatedMountOptionTestCase('mixins', 'global.mixins'),
                makeDeprecatedMountOptionTestCase('store', 'global.plugins'),
                makeDeprecatedMountOptionTestCase('router', 'global.plugins'),
            ]),
        ],
    });
});
