// SIMPLIFIED AUDIO-ONLY VERSION FOR TESTING
// This removes video to isolate connection issues

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Button,
  TextInput,
  Text,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AudioSession } from '@livekit/react-native';
import { Room, RoomOptions, RoomEvent, LogLevel, setLogLevel } from 'livekit-client';
import { StatusBar } from 'expo-status-bar';
import TokenService from './utils/tokenService';

setLogLevel(LogLevel.debug);

async function ensureAudioPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const mic = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'LiveKit needs access to your microphone.',
        buttonPositive: 'OK',
      }
    );

    return mic === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.error('Permission request failed:', e);
    return false;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AudioOnlyTest />
    </SafeAreaProvider>
  );
}

function AudioOnlyTest() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('test-audio-room');
  const [participantName, setParticipantName] = useState(`user-${Math.floor(Math.random() * 1000)}`);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  
  const isConnecting = useRef(false);

  const addStatus = useCallback((msg: string) => {
    console.log(msg);
    setStatusMessages(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  useEffect(() => {
    addStatus('🔧 Creating Room (audio-only mode)...');
    
    const roomInstance = new Room({
      // AUDIO ONLY - No video
      publishDefaults: {
        audio: true,
        video: false, // Disabled for testing
      },
    } as RoomOptions);

    // Event listeners
    roomInstance.on(RoomEvent.SignalConnected, () => {
      addStatus('📶 Signal connected!');
    });

    roomInstance.on(RoomEvent.Connected, () => {
      addStatus('✅ Room connected!');
      setConnectionError(null);
      setConnected(true);
      isConnecting.current = false;
    });

    roomInstance.on(RoomEvent.Disconnected, (reason) => {
      addStatus(`❌ Disconnected: ${reason}`);
      setConnected(false);
      isConnecting.current = false;
    });

    roomInstance.on(RoomEvent.Reconnecting, () => {
      addStatus('🔄 Reconnecting...');
    });

    roomInstance.on(RoomEvent.ConnectionStateChanged, (state) => {
      addStatus(`📡 Connection state: ${state}`);
    });

    roomInstance.on(RoomEvent.ConnectionError, (error) => {
      addStatus(`🔥 Connection error: ${error.message}`);
      setConnectionError(error.message);
      isConnecting.current = false;
    });

    roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
      addStatus(`👋 Participant joined: ${participant.identity}`);
    });

    setRoom(roomInstance);
    addStatus('✅ Room instance ready');

    return () => {
      if (roomInstance.state === 'connected') {
        roomInstance.disconnect();
      }
    };
  }, [addStatus]);

  const connectToRoom = useCallback(async () => {
    if (!room || isConnecting.current) {
      addStatus('⚠️ Room not ready or already connecting');
      return;
    }

    isConnecting.current = true;
    setConnectionError(null);
    setLoading(true);
    setStatusMessages([]);

    try {
      addStatus('🚀 Starting connection...');
      
      addStatus('📋 Requesting microphone permission...');
      const granted = await ensureAudioPermission();
      if (!granted) {
        throw new Error('Microphone permission required');
      }
      addStatus('✅ Permission granted');

      addStatus(`🔑 Fetching token for room: ${roomName}`);
      const response = await TokenService.fetchToken(roomName, participantName);
      addStatus('✅ Token received');

      const wsUrl = response.livekitUrl || TokenService.getWebSocketUrl();
      addStatus(`🌐 Connecting to: ${wsUrl}`);
      addStatus(`📊 Room state: ${room.state}`);

      // Connect with explicit ICE config
      addStatus('⏳ Calling room.connect()...');
      await room.connect(wsUrl, response.token, {
        autoSubscribe: true,
        rtcConfig: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
          iceTransportPolicy: 'all',
        },
      });
      
      addStatus('🎉 Connect call completed');
      addStatus(`📊 Final state: ${room.state}`);

    } catch (error: any) {
      addStatus(`💥 Error: ${error.message}`);
      setConnectionError(error.message);
      Alert.alert('Connection Error', error.message);
      isConnecting.current = false;
    } finally {
      setLoading(false);
    }
  }, [room, roomName, participantName, addStatus]);

  const disconnect = useCallback(() => {
    addStatus('🔌 Disconnecting...');
    if (room && room.state === 'connected') {
      room.disconnect();
    }
    setConnected(false);
    setConnectionError(null);
    isConnecting.current = false;
  }, [room, addStatus]);

  useEffect(() => {
    const start = async () => {
      try {
        addStatus('🎵 Starting audio session...');
        await AudioSession.startAudioSession();
        addStatus('✅ Audio session started');
      } catch (error: any) {
        addStatus(`❌ Audio session error: ${error.message}`);
      }
    };
    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, [addStatus]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>Audio-Only Connection Test</Text>
        <Text style={styles.subtitle}>Simplified for debugging</Text>

        {!connected && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Room Name"
              value={roomName}
              onChangeText={setRoomName}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={participantName}
              onChangeText={setParticipantName}
              autoCapitalize="none"
            />

            <Button
              title={loading ? 'Connecting...' : 'Connect (Audio Only)'}
              onPress={connectToRoom}
              disabled={loading || !room}
            />

            {connectionError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error:</Text>
                <Text style={styles.errorDetails}>{connectionError}</Text>
              </View>
            )}
          </>
        )}

        {connected && (
          <View style={styles.connectedContainer}>
            <Text style={styles.connectedText}>✅ Connected to Room!</Text>
            <Text style={styles.infoText}>Room: {roomName}</Text>
            <Text style={styles.infoText}>Participants: {room?.remoteParticipants?.size || 0 + 1}</Text>
            <Button title="Disconnect" onPress={disconnect} color="#FF3B30" />
          </View>
        )}

        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Connection Log:</Text>
          {statusMessages.map((msg, i) => (
            <Text key={i} style={styles.statusText}>{msg}</Text>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 15, 
    marginBottom: 15, 
    backgroundColor: '#fff', 
    fontSize: 16 
  },
  errorContainer: { 
    marginTop: 15, 
    padding: 15, 
    backgroundColor: '#ffebee', 
    borderRadius: 8, 
    borderLeftWidth: 4, 
    borderLeftColor: '#f44336' 
  },
  errorText: { fontSize: 14, fontWeight: 'bold', color: '#c62828', marginBottom: 5 },
  errorDetails: { fontSize: 13, color: '#d32f2f' },
  connectedContainer: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 20,
  },
  connectedText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#555', marginBottom: 5 },
  statusContainer: { 
    flex: 1,
    marginTop: 20, 
    padding: 15, 
    backgroundColor: '#fff', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  statusText: { fontSize: 11, color: '#666', marginBottom: 3, fontFamily: 'monospace' },
});