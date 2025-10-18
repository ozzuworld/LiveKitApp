export interface TokenRequest {
  roomName: string;
  participantName: string;
  metadata?: string;
}

export interface TokenResponse {
  token: string;
  roomName: string;
  participantName: string;
  livekitUrl: string;
}

export class TokenService {
  private static readonly BASE_URL = 'https://api.ozzu.world';
  private static readonly TOKEN_ENDPOINT = '/livekit/token';

  static async fetchToken(roomName: string, participantName: string, metadata?: string): Promise<TokenResponse> {
    if (!roomName.trim()) {
      throw new Error('Room name is required');
    }
    
    if (!participantName.trim()) {
      throw new Error('Participant name is required');
    }

    const requestBody: TokenRequest = {
      roomName: roomName.trim(),
      participantName: participantName.trim()
    };

    if (metadata) {
      requestBody.metadata = metadata;
    }

    console.log('Fetching token for:', requestBody);

    try {
      const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Add authentication header if needed
          // 'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      console.log('Token received successfully');
      console.log('LiveKit URL:', data.livekitUrl);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Token fetch error:', error.message);
        throw error;
      }
      throw new Error('Unknown error occurred while fetching token');
    }
  }

  static validateRoomName(roomName: string): boolean {
    // Room names should be alphanumeric with dashes/underscores
    const roomNameRegex = /^[a-zA-Z0-9_-]+$/;
    return roomNameRegex.test(roomName) && roomName.length >= 1 && roomName.length <= 50;
  }

  static validateParticipantName(participantName: string): boolean {
    // Participant name should be alphanumeric with dashes/underscores
    const participantNameRegex = /^[a-zA-Z0-9_-]+$/;
    return participantNameRegex.test(participantName) && participantName.length >= 1 && participantName.length <= 50;
  }

  static generateRandomParticipantName(): string {
    return `user-${Math.floor(Math.random() * 10000)}`;
  }

  static getWebSocketUrl(): string {
    return 'wss://livekit.ozzu.world';
  }
}

export default TokenService;