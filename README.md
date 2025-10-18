# LiveKit React Native App

A React Native app built with Expo that integrates with LiveKit for real-time video and voice communication, connecting to your **June Platform** backend at `api.ozzu.world`.

## Features

- 📹 Video calling with multiple participants
- 🎤 Voice chat functionality
- 📱 Cross-platform (iOS and Android)
- 🔒 Secure token-based authentication via June Platform
- 🎮 Interactive controls (mute/unmute, camera on/off)
- 📏 Real-time participant management
- 🔍 Input validation for room and participant names

## June Platform Integration

This app connects to your existing **June Platform** backend:

### Endpoints
- **Token Generation**: `POST https://api.ozzu.world/livekit/token`
- **WebSocket Connection**: `wss://livekit.ozzu.world`
- **Service**: `june-orchestrator` (v3.0.0)

### Authentication
The app uses your June Platform's LiveKit token generation service which requires:
```json
{
  "roomName": "your-room-name",
  "participantName": "user-identity"
}
```

And returns:
```json
{
  "token": "jwt-token",
  "roomName": "your-room-name", 
  "participantName": "user-identity",
  "livekitUrl": "wss://livekit.ozzu.world"
}
```

## Setup

### Prerequisites

- Node.js (v16 or later)
- Expo CLI
- Your June Platform backend running at `api.ozzu.world`
- Development build (not compatible with Expo Go)
- Access to your Kubernetes cluster (if debugging)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ozzuworld/LIVEKITAPP.git
cd LIVEKITAPP
```

2. Install dependencies:
```bash
npm install
```

3. Create a development build:
```bash
# For Android
expo run:android

# For iOS
expo run:ios
```

## Usage

1. Launch the app
2. Enter a room name (alphanumeric with dashes/underscores only)
3. Enter your display name (alphanumeric with dashes/underscores only)
4. Tap "Join Room" to connect to June Platform
5. Grant camera and microphone permissions when prompted
6. Start your video call!

### Input Requirements
- **Room Name**: Must be 1-50 characters, alphanumeric with dashes and underscores only
- **Participant Name**: Must be 1-50 characters, alphanumeric with dashes and underscores only

## Project Structure

```
LIVEKITAPP/
├── App.tsx                    # Main application component
├── components/
│   └── LiveKitComponents.tsx  # Reusable LiveKit components
├── utils/
│   └── tokenService.ts        # June Platform API integration
├── app.json                   # Expo configuration with LiveKit plugins
├── package.json               # Dependencies
└── README.md                  # This file
```

## June Platform Backend

### Service Architecture
Your June Platform includes:
- **june-orchestrator**: Main service handling LiveKit tokens
- **june-stt**: Speech-to-text service
- **june-tts**: Text-to-speech service
- **june-idp**: Identity provider
- **june-dark**: Additional services

### LiveKit Configuration (from your backend)
```python
# June Platform LiveKit Config
LIVEKIT_API_KEY = "devkey"
LIVEKIT_API_SECRET = "secret"
LIVEKIT_WS_URL = "wss://livekit.ozzu.world"
```

### Authentication Flow
1. App sends request to June Platform token endpoint
2. `june-orchestrator` validates request (requires authentication)
3. Generates LiveKit JWT token with proper grants
4. Returns token + WebSocket URL
5. App connects to LiveKit server

## Permissions

The app requires the following permissions:
- `CAMERA`: Video calling
- `RECORD_AUDIO`: Voice communication
- `MODIFY_AUDIO_SETTINGS`: Audio management
- `INTERNET`: Network connectivity
- `ACCESS_NETWORK_STATE`: Connection monitoring

## Development

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Debugging with Kubernetes

If you have access to your K8s cluster, you can debug backend issues:

```bash
# Check orchestrator logs
kubectl logs -f deployment/june-orchestrator -n june-services

# Check LiveKit server status
kubectl get pods -n livekit-system

# Port forward for local testing
kubectl port-forward svc/june-orchestrator 8080:8080 -n june-services
```

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Troubleshooting

### Common Issues

1. **Token fetch fails**: 
   - Ensure June Platform is running at `api.ozzu.world`
   - Check if `june-orchestrator` service is healthy
   - Verify authentication if required

2. **Camera/Microphone not working**: 
   - Check app permissions in device settings
   - Ensure development build (not Expo Go)

3. **Connection issues**: 
   - Verify `wss://livekit.ozzu.world` is accessible
   - Check LiveKit server status in K8s cluster
   - Ensure STUNner/TURN configuration is correct

4. **Validation errors**:
   - Room/participant names must be alphanumeric with dashes/underscores only
   - Names must be 1-50 characters long

### Backend API Debugging

The June Platform orchestrator provides debug endpoints:

```bash
# Service info
curl https://api.ozzu.world/

# Health check
curl https://api.ozzu.world/healthz

# Test token generation (requires auth)
curl -X POST https://api.ozzu.world/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","participantName":"testuser"}'
```

### Debug Logging

Enable debug logging by checking the console output. The app logs:
- Token fetch attempts and responses
- Room connection status and events
- Participant join/leave events
- Audio session status
- WebSocket connection details

In development mode, you'll see additional debug info including:
- Token endpoint URL
- WebSocket URL
- Request/response details

## June Platform Documentation

For more information about your backend services:
- LiveKit Server: Running in your K8s cluster
- STUNner: TURN/STUN server configuration
- Orchestrator: FastAPI service with LiveKit integration
- Authentication: Integrated with your identity provider

## LiveKit Documentation

- [LiveKit React Native SDK](https://docs.livekit.io/home/quickstarts/react-native/)
- [LiveKit Server SDK](https://docs.livekit.io/home/server/)
- [LiveKit Components](https://docs.livekit.io/reference/components/react/)

## License

This project is part of your June Platform ecosystem.