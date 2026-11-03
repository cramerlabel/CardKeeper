const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

// Release signing credentials come from ~/.gradle/gradle.properties (never committed):
//   CARDKEEPER_STORE_FILE, CARDKEEPER_STORE_PASSWORD, CARDKEEPER_KEY_ALIAS, CARDKEEPER_KEY_PASSWORD
const RELEASE_SIGNING = `
        release {
            if (findProperty('CARDKEEPER_STORE_FILE')) {
                storeFile file(findProperty('CARDKEEPER_STORE_FILE'))
                storePassword findProperty('CARDKEEPER_STORE_PASSWORD')
                keyAlias findProperty('CARDKEEPER_KEY_ALIAS')
                keyPassword findProperty('CARDKEEPER_KEY_PASSWORD')
            }
        }`;

const ARCHITECTURES = 'armeabi-v7a,arm64-v8a,x86_64';

module.exports = function withReleaseSigning(config) {
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (!src.includes('CARDKEEPER_STORE_FILE')) {
      src = src.replace(
        /(signingConfigs \{\s*debug \{[\s\S]*?\n        \})/,
        `$1${RELEASE_SIGNING}`,
      );
      src = src.replace(
        /(see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\s*)signingConfig signingConfigs\.debug/,
        `$1signingConfig findProperty('CARDKEEPER_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
      );
    }
    cfg.modResults.contents = src;
    return cfg;
  });

  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const existing = props.find(
      (p) => p.type === 'property' && p.key === 'reactNativeArchitectures',
    );
    if (existing) existing.value = ARCHITECTURES;
    else props.push({ type: 'property', key: 'reactNativeArchitectures', value: ARCHITECTURES });
    return cfg;
  });
};
