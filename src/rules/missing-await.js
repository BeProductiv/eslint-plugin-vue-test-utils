const path = require('path');
const { nodeIsCalledFromWrapper, nodeIsComponentEmit } = require('./utils');

const DEFAULT_WRAPPER_VARIABLES = ['wrapper'];

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Reports when wrapper methods which update the underlying component are not awaited',
            url: path.join(__dirname, '../../docs/rules/missing-await.md'),
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
            missingAwait:
                'wrapper.{{ identifier }}() should be awaited to ensure resulting component updates are visible',
        },
    },

    create(context) {
        const wrapperNames = (context.options[0] && context.options[0].wrapperNames) || DEFAULT_WRAPPER_VARIABLES;

        const functionsTriggeringComponentUpdate = new Set([
            'setChecked',
            'setData',
            'setMethods',
            'setProps',
            'setSelected',
            'setValue',
            'trigger',
        ]);

        function getContainingFunction(node) {
            while (node && !['ArrowFunctionExpression', 'FunctionExpression'].includes(node.type)) {
                node = node.parent;
            }
            return node;
        }

        function callTriggersUpdate(node) {
            if (node.callee.property.type !== 'Identifier') {
                return false;
            }

            const isWrapperUpdateFunction = functionsTriggeringComponentUpdate.has(node.callee.property.name);
            const isVmEmit = nodeIsComponentEmit(node);

            return (
                (isWrapperUpdateFunction || isVmEmit) &&
                nodeIsCalledFromWrapper(isVmEmit ? node.callee.object.object : node.callee.object, wrapperNames)
            );
        }

        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression') {
                    return;
                }

                if (callTriggersUpdate(node) && node.parent && node.parent.type !== 'AwaitExpression') {
                    context.report({
                        messageId: 'missingAwait',
                        node: node,
                        data: {
                            identifier: node.callee.property.name === '$emit' ? 'vm.$emit' : node.callee.property.name,
                        },
                        fix(fixer) {
                            const fixes = [fixer.insertTextBefore(node, 'await ')];
                            const containingFunction = getContainingFunction(node);
                            if (containingFunction && !containingFunction.async) {
                                fixes.push(fixer.insertTextBefore(containingFunction, 'async '));
                            }
                            return fixes;
                        },
                    });
                    return;
                }
            },
        };
    },
};
