import { registerGlobals } from '@livekit/react-native';

// CRITICAL: registerGlobals must be called FIRST, before any other imports
// This sets up WebRTC polyfills required by LiveKit
registerGlobals();

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);