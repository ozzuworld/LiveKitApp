const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for event-target-shim exports warning
config.resolver.unstable_enablePackageExports = true;

// Additional resolver configuration for LiveKit compatibility
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  // Add any specific aliases if needed
};

module.exports = config;