# LiveKit App Troubleshooting Guide

## Current Issues and Solutions

### ✅ **RESOLVED: SafeAreaView Deprecation Warning**
```
WARN SafeAreaView has been deprecated and will be removed in a future release.
```

**Solution**: Updated to use `react-native-safe-area-context`
- Added `SafeAreaProvider` wrapper
- Replaced React Native's `SafeAreaView` with the new one
- Specified explicit edges for better control

### ✅ **RESOLVED: Event Target Shim Warnings**
```
WARN Attempted to import the module "event-target-shim/index"
```

**Solution**: 
- Added `metro.config.js` with `unstable_enablePackageExports: true`
- These warnings are harmless and don't affect functionality
- Fixed in latest LiveKit SDK versions

### ⚠️ **MAIN ISSUE: Cannot read property 'once' of undefined**
```
ERROR [TypeError: Cannot read property 'once' of undefined]
INFO disconnect from room
WARN Abort connection attempt due to user initiated disconnect
WARN [ConnectionError: Client initiated disconnect]
```

**Root Cause**: This error occurs when the WebRTC connection object is undefined, typically due to:
1. Version incompatibility between LiveKit packages
2. Connection failure before event listeners are attached
3. Invalid token or server configuration

## Latest Fixes Applied

### 1. **Updated Dependencies**
Run this command to get the latest compatible versions:
```bash
npm install @livekit/react-native@latest livekit-client@latest @livekit/react-native-webrtc@latest
```

### 2. **Added Metro Configuration**
Created `metro.config.js` to fix package export warnings:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
module.exports = config;
```

### 3. **Enhanced Error Handling**
Updated `App.tsx` with:
- Better connection error handling
- Retry logic with configurable delays
- Proper error state management
- Connection error event listeners
- Improved disconnect handling

### 4. **Connection Options**
Added retry configuration:
```typescript
connectOptions={{ 
  autoSubscribe: true,
  maxRetries: 3,
  retryDelays: [1000, 3000, 5000],
}}
```

## Debugging Steps

### Step 1: Verify Backend Health
```bash
# Check orchestrator health
curl https://api.ozzu.world/healthz

# Check service info
curl https://api.ozzu.world/
```

### Step 2: Test Token Generation
```bash
# Direct token test
curl -X POST https://api.ozzu.world/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"debug-room","participantName":"debug-user"}' \
  -v
```

**Expected Response**:
```json
{
  "token": "eyJ...",
  "roomName": "debug-room",
  "participantName": "debug-user",
  "livekitUrl": "wss://livekit.ozzu.world"
}
```

### Step 3: Check LiveKit Server Connection
```bash
# Test WebSocket connectivity (install wscat first: npm install -g wscat)
wscat -c wss://livekit.ozzu.world
```

### Step 4: Check Kubernetes Services
```bash
# Check all June services
kubectl get pods -n june-services

# Check orchestrator logs
kubectl logs -f deployment/june-orchestrator -n june-services

# Check LiveKit server
kubectl get pods -n livekit-system
kubectl logs -f deployment/livekit-server -n livekit-system
```

## Common Solutions

### Solution 1: Clean Installation
```bash
cd LiveKitApp
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

### Solution 2: Rebuild Development Build
```bash
# For Android
expo run:android --clear

# For iOS
expo run:ios --clear
```

### Solution 3: Check Server Configuration
Ensure your LiveKit server is running and accessible:
```bash
# Port forward for testing
kubectl port-forward svc/livekit-server 7880:7880 -n livekit-system

# Test local connection
curl http://localhost:7880
```

## Version Compatibility

### Working Configuration
```json
{
  "@livekit/react-native": "^2.9.3+",
  "livekit-client": "^2.15.11+",
  "@livekit/react-native-webrtc": "^137.0.2+",
  "expo": "~54.0.13",
  "react-native": "0.81.4"
}
```

### Known Issues
- **React Native 0.82+**: May have compatibility issues with current LiveKit SDK
- **Expo SDK 55+**: Check LiveKit Expo plugin compatibility
- **Node.js 20+**: May require additional configuration for package exports

## STUNner/TURN Configuration

### Check STUNner Status
```bash
kubectl get pods -n stunner-system
kubectl logs -f deployment/stunnerd -n stunner-system
```

### Check UDPRoute Configuration
```bash
kubectl get udproute -A
kubectl describe gateway stunner-gateway -n stunner-system
```

### Common STUNner Issues
1. **Gateway not ready**: Check LoadBalancer service
2. **UDPRoute misconfiguration**: Verify backend references
3. **Certificate issues**: Check TLS configuration

## Network Troubleshooting

### Firewall Requirements
- **WebSocket**: Port 443 (wss://)
- **TURN/STUN**: UDP ports configured in STUNner (typically 3478)
- **RTP**: Dynamic UDP port range

### Corporate Network Issues
- VPN interference with WebRTC
- Firewall blocking UDP traffic
- DNS resolution problems
- Proxy configuration conflicts

## Error Code Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cannot read property 'once' of undefined` | WebRTC connection object undefined | Update LiveKit packages, check server |
| `Client initiated disconnect` | Connection aborted early | Check token validity and server status |
| `401 Unauthorized` | Authentication failed | Add auth headers or check backend auth |
| `404 Not Found` | Endpoint not found | Verify API URL and routing |
| `CORS Error` | Cross-origin request blocked | Check CORS configuration in backend |
| `Connection timeout` | Server unreachable | Check network, DNS, and server status |
| `ICE connection failed` | WebRTC negotiation failed | Check STUN/TURN server configuration |

## Authentication Solutions

### Current Setup (Auth Disabled for Testing)
In your June backend `dependencies.py`:
```python
async def get_current_user():
    # Returns test user - auth disabled for testing
    return {"sub": "test-user", "email": "test@example.com"}
```

### Enable Authentication (Future)
Update `utils/tokenService.ts`:
```typescript
const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`, // Add authentication
  },
  body: JSON.stringify(requestBody)
});
```

## Platform-Specific Issues

### Android
- Network security config for cleartext traffic
- Camera/microphone permissions
- Hardware acceleration issues
- Emulator vs physical device differences

### iOS
- Info.plist permission descriptions
- Development team/certificate issues
- WebRTC simulator limitations
- Background audio session conflicts

## Getting Help

### Log Analysis Priority
1. **App Console**: React Native error details
2. **Backend Logs**: `kubectl logs -f deployment/june-orchestrator -n june-services`
3. **LiveKit Logs**: `kubectl logs -f deployment/livekit-server -n livekit-system`
4. **STUNner Logs**: `kubectl logs -f deployment/stunnerd -n stunner-system`
5. **Network Logs**: Browser developer tools (if testing web version)

### Useful Debug Commands
```bash
# Complete system status
kubectl get all -n june-services
kubectl get all -n livekit-system
kubectl get all -n stunner-system

# Port forwarding for local testing
kubectl port-forward svc/june-orchestrator 8080:8080 -n june-services
kubectl port-forward svc/livekit-server 7880:7880 -n livekit-system

# Check ingress routing
kubectl get ingress -A
kubectl describe ingress -n june-services
```

## Recent Updates

### October 2025
- Fixed event-target-shim warnings with metro.config.js
- Enhanced error handling in App.tsx
- Added connection retry logic
- Improved debugging information display
- Updated troubleshooting documentation

### Next Steps
1. Update to latest LiveKit SDK versions
2. Test connection with clean environment
3. Verify server-side LiveKit configuration
4. Check STUNner gateway status
5. Monitor connection logs for specific error patterns