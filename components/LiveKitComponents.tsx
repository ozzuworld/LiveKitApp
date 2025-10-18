import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  VideoTrack,
  AudioTrack,
  useLocalParticipant,
  useParticipants,
  useTracks,
  TrackReferenceOrPlaceholder,
  isTrackReference,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

// Custom Control Bar Component
export const CustomControlBar = () => {
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = React.useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = React.useState(true);

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicEnabled);
    setIsMicEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
    setIsCameraEnabled(!isCameraEnabled);
  };

  return (
    <View style={styles.controlBar}>
      <TouchableOpacity 
        style={[styles.controlButton, !isMicEnabled && styles.controlButtonDisabled]} 
        onPress={toggleMicrophone}
      >
        <Text style={styles.controlButtonText}>
          {isMicEnabled ? '🎤' : '🔇'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, !isCameraEnabled && styles.controlButtonDisabled]} 
        onPress={toggleCamera}
      >
        <Text style={styles.controlButtonText}>
          {isCameraEnabled ? '📹' : '📷'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Participant Grid Component
export const ParticipantGrid = () => {
  const participants = useParticipants();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <View style={styles.participantGrid}>
      {tracks.map((trackRef, index) => {
        if (isTrackReference(trackRef)) {
          return (
            <View key={`${trackRef.participant.sid}-${trackRef.publication?.trackSid}`} style={styles.participantContainer}>
              <VideoTrack 
                trackRef={trackRef} 
                style={styles.videoTrack}
                objectFit="cover"
              />
              <Text style={styles.participantName}>
                {trackRef.participant.identity}
              </Text>
            </View>
          );
        }
        return (
          <View key={`placeholder-${index}`} style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No Video</Text>
          </View>
        );
      })}
    </View>
  );
};

// Room Info Component
export const RoomInfo = ({ roomName, participantCount }: { roomName: string; participantCount: number }) => {
  return (
    <View style={styles.roomInfo}>
      <Text style={styles.roomName}>{roomName}</Text>
      <Text style={styles.participantCount}>
        {participantCount} participant{participantCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
};

// Audio Visualizer Component (placeholder for audio-only participants)
export const AudioVisualizer = ({ participant }: { participant: any }) => {
  return (
    <View style={styles.audioVisualizerContainer}>
      <Text style={styles.audioVisualizerText}>🎵</Text>
      <Text style={styles.audioParticipantName}>{participant.identity}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonDisabled: {
    backgroundColor: '#FF3B30',
  },
  controlButtonText: {
    fontSize: 20,
  },
  participantGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  participantContainer: {
    width: '48%',
    aspectRatio: 4/3,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoTrack: {
    flex: 1,
  },
  participantName: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  placeholderContainer: {
    width: '48%',
    aspectRatio: 4/3,
    margin: '1%',
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  roomInfo: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantCount: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  audioVisualizerContainer: {
    width: '48%',
    aspectRatio: 4/3,
    margin: '1%',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioVisualizerText: {
    fontSize: 40,
    marginBottom: 10,
  },
  audioParticipantName: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});