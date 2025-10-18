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
  SafeAreaView,
  Dimensions,
} from 'react-native';
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
import { Track, Room } from 'livekit-client';
import { StatusBar } from 'expo-status-bar';
import TokenService from './utils/tokenService';

// Initialize LiveKit globals
registerGlobals();

export default function App() {
  const [token, setToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
  const [roomName, setRoomName] = useState("default-room");
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
      console.log('Fetching token for:', { roomName, participantName });
      
      const response = await TokenService.fetchToken(roomName, participantName);
      
      console.log('Token response:', {
        hasToken: !!response.token,
        roomName: response.roomName,
        participantName: response.participantName,
        livekitUrl: response.livekitUrl
      });
      
      setToken(response.token);
      setLivekitUrl(response.livekitUrl || TokenService.getWebSocketUrl());
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch token:', error);
      Alert.alert('Connection Error', `Failed to get token: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setToken("");
    setLivekitUrl("");
  };

  // Start audio session
  useEffect(() => {
    let start = async () => {
      try {
        await AudioSession.startAudioSession();
        console.log('Audio session started');
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
      <SafeAreaView style={styles.container}>
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
            title={loading ? "Connecting to June..." : "Join Room"}
            onPress={fetchToken}
            disabled={loading}
          />
          
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>Token URL: https://api.ozzu.world/livekit/token</Text>
              <Text style={styles.debugText}>WebSocket: wss://livekit.ozzu.world</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        options={{
          adaptiveStream: { pixelDensity: 'screen' },
          publishDefaults: {
            audioPreset: {
              maxBitrate: 20_000,
            },
          },
        }}
        audio={true}
        video={true}
        onDisconnected={(reason) => {
          console.log('Disconnected from room:', reason);
          setConnected(false);
          setToken("");
          setLivekitUrl("");
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
    const handleRoomEvent = (event: any) => {
      console.log('Room event:', event);
    };

    room.on(RoomEvent.Connected, () => {
      console.log('Connected to room successfully');
      console.log('Room participants:', room.numParticipants);
    });
    
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
    });
    
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
    });

    return () => {
      room.removeAllListeners();
    };
  }, [room]);

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicEnabled);
    setIsMicEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
    setIsCameraEnabled(!isCameraEnabled);
  };

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({ item }) => {
    if (isTrackReference(item)) {
      return (
        <View style={styles.participantContainer}>
          <VideoTrack 
            trackRef={item} 
            style={styles.participantView}
            objectFit="cover"
          />
          <Text style={styles.participantName}>
            {item.participant?.identity || 'Unknown'}
            {item.participant === localParticipant && ' (You)'}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.participantView, styles.placeholderView]}>
          <Text style={styles.placeholderText}>No Video</Text>
        </View>
      );
    }
  };

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
        keyExtractor={(item, index) => {
          if (isTrackReference(item)) {
            return `${item.participant?.sid}-${item.publication?.trackSid}`;
          }
          return `placeholder-${index}`;
        }}
        numColumns={2}
        contentContainerStyle={styles.tracksContainer}
      />
      
      <View style={styles.controls}>
        <Button
          title={isMicEnabled ? "🎤 Mute" : "🎤 Unmute"}
          onPress={toggleMicrophone}
          color={isMicEnabled ? "#007AFF" : "#FF3B30"}
        />
        <Button
          title={isCameraEnabled ? "📹 Stop Video" : "📹 Start Video"}
          onPress={toggleCamera}
          color={isCameraEnabled ? "#007AFF" : "#FF3B30"}
        />
        <Button
          title="Leave"
          onPress={onDisconnect}
          color="#FF3B30"
        />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const participantWidth = (width - 30) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e8e8e8',
    borderRadius: 5,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  roomContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantCount: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  connectionStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  tracksContainer: {
    padding: 10,
    flexGrow: 1,
  },
  participantContainer: {
    margin: 5,
  },
  participantView: {
    width: participantWidth,
    height: participantWidth * 0.75, // 4:3 aspect ratio
    borderRadius: 8,
    overflow: 'hidden',
  },
  participantName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  placeholderView: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
});