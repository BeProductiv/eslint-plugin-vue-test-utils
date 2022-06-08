const semver = require('semver');

let cachedVtuVersion;

function detectVtuVersion() {
    if (cachedVtuVersion) {
        return cachedVtuVersion;
    }

    try {
        // eslint-disable-next-line node/no-missing-require
        const vtuPackageJson = require('@vue/test-utils/package.json');
        if (vtuPackageJson.version) {
            return (cachedVtuVersion = vtuPackageJson.version);
        }
    } catch {
        /* intentionally empty */
    }

    throw new Error(
        'Unable to detect installed VTU version. Please ensure @vue/test-utils is installed, or set the version explicitly.'
    );
}

/**
 *
 * @param {string} vtuVersion VTU version to check against
 * @param {string} targetVersion version to check
 * @returns {boolean} if vtuVersion is greater than or equal to target version
 */
function isVtuVersionAtLeast(vtuVersion, targetVersion) {
    return semver.gte(vtuVersion, targetVersion);
}

module.exports = isVtuVersionAtLeast;
module.exports.detectVtuVersion = detectVtuVersion;
