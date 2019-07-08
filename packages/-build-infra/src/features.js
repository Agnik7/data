'use strict';

function castValue({ type, name, value }) {
  if (type === 'NullLiteral') {
    return null;
  }
  if (type === 'BooleanLiteral') {
    return value;
  }
  if (type === 'NumericLiteral') {
    return value;
  }
  if (type === 'StringLiteral') {
    return value;
  }
  if (type === 'Identifier' && name === 'undefined') {
    return undefined;
  }
}
const { parse } = require('@babel/parser');
const fs = require('fs');
// See ember-source for other implementation to parse typescript file
function extractFeaturesHash() {
  let fileName = require.resolve('@ember-data/canary-features/addon/index.js');
  let fileContents = fs.readFileSync(fileName, { encoding: 'utf8' }).toString();
  let parsed = parse(fileContents, {
    sourceType: 'module',
    estree: true,
  });
  // TODO manual extracting, but should considering using a babel plugin
  // Passing the plugins configuration option did not seem to work
  let exportedHashDeclaration = parsed.program.body.find(node => {
    return (
      node.type === 'ExportNamedDeclaration' &&
      node.declaration.type === 'VariableDeclaration' &&
      node.declaration.declarations.length === 1 &&
      node.declaration.declarations[0].id &&
      node.declaration.declarations[0].id.type === 'Identifier' &&
      node.declaration.declarations[0].id.name === 'DEFAULT_FEATURES'
    );
  });

  // grab the fields we need
  const {
    declaration: {
      declarations: [node],
    },
  } = exportedHashDeclaration;
  // populate an object with the values
  // static values declared in the file
  const defaults = {};
  node.init.properties.forEach(prop => {
    defaults[prop.key.name] = castValue(prop.value);
  });
  return defaults;
}
function getFeatures() {
  const features = extractFeaturesHash();

  const FEATURE_OVERRIDES = process.env.EMBER_DATA_FEATURE_OVERRIDE;
  if (FEATURE_OVERRIDES === 'ENABLE_ALL_OPTIONAL') {
    // enable all features with a current value of `null`
    for (let feature in features) {
      let featureValue = features[feature];

      if (featureValue === null) {
        features[feature] = true;
      }
    }
  } else if (FEATURE_OVERRIDES) {
    // enable only the specific features listed in the environment
    // variable (comma separated)
    const forcedFeatures = FEATURE_OVERRIDES.split(',');
    for (let i = 0; i < forcedFeatures.length; i++) {
      let featureName = forcedFeatures[i];

      features[featureName] = true;
    }
  }

  return features;
}

module.exports = getFeatures();
