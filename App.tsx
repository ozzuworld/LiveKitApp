import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  Button,
  TextInput,
  Text,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useRoom,
  useLocalParticipant,
  RoomEvent,
} from '@livekit/react-native';
import { Track, RoomConnectOptions, RoomOptions } from 'livekit-client';
import { StatusBar } from 'expo-status-bar';
import TokenService from './utils/tokenService';

// Initialize LiveKit globals
registerGlobals();

export default function App() {
  return (
    <SafeAreaProvider>
      <LiveKitApp />
    </SafeAreaProvider>
  );
}

function LiveKitApp() {
  const [token, setToken] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [roomName, setRoomName] = useState('default-room');
  const [participantName, setParticipantName] = useState(`user-${Math.floor(Math.random() * 1000)}`);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchToken = async () => {
    if (!TokenService.validateRoomName(roomName)) {
      Alert.alert('Error', 'Room name must be alphanumeric with dashes/underscores only');
      return;
    }

    if (!TokenService.validateParticipantName(participantName)) {
      Alert.alert('Error', 'Participant name must be alphanumeric with dashes/underscores only');
      return;
    }

    setLoading(true);
    try {
      const response = await TokenService.fetchToken(roomName, participantName);

      // Ensure /rtc is appended to the base URL and avoid trailing slashes
      const baseWs = (response.livekitUrl || TokenService.getWebSocketUrl()).replace(/\/$/, '');
      const rtcUrl = `${baseWs}/rtc`;

      setToken(response.token);
      setLivekitUrl(rtcUrl);
      setConnected(true);
    } catch (error: any) {
      Alert.alert('Connection Error', `Failed to get token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setToken('');
    setLivekitUrl('');
  };

  useEffect(() => {
    const start = async () => {
      try {
        await AudioSession.startAudioSession();
      } catch (error) {
        console.error('Failed to start audio session:', error);
      }
    };
    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  if (!connected) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="auto" />
        <View style={styles.loginContainer}>
          <Text style={styles.title}>LiveKit Voice Chat</Text>
          <Text style={styles.subtitle}>June Platform - api.ozzu.world</Text>

          <TextInput
            style={styles.input}
            placeholder="Room Name (alphanumeric, -, _)"
            value={roomName}
            onChangeText={setRoomName}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Your Name (alphanumeric, -, _)"
            value={participantName}
            onChangeText={setParticipantName}
            autoCapitalize="none"
          />

          <Button
            title={loading ? 'Connecting to June...' : 'Join Room'}
            onPress={fetchToken}
            disabled={loading}
          />

          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>Token URL: https://api.ozzu.world/livekit/token</Text>
              <Text style={styles.debugText}>WebSocket Base: wss://livekit.ozzu.world</Text>
              <Text style={styles.debugText}>Client Will Connect To: {livekitUrl || 'N/A (not connected yet)'}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <LiveKitRoom
        serverUrl={livekitUrl} // must be wss://.../rtc
        token={token}          // pass token via prop, do NOT also append to URL
        connect={true}
        options={{
          adaptiveStream: { pixelDensity: 'screen' },
          publishDefaults: {
            audioPreset: { maxBitrate: 20_000 },
          },
        } as RoomOptions}
        connectOptions={{ autoSubscribe: true } as RoomConnectOptions}
        audio={true}
        video={true}
        onConnected={() => {
          console.log('Successfully connected to LiveKit room');
        }}
        onDisconnected={(reason) => {
          console.log('Disconnected from room:', reason);
          setConnected(false);
          setToken('');
          setLivekitUrl('');
        }}
      >
        <RoomView roomName={roomName} onDisconnect={disconnect} />
      </LiveKitRoom>
    </SafeAreaView>
  );
}

const RoomView = ({ roomName, onDisconnect }: { roomName: string; onDisconnect: () => void }) => {
  const room = useRoom();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  useEffect(() => {
    if (!room) return;

    const handleConnected = () => {
      console.log('Connected to room successfully');
      console.log('Room participants:', room.numParticipants);
      console.log('Local participant:', localParticipant.identity);
    };

    const handleParticipantConnected = (participant: any) => {
      console.log('Participant connected:', participant.identity);
    };

    const handleParticipantDisconnected = (participant: any) => {
      console.log('Participant disconnected:', participant.identity);
    };

    const handleDisconnected = (reason?: any) => {
      console.log('Room disconnected:', reason);
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, localParticipant]);

  const toggleMicrophone = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({ item }) => {
    if (isTrackReference(item)) {
      return (
        <View style={styles.participantContainer}>
          <VideoTrack trackRef={item} style={styles.participantView} objectFit="cover" />
          <Text style={styles.participantName}>
            {item.participant?.identity || 'Unknown'}
            {item.participant === localParticipant && ' (You)'}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.participantView, styles.placeholderView]}>
        <Text style={styles.placeholderText}>No Video</Text>
      </View>
    );
  };

  if (!room) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connecting to room...</Text>
      </View>
    );
  }

  return (
    <View style={styles.roomContainer}>
      <View style={styles.header}>
        <Text style={styles.roomTitle}>Room: {roomName}</Text>
        <Text style={styles.participantCount}>
          {room.numParticipants} participant{room.numParticipants !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.connectionStatus}>Connected to June Platform</Text>
      </View>

      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(item, index) => (isTrackReference(item) ? `${item.participant?.sid}-${item.publication?.trackSid}` : `placeholder-${index}`)}
        numColumns={2}
        contentContainerStyle={styles.tracksContainer}
      />

      <View style={styles.controls}>
        <Button title={isMicEnabled ? '🎤 Mute' : '🎤 Unmute'} onPress={toggleMicrophone} color={isMicEnabled ? '#007AFF' : '#FF3B30'} />
        <Button title={isCameraEnabled ? '📹 Stop Video' : '📹 Start Video'} onPress={toggleCamera} color={isCameraEnabled ? '#007AFF' : '#FF3B30'} />
        <Button title="Leave" onPress={onDisconnect} color="#FF3B30" />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const participantWidth = (width - 30) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 15, width: '100%', backgroundColor: '#fff', fontSize: 16 },
  debugInfo: { marginTop: 20, padding: 10, backgroundColor: '#e8e8e8', borderRadius: 5, width: '100%' },
  debugText: { fontSize: 12, color: '#666', marginBottom: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', fontSize: 16 },
  roomContainer: { flex: 1, backgroundColor: '#000' },
  header: { padding: 15, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  roomTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  participantCount: { fontSize: 14, color: '#ccc', marginTop: 4 },
  connectionStatus: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  tracksContainer: { padding: 10, flexGrow: 1 },
  participantContainer: { margin: 5 },
  participantView: { width: participantWidth, height: participantWidth * 0.75, borderRadius: 8, overflow: 'hidden' },
  participantName: { color: '#fff', fontSize: 12, textAlign: 'center', marginTop: 5, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  placeholderView: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#666', fontSize: 14 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#333' },
});
