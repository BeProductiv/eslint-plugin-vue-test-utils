const noDeprecatedMountOptions = require('./rules/no-deprecated-mount-options');
const noDeprecatedWrappers = require('./rules/no-deprecated-wrapper-functions');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports.rules = {
    'no-deprecated-mount-options': noDeprecatedMountOptions,
    'no-deprecated-wrapper-functions': noDeprecatedWrappers,
};

module.exports.configs = {
    recommended: {
        plugins: ['vue-test-utils'],
        rules: {
            'vue-test-utils/no-deprecated-mount-options': 'error',
            'vue-test-utils/no-deprecated-wrapper-functions': 'error',
        },
    },
};
