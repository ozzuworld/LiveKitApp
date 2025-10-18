const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for event-target-shim exports warning
config.resolver.unstable_enablePackageExports = true;

// Add custom resolver to handle event-target-shim properly
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If the bundle is resolving "event-target-shim" from a module that is part of react-native-webrtc or livekit
  if (
    moduleName.startsWith('event-target-shim') &&
    (context.originModulePath.includes('react-native-webrtc') || 
     context.originModulePath.includes('@livekit'))
  ) {
    // Try to resolve from the origin module's node_modules first
    try {
      const resolveFrom = require('resolve-from');
      const eventTargetShimPath = resolveFrom(
        context.originModulePath,
        moduleName
      );
      return {
        filePath: eventTargetShimPath,
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through to default resolver if this fails
    }
  }

  // Ensure you call the default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;