import * as React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  Text,
  TextInput,
  Button,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  useRoomContext,
} from '@livekit/react-native';
import { Track, RoomEvent } from 'livekit-client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TokenService from './utils/tokenService';

export default function App() {
  const [token, setToken] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [shouldConnect, setShouldConnect] = useState(false);
  const [roomName, setRoomName] = useState('test-audio-room');
  const [participantName, setParticipantName] = useState(`user-${Math.floor(Math.random() * 1000)}`);

  useEffect(() => {
    let start = async () => {
      await AudioSession.startAudioSession();
    };
    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  const handleConnect = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Microphone permission required');
        }
      }

      console.log('Fetching token...');
      const response = await TokenService.fetchToken(roomName, participantName);
      console.log('Token response:', { 
        hasToken: !!response.token, 
        tokenLength: response.token?.length,
        url: response.livekitUrl 
      });
      
      const finalUrl = response.livekitUrl || TokenService.getWebSocketUrl();
      console.log('Will connect to:', finalUrl);
      console.log('Token preview:', response.token.substring(0, 50) + '...');
      
      setToken(response.token);
      setUrl(finalUrl);
      setShouldConnect(true);
    } catch (error: any) {
      console.error('Connection error:', error.message);
    }
  };

  const handleDisconnect = () => {
    setShouldConnect(false);
    setToken('');
    setUrl('');
  };

  if (!shouldConnect) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.content}>
          <Text style={styles.title}>LiveKit Audio Test</Text>

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

          <Button title="Connect" onPress={handleConnect} />
        </View>
      </SafeAreaView>
    );
  }

  console.log('Rendering LiveKitRoom with:', { url, hasToken: !!token, tokenLength: token.length });

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
      onConnected={() => console.log('LiveKitRoom onConnected callback fired!')}
      onError={(error) => console.error('LiveKitRoom error:', error)}
    >
      <RoomView onDisconnect={handleDisconnect} />
    </LiveKitRoom>
  );
}

const RoomView = ({ onDisconnect }: { onDisconnect: () => void }) => {
  const room = useRoomContext();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const tracks = useTracks([Track.Source.Camera]);

  useEffect(() => {
    if (!room) return;

    console.log('Setting up room event listeners...');
    console.log('Initial room state:', room.state);

    const handleConnected = () => {
      console.log('✅ Room Connected event fired!');
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnected = (reason?: any) => {
      console.log('❌ Room Disconnected:', reason);
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleConnectionStateChanged = (state: string) => {
      console.log('🔄 Connection state changed:', state);
      setConnectionState(state);
    };

    const handleSignalConnected = () => {
      console.log('📡 Signal connected!');
    };

    const handleReconnecting = () => {
      console.log('🔄 Reconnecting...');
    };

    const handleReconnected = () => {
      console.log('✅ Reconnected!');
    };

    const handleConnectionQualityChanged = (quality: any, participant: any) => {
      console.log('📊 Connection quality:', quality, participant?.identity);
    };

    const handleConnectionError = (error: any) => {
      console.error('🔥 Room connection error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.SignalConnected, handleSignalConnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
    
    // @ts-ignore - ConnectionError might not be in the type definitions
    if (RoomEvent.ConnectionError) {
      room.on(RoomEvent.ConnectionError, handleConnectionError);
    }

    // Check if already connected
    if (room.state === 'connected') {
      console.log('Room already connected on mount');
      setIsConnected(true);
      setConnectionState('connected');
    }

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      room.off(RoomEvent.SignalConnected, handleSignalConnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChanged);
      // @ts-ignore
      if (RoomEvent.ConnectionError) {
        room.off(RoomEvent.ConnectionError, handleConnectionError);
      }
    };
  }, [room]);

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({item}) => {
    if(isTrackReference(item)) {
      return (<VideoTrack trackRef={item} style={styles.participantView} />)
    } else {
      return (<View style={styles.participantView} />)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.roomContainer}>
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            State: {connectionState}
          </Text>
          {isConnected ? (
            <>
              <Text style={styles.connectedText}>✅ Connected</Text>
              <Text style={styles.statusText}>Room: {room?.name}</Text>
              <Text style={styles.statusText}>
                Participants: {room?.remoteParticipants?.size || 0 + 1}
              </Text>
            </>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
        </View>

        {isConnected && (
          <Button title="Disconnect" onPress={onDisconnect} color="#FF3B30" />
        )}

        <FlatList
          data={tracks}
          renderItem={renderTrack}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  roomContainer: {
    flex: 1,
  },
  statusBar: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  participantView: {
    height: 300,
  },
});