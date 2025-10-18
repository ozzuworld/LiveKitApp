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

**Solution**: These are harmless warnings from LiveKit dependencies. They don't affect functionality.

### ⚠️ **MAIN ISSUE: Connection Error**
```
ERROR [TypeError: Cannot read property 'once' of undefined]
INFO disconnect from room
WARN Abort connection attempt due to user initiated disconnect
WARN [ConnectionError: Client initiated disconnect]
```

## Potential Causes & Solutions

### 1. **Token Authentication Issue**

**Check**: Your June backend authentication

```bash
# Test token endpoint directly
curl -X POST https://api.ozzu.world/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room","participantName":"test-user"}'
```

**Expected Response**:
```json
{
  "token": "eyJ...",
  "roomName": "test-room",
  "participantName": "test-user",
  "livekitUrl": "wss://livekit.ozzu.world"
}
```

**If 401/403 Error**: Authentication is required
- Add auth headers to TokenService
- Check Keycloak integration in june-orchestrator

### 2. **LiveKit Server Connection**

**Check WebSocket Connection**:
```bash
# Test WebSocket connectivity
wscat -c wss://livekit.ozzu.world
```

**Check Kubernetes LiveKit Pod**:
```bash
kubectl get pods -n livekit-system
kubectl logs -f deployment/livekit-server -n livekit-system
```

### 3. **STUNner/TURN Configuration**

**Check STUNner Status**:
```bash
kubectl get pods -n stunner-system
kubectl logs -f deployment/stunnerd -n stunner-system
```

**Check UDPRoute Configuration**:
```bash
kubectl get udproute -A
kubectl describe gateway stunner-gateway -n stunner-system
```

### 4. **Network/Firewall Issues**

**Check Ports**:
- LiveKit WebSocket: 443 (wss://)
- TURN/STUN: UDP ports configured in STUNner
- Ensure corporate firewall allows WebRTC traffic

## Debugging Steps

### Step 1: Verify Backend Health
```bash
# Check orchestrator health
curl https://api.ozzu.world/healthz

# Check service info
curl https://api.ozzu.world/
```

### Step 2: Check Kubernetes Services
```bash
# Check all June services
kubectl get pods -n june-services

# Check orchestrator logs
kubectl logs -f deployment/june-orchestrator -n june-services

# Check ingress
kubectl get ingress -A
```

### Step 3: Test Token Generation
```bash
# Direct token test
curl -X POST https://api.ozzu.world/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"roomName":"debug-room","participantName":"debug-user"}' \
  -v
```

### Step 4: WebSocket Connection Test
```bash
# Install wscat if needed
npm install -g wscat

# Test WebSocket (may fail without proper token)
wscat -c "wss://livekit.ozzu.world?access_token=YOUR_TOKEN_HERE"
```

## Quick Fixes to Try

### Fix 1: Update Dependencies
```bash
cd LiveKitApp
npm install
npx expo install --fix
```

### Fix 2: Clear Cache
```bash
npx expo start --clear
# Or
rm -rf node_modules package-lock.json
npm install
```

### Fix 3: Rebuild Development Build
```bash
expo run:android --clear
# Or for iOS
expo run:ios --clear
```

## Authentication Solutions

### Option 1: Disable Authentication (Testing)
In your June backend `dependencies.py`, the auth is already disabled:
```python
async def get_current_user():
    # Returns test user - auth disabled for testing
    return {"sub": "test-user", "email": "test@example.com"}
```

### Option 2: Add Authentication Headers
If you need to enable auth later, update `utils/tokenService.ts`:
```typescript
const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`, // Add this
  },
  body: JSON.stringify(requestBody)
});
```

## Environment-Specific Issues

### Android
- Ensure network security config allows cleartext (if needed)
- Check if running on emulator vs physical device
- Verify camera/microphone permissions

### iOS
- Check Info.plist permissions
- Verify development team/certificates
- Test on physical device (WebRTC issues on simulator)

### Network
- Corporate firewall blocking WebRTC
- VPN interfering with connections
- DNS resolution issues

## Error Code Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `Cannot read property 'once' of undefined` | WebRTC connection object undefined | Check LiveKit server connectivity |
| `Client initiated disconnect` | Connection aborted | Check token validity and server status |
| `401 Unauthorized` | Authentication failed | Add auth headers or check backend auth |
| `404 Not Found` | Endpoint not found | Verify API URL and routing |
| `CORS Error` | Cross-origin request blocked | Check CORS configuration in backend |

## Getting Help

### Check Logs
1. **App Console**: Look for detailed error messages
2. **Backend Logs**: `kubectl logs -f deployment/june-orchestrator -n june-services`
3. **LiveKit Logs**: `kubectl logs -f deployment/livekit-server -n livekit-system`
4. **STUNner Logs**: `kubectl logs -f deployment/stunnerd -n stunner-system`

### Useful Commands
```bash
# Check all June services
kubectl get all -n june-services

# Check LiveKit system
kubectl get all -n livekit-system

# Check STUNner system
kubectl get all -n stunner-system

# Port forward for local testing
kubectl port-forward svc/june-orchestrator 8080:8080 -n june-services
```

### Contact Information
For platform-specific issues, check:
- June Platform backend logs
- LiveKit server status
- STUNner gateway configuration
- Kubernetes ingress routing