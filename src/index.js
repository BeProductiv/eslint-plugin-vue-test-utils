const missingAwait = require('./rules/missing-await');
const noDeprecatedMountOptions = require('./rules/no-deprecated-mount-options');
const noDeprecatedSelectors = require('./rules/no-deprecated-selectors');
const noDeprecatedWrappers = require('./rules/no-deprecated-wrapper-functions');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports.rules = {
    'missing-await': missingAwait,
    'no-deprecated-mount-options': noDeprecatedMountOptions,
    'no-deprecated-wrapper-functions': noDeprecatedWrappers,
    'no-deprecated-selectors': noDeprecatedSelectors,
};

module.exports.configs = {
    recommended: {
        plugins: ['vue-test-utils'],
        rules: {
            'vue-test-utils/missing-await': 'error',
            'vue-test-utils/no-deprecated-mount-options': 'error',
            'vue-test-utils/no-deprecated-selectors': 'error',
            'vue-test-utils/no-deprecated-wrapper-functions': 'error',
        },
    },
};
