# LiveKit React Native App

A React Native app built with Expo that integrates with LiveKit for real-time video and voice communication, connecting to your backend at `api.ozzu.world`.

## Features

- 📹 Video calling with multiple participants
- 🎤 Voice chat functionality
- 📱 Cross-platform (iOS and Android)
- 🔒 Secure token-based authentication
- 🎮 Interactive controls (mute/unmute, camera on/off)
- 📏 Real-time participant management

## Setup

### Prerequisites

- Node.js (v16 or later)
- Expo CLI
- Your LiveKit backend running at `api.ozzu.world`
- Development build (not compatible with Expo Go)

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

### Configuration

The app is pre-configured to connect to:
- **WebSocket URL**: `wss://api.ozzu.world`
- **Token Endpoint**: `https://api.ozzu.world/livekit/token`

## Backend Requirements

Your backend at `api.ozzu.world/livekit/token` should accept POST requests with:

```json
{
  "room": "room-name",
  "identity": "user-identity"
}
```

And return:

```json
{
  "token": "livekit-jwt-token"
}
```

### Example Backend Implementation (Node.js)

```javascript
import { AccessToken } from 'livekit-server-sdk';

app.post('/livekit/token', async (req, res) => {
  const { room, identity } = req.body;
  
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: identity,
      ttl: '10m',
    }
  );
  
  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: true,
    canSubscribe: true,
  });
  
  const token = await at.toJwt();
  res.json({ token });
});
```

## Usage

1. Launch the app
2. Enter a room name and your display name
3. Tap "Join Room" to connect
4. Grant camera and microphone permissions when prompted
5. Start your video call!

## Project Structure

```
LIVEKITAPP/
├── App.tsx                    # Main application component
├── components/
│   └── LiveKitComponents.tsx  # Reusable LiveKit components
├── utils/
│   └── tokenService.ts        # Token fetching utility
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## Key Components

### Main App (`App.tsx`)
- Connection management
- Token authentication
- Room joining/leaving
- Audio session management

### LiveKit Components (`components/LiveKitComponents.tsx`)
- `CustomControlBar`: Media controls
- `ParticipantGrid`: Video participant layout
- `RoomInfo`: Room name and participant count
- `AudioVisualizer`: Audio-only participant display

### Token Service (`utils/tokenService.ts`)
- API communication
- Input validation
- Error handling

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

### Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Troubleshooting

### Common Issues

1. **Token fetch fails**: Ensure your backend is running and accessible at `api.ozzu.world`
2. **Camera/Microphone not working**: Check app permissions in device settings
3. **Connection issues**: Verify WebSocket URL and network connectivity
4. **Build errors**: Ensure you're using a development build, not Expo Go

### Debugging

Enable debug logging by checking the console output. The app logs:
- Token fetch attempts
- Room connection status
- Participant events
- Audio session status

## LiveKit Documentation

- [LiveKit React Native SDK](https://docs.livekit.io/home/quickstarts/react-native/)
- [LiveKit Server SDK](https://docs.livekit.io/home/server/)
- [LiveKit Components](https://docs.livekit.io/reference/components/react/)

## License

This project is part of your Ozzu platform ecosystem.