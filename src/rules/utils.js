const functionNamesReturningWrappers = [
    'find',
    'findAll',
    'findComponent',
    'findAllComponents',
    'get',
    'getComponent',
    'at',
];

function nodeCalleeReturnsWrapper(node) {
    return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        functionNamesReturningWrappers.includes(node.callee.property.name)
    );
}

/**
 * Returns true if the memberObjectNode is an identifier with a name in the provided
 * list of `wrapperNames`, or is a function call which returns a wrapper and that function
 * call was chained off something which is a wrapper.
 * @returns {boolean} node was (probably) called from a wrapper
 */
function nodeIsCalledFromWrapper(memberObjectNode, wrapperNames) {
    // examples of memberObjectNode: the `wrapper.get(MyComponent)` in `wrapper.get(MyComponent).contains()`
    // examples of 'memberObjectNode.object:
    // the '1234' in '1234'.split() or the `wrapper` in `wrapper.get()`
    // examples of memberObjectNode.property:
    // things like the `['asdf']` in `foo['asdf']()`. or the `get` in `wrapper.get()`

    // this while loop checks that in a construct like `wrapper.get('div').contains()`,
    // `wrapper.contains()`, `[1, 2, 3].contains()`, etc:
    // - the expression is a function call
    // - that function call is a call of the form `AAAA(BBBB)`
    // - that `AAAA` is a member (property) access in the form of `xxxx.yyyy`
    // - that `yyyy` is an identifier who's name matches one of the ones which returns another wrapper
    // then, the loop repeats on `xxxx`, which may itself be another chained function call of the form AAAA(BBBB)
    // at the end of the loop, we know that we have arrived at something which is either:
    // - an identifier which started the chain, OR
    // - something else which is definitely not a wrapper
    while (nodeCalleeReturnsWrapper(memberObjectNode)) {
        memberObjectNode = memberObjectNode.callee.object;
    }

    // checks that the final `xxxx` from the steps above is an identifier which matches one of the valid
    // passed in wrapper names
    // (eg, confirms that the root of this function call started at a variable named 'wrapper')
    if (memberObjectNode.type === 'Identifier' && wrapperNames.includes(memberObjectNode.name)) {
        return true;
    }

    // on all other constructs, decide this is not a wrapper.
    return false;
}

/**
 * Returns true if the node represents a function call which is triggering a custom component
 * emit. Eg, `wrapper.getComponent(MyComponent).vm.$emit('....')` returns true.
 * @param {*} node
 * @returns {boolean}
 */
function nodeIsComponentEmit(node) {
    return (
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'MemberExpression' &&
        node.callee.object.property.name === 'vm' &&
        node.callee.property.name === '$emit'
    );
}

function resolveIdentifierToVariable(identifierNode, scope) {
    if (identifierNode.type !== 'Identifier') {
        return null;
    }

    while (scope) {
        const boundIdentifier = scope.variables.find(({ name }) => name === identifierNode.name);
        if (boundIdentifier) {
            return boundIdentifier;
        }
        scope = scope.upper;
    }

    return null;
}

function getImportSourceName(boundIdentifier) {
    const importDefinition = boundIdentifier.defs.find(({ type }) => type === 'ImportBinding');
    return importDefinition.node.parent.source.value;
}

function isComponentImport(importSourceName, identifierName, filename) {
    let resolvedModulePath;
    try {
        resolvedModulePath = require.resolve(importSourceName, { paths: [filename] });
    } catch {
        return false; // install your packages, heathens!
    }

    try {
        // require() does not take { paths } argument, so need to pass resolved filename directly
        const m = require(resolvedModulePath);
        const imported = identifierName ? m[identifierName] : m;

        // close enough, right?
        return typeof imported === 'object' || typeof imported === 'function';
    } catch {
        // some packages can't be imported in node. fall back to a secondary detection.
        // it isn't perfect but it should work pretty okay for most working tests and vue libraries.
        return resolvedModulePath.includes('node_modules') && importSourceName.includes('vue');
    }
}

/**
 *
 * @param {*} node
 * @param {import('eslint').Rule.RuleContext} context
 * @returns
 */
function isComponentSelector(node, context) {
    if (node.type === 'ObjectExpression') {
        return true;
    }

    const boundIdentifier = resolveIdentifierToVariable(node, context.getScope());
    if (!boundIdentifier) {
        return false;
    }

    const importDefinition = boundIdentifier.defs.find(({ type }) => type === 'ImportBinding');
    if (importDefinition) {
        const importedName =
            importDefinition.node.type === 'ImportSpecifier'
                ? importDefinition.node.imported.name
                : /* default import */ undefined;
        const importSourceName = getImportSourceName(boundIdentifier);

        const isVueSourceFileImport = importSourceName.endsWith('.vue');

        // short circuit to avoid costly module resolution attempts
        return (
            isVueSourceFileImport ||
            isComponentImport(
                importSourceName,
                importedName,
                // <text> is a special value indicating the input came from stdin
                context.getFilename() === '<text>' ? context.getCwd() : context.getFilename()
            )
        );
    }

    // note(@alexv): could potentially add logic here to check for object literal assignment, require(), or mount()
    return false;
}

function isVtuImport(identifierNode, scope) {
    const boundIdentifier = resolveIdentifierToVariable(identifierNode, scope);
    if (!boundIdentifier) {
        return false;
    }
    return getImportSourceName(boundIdentifier) === '@vue/test-utils';
}

module.exports = {
    nodeCalleeReturnsWrapper,
    nodeIsCalledFromWrapper,
    nodeIsComponentEmit,
    resolveIdentifierToVariable,
    isComponentSelector,
    isVtuImport,
};
