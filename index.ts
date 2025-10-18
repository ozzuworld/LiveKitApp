import { registerGlobals } from '@livekit/react-native';

// CRITICAL: This MUST be called FIRST before any other imports
// This sets up WebRTC polyfills required by LiveKit
registerGlobals();

import { registerRootComponent } from 'expo';
import App from './App';

// Register the root component
registerRootComponent(App);