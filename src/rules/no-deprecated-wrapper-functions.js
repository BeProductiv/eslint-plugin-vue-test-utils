const path = require('path');
const { nodeIsCalledFromWrapper } = require('./utils');

const DEFAULT_WRAPPER_VARIABLES = ['wrapper'];

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'disallow deprecated Wrapper functions',
            url: path.join(__dirname, '../../docs/rules/no-deprecated-wrapper-functions.md'),
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    wrapperNames: {
                        description: 'List of variable names to which wrappers are typically assigned',
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
            },
        ], // Add a schema if the rule has options
        messages: {
            deprecatedFunction:
                '{{ identifier }} is deprecated and will be removed in VTU 2.{{ alternativeSuggestion }}',
        },
    },

    create(context) {
        const wrapperNames = (context.options[0] && context.options[0].wrapperNames) || DEFAULT_WRAPPER_VARIABLES;

        const deprecatedFunctionNames = new Set([
            'emittedByOrder',
            'contains',
            'is',
            'isEmpty',
            'isVueInstance',
            'name',
            'setMethods',
            // these two are kind of weird. they are rolled into setValue() in VTU 2 but I don't think
            // setValue worked to replace these in VTU 1 - or at least, I don't know for sure that they do.
            'setSelected',
            'setChecked',
        ]);

        const alternativeSuggestions = {
            contains: 'exists()',
            is: 'classes(), attributes(), or element.tagName',
            isEmpty: 'exists(), isVisible(), or a custom matcher from jest-dom',
            name: 'vm.$options.name',
            emittedByOrder: 'emitted()',
        };

        const autofixableFunctions = {
            /**
             *
             * @param {*} node
             * @param {import('eslint').Rule.RuleFixer} fixer
             */
            contains: (node, fixer) => {
                return [fixer.replaceText(node.callee.property, 'find'), fixer.insertTextAfter(node, '.exists()')];
            },
        };

        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression') {
                    return;
                }

                if (
                    node.callee.property.type === 'Identifier' &&
                    deprecatedFunctionNames.has(node.callee.property.name) &&
                    nodeIsCalledFromWrapper(node.callee.object, wrapperNames)
                ) {
                    context.report({
                        messageId: 'deprecatedFunction',
                        node: node.callee.property,
                        data: {
                            identifier: node.callee.property.name,
                            alternativeSuggestion: alternativeSuggestions[node.callee.property.name]
                                ? ` Consider using ${alternativeSuggestions[node.callee.property.name]} instead.`
                                : '',
                        },
                        fix:
                            autofixableFunctions[node.callee.property.name] &&
                            autofixableFunctions[node.callee.property.name].bind(this, node),
                    });
                    return;
                }
            },
        };
    },
};
