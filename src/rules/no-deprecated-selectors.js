const { get } = require('lodash');
const path = require('path');
const isVtuVersionAtLeast = require('./checkVtuVersion');
const { VTU_PLUGIN_SETTINGS_KEY } = require('./constants');
const { nodeIsCalledFromWrapper, nodeCalleeReturnsWrapper, isComponentSelector } = require('./utils');
const { detectVtuVersion } = isVtuVersionAtLeast;

const DEFAULT_WRAPPER_VARIABLES = ['wrapper'];

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'disallow deprecated selector usage',
            url: path.join(__dirname, '../../docs/rules/no-deprecated-selectors.md'),
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
            deprecatedComponentSelector:
                'Calling {{ functionName }} with a component selector is deprecated and will be removed in VTU 2.',
            memberUsageFromDeprecatedSelector:
                '{{ functionName }} will no longer return `wrapper.{{ missingMemberName }}` in VTU 2. Use {{ alternateFunctionName }} with a component selector instead.',
        },
    },

    create(context) {
        const wrapperNames = (context.options[0] && context.options[0].wrapperNames) || DEFAULT_WRAPPER_VARIABLES;
        const vtuVersion = get(context.settings, [VTU_PLUGIN_SETTINGS_KEY, 'version']) || detectVtuVersion();

        const componentOnlyWrapperMembers = new Set(['vm', 'props', 'setData', 'setProps', 'emitted']);

        const deprecatedComponentSelectorFunctions = {
            // functionName => preferred name
            find: 'findComponent',
            findAll: 'findAllComponents',
            get: 'getComponent',
        };

        const canChainComponentsFromCssWrappers = isVtuVersionAtLeast(vtuVersion, '1.3.0');

        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression' || node.callee.property.type !== 'Identifier') {
                    return;
                }

                if (
                    node.callee.property.name in deprecatedComponentSelectorFunctions &&
                    nodeIsCalledFromWrapper(node.callee.object, wrapperNames)
                ) {
                    // these functions should always have strings passed to them, never objects or components
                    if (node.arguments[0] && isComponentSelector(node.arguments[0], context)) {
                        let isSuccessiveWrapperChain = false;
                        let wrapperSelectorCall = node.callee.object;
                        while (nodeCalleeReturnsWrapper(wrapperSelectorCall)) {
                            if (wrapperSelectorCall.callee.property.name in deprecatedComponentSelectorFunctions) {
                                // cannot autofix in versions before 1.3 because this is a chain like `get('div').get(SomeComponent)`.
                                // Autofixing to `get('div').getComponent(SomeComponent)` will cause an error on those versions
                                isSuccessiveWrapperChain = true;
                                break;
                            }
                            wrapperSelectorCall = wrapperSelectorCall.callee.object;
                        }

                        context.report({
                            messageId: 'deprecatedComponentSelector',
                            node: node.arguments[0],
                            data: {
                                functionName: node.callee.property.name,
                            },
                            fix:
                                (isSuccessiveWrapperChain && !canChainComponentsFromCssWrappers)
                                    ? undefined
                                    : fixer => {
                                          return fixer.replaceText(
                                              node.callee.property,
                                              deprecatedComponentSelectorFunctions[node.callee.property.name]
                                          );
                                      },
                        });
                        return;
                    }
                }
            },
            MemberExpression(node) {
                if (
                    node.property.type === 'Identifier' &&
                    componentOnlyWrapperMembers.has(node.property.name) &&
                    nodeIsCalledFromWrapper(node.object, wrapperNames) &&
                    nodeCalleeReturnsWrapper(node.object) // if object isn't a call which returns wrapper, then member usage is rooted directly off wrapper which is safe
                ) {
                    // the member usage should be not be chained immediately after a non-component selector function
                    // (okay if previous calls don't return components as long as the last one does)
                    let lastWrapperCall = node.object;
                    if (
                        lastWrapperCall.callee.property.name === 'at' &&
                        nodeCalleeReturnsWrapper(lastWrapperCall.callee.object)
                    ) {
                        // special handling for findAll().at().foo - need to make sure we're looking at the 'findAll',
                        // not the 'at'
                        lastWrapperCall = lastWrapperCall.callee.object;
                    }
                    if (lastWrapperCall.callee.property.name in deprecatedComponentSelectorFunctions) {
                        context.report({
                            messageId: 'memberUsageFromDeprecatedSelector',
                            node,
                            data: {
                                functionName: lastWrapperCall.callee.property.name,
                                missingMemberName: node.property.name,
                                alternateFunctionName:
                                    deprecatedComponentSelectorFunctions[lastWrapperCall.callee.property.name],
                            },
                        });
                        return;
                    }
                }
            },
        };
    },
};
