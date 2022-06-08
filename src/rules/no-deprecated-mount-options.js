const { get } = require('lodash');
const path = require('path');
const isVtuVersionAtLeast = require('./checkVtuVersion');
const { VTU_PLUGIN_SETTINGS_KEY } = require('./constants');
const { isVtuImport } = require('./utils');
const { detectVtuVersion } = isVtuVersionAtLeast;

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'disallow deprecated mount options',
            url: path.join(__dirname, '../../docs/rules/no-deprecated-mount-options.md'),
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    ignoreMountOptions: {
                        description: 'List of mount option property names to ignore',
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
            },
        ], // Add a schema if the rule has options
        messages: {
            deprecatedMountOption:
                'The mount option `{{ mountOption }}` is deprecated and will be removed in VTU 2.{{ replacementOption }}',
            unknownMountOption:
                'The mount option `{{ mountOption }}` is relying on component option merging and will have no effect in VTU 2.',
            syncIsRemoved: 'The mount option `sync` was removed in VTU 1.0.0-beta.30 and has no effect.',
        },
    },

    create(context) {
        const allowedMountOptions = (context.options[0] && context.options[0].ignoreMountOptions) || [];
        const vtuVersion = get(context.settings, [VTU_PLUGIN_SETTINGS_KEY, 'version']) || detectVtuVersion();

        const sourceCode = context.getSourceCode();

        const isComma = token => {
            return token.type === 'Punctuator' && token.value === ',';
        };

        const getPropertyName = property =>
            property.key.type === 'Identifier' ? property.key.name : property.key.value;

        function deleteProperty(/** @type {import('eslint').Rule.RuleFixer} */ fixer, property) {
            const afterProperty = sourceCode.getTokenAfter(property);
            const hasComma = isComma(afterProperty);

            return fixer.removeRange([property.range[0], hasComma ? afterProperty.range[1] : property.range[1]]);
        }

        const isVtu2 = isVtuVersionAtLeast(vtuVersion, '2.0.0');

        const removedOptions = {
            // deprecated or replaceable in vtu 1/vue 2
            attachToDocument: {
                replacementOption: 'attachTo',
                fixer: (/** @type {import('eslint').Rule.RuleFixer} */ fixer, property) => [
                    fixer.replaceText(property.key, 'attachTo'),
                    fixer.replaceText(property.value, 'document.body'),
                ],
            },
            parentComponent: null,
            filters: null,

            // removed or moved in vtu 2
            context: null,
            listeners: {
                replacementOption: 'props',
            },
            stubs: {
                replacementOption: 'global.stubs',
            },
            mocks: {
                replacementOption: 'global.mocks',
            },
            propsData: {
                replacementOption: 'props',
            },
            provide: {
                replacementOption: 'global.provide',
            },
            localVue: {
                replacementOption: 'global',
            },
            scopedSlots: {
                replacementOption: 'slots',
            },

            // not explicitly removed but has trivial replacement
            components: {
                replacementOption: 'global.components',
            },
            directives: {
                replacementOption: 'global.directives',
            },
            mixins: {
                replacementOption: 'global.mixins',
            },
            store: {
                replacementOption: 'global.plugins',
            },
            router: {
                replacementOption: 'global.plugins',
            },
        };

        const knownValidMountOptions = isVtu2
            ? new Set(['attachTo', 'attrs', 'data', 'props', 'slots', 'global', 'shallow'])
            : new Set([
                  'context',
                  'data',
                  'slots',
                  'scopedSlots',
                  'stubs',
                  'mocks',
                  'localVue',
                  'attachTo',
                  'attrs',
                  'propsData',
                  'provide',
                  'listeners',

                  // these properties technically rely on configuration merging
                  // with the underlying component but are common practice and
                  // have an autofixable replacement in VTU 2
                  'components',
                  'directives',
                  'mixins',
                  'store',
                  'router',
              ]);
        // add user-whitelisted options
        allowedMountOptions.forEach(opt => knownValidMountOptions.add(opt));

        const mountFunctionNames = new Set(['mount', 'shallowMount']);

        return {
            CallExpression(node) {
                if (node.callee.type !== 'Identifier' || !mountFunctionNames.has(node.callee.name)) {
                    return;
                }
                if (!isVtuImport(node.callee, context.getScope())) {
                    return;
                }

                const mountOptionsNode = node.arguments[1];
                if (!mountOptionsNode || mountOptionsNode.type !== 'ObjectExpression') {
                    // second argument is not object literal
                    return;
                }

                // filter out object spreads
                /** @type {import('estree').Property[]} */
                const properties = mountOptionsNode.properties.filter(({ type }) => type === 'Property');

                properties.forEach(property => {
                    if (property.key.type !== 'Identifier' && property.key.type !== 'Literal') {
                        return;
                    }
                    const keyName = getPropertyName(property);
                    if (keyName === 'sync' && isVtuVersionAtLeast(vtuVersion, '1.0.0-beta.30')) {
                        context.report({
                            messageId: 'syncIsRemoved',
                            node: property,
                            fix(fixer) {
                                return deleteProperty(fixer, property);
                            },
                        });
                    } else if (!knownValidMountOptions.has(keyName)) {
                        context.report({
                            messageId: !(keyName in removedOptions) ? 'unknownMountOption' : 'deprecatedMountOption',
                            node: property,
                            fix:
                                removedOptions[keyName] && removedOptions[keyName].fixer
                                    ? fixer => removedOptions[keyName].fixer(fixer, property, mountOptionsNode)
                                    : undefined,
                            data: {
                                mountOption: keyName,
                                replacementOption: removedOptions[keyName]
                                    ? ` Use '${removedOptions[keyName].replacementOption}' instead.`
                                    : '',
                            },
                        });
                    }
                });
            },
        };
    },
};
