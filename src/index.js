const noDeprecatedWrappers = require('./rules/no-deprecated-wrapper-functions');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports.rules = {
    'no-deprecated-wrapper-functions': noDeprecatedWrappers,
};

module.exports.configs = {
    recommended: {
        plugins: ['vue-test-utils'],
        rules: {
            'vue-test-utils/no-deprecated-wrapper-functions': 'error',
        },
    },
};
