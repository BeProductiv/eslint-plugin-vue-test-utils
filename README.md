# eslint-plugin-vue-test-utils

[![npm version](https://badge.fury.io/js/eslint-plugin-vue-test-utils.svg)](https://badge.fury.io/js/eslint-plugin-vue-test-utils)

Linting for [@vue/test-utils](https://github.com/vuejs/test-utils).

## Installation

```
npm install --save-dev eslint eslint-plugin-vue-test-utils
```

## Usage

Add `vue-test-utils` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": ["vue-test-utils"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "vue-test-utils/no-deprecated-wrapper-functions": "error"
    }
}
```

Alternatively, extend the recommended configuration:

```json
{
    "extends": [
        "eslint-recommended",
        // ...
        "plugin:vue-test-utils/recommended"
    ]
}
```

The recommended configuration will enable all rules as errors. Specific rules can be overriden
as described above.

### Setting the VTU version

Some rules have different behavior depending on the version of VTU that is being used. If the plugin and VTU are not installed in the same directory (possible in some monorepo configurations), VTU's version will not be able to be auto-detected and you will get an error. In this case, you can set it manually in your `.eslintrc`:

```json
{
    "settings": {
        "vtu": {
            "version": "1.3.0"
        }
    }
}
```

If your `.eslintrc` file is a Javascript file instead of JSON, you may be able to use `require('@vue/test-utils/package.json').version` to pick up the version directly from the installed package.

## Supported Rules

[See rules](./docs/rules/index.md) for a full list of rules enabled by this plugin.

## Adding new rules

Create a new rule file, test file, and docs file in `./src/rules`, `./test/src/rules`, and `./docs/rules` respectively. Import the rule file in `./src/index.js` and add it to the list of rules exports and to the recommended config rules. Use the existing code as guidance. For more details on how to write a rule, here are some useful links to get you started:

-   View the syntax tree of your code: [ASTExplorer.net](https://astexplorer.net/)
-   [ESLint developer guide for rules](https://eslint.org/docs/developer-guide/working-with-rules)
-   Autofixing your rule: [Applying fixes guide](https://eslint.org/docs/developer-guide/working-with-rules#applying-fixes)
-   Testing your rule: [`RuleTester` documentation](https://eslint.org/docs/developer-guide/nodejs-api#ruletester)

Note that when exporting the rule, you use the unprefixed ID, but when adding the rule to the configuration, you need to use the fully-qualified name of the rule (in the format `vue-test-utils/{id}`).

## License

[MIT](./LICENSE)
