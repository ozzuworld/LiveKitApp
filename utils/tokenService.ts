export interface TokenRequest {
  room: string;
  identity: string;
}

export interface TokenResponse {
  token: string;
}

export class TokenService {
  private static readonly BASE_URL = 'https://api.ozzu.world';
  private static readonly TOKEN_ENDPOINT = '/livekit/token';

  static async fetchToken(room: string, identity: string): Promise<string> {
    if (!room.trim()) {
      throw new Error('Room name is required');
    }
    
    if (!identity.trim()) {
      throw new Error('Identity is required');
    }

    const requestBody: TokenRequest = {
      room: room.trim(),
      identity: identity.trim()
    };

    console.log('Fetching token for:', requestBody);

    try {
      const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
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
      return data.token;
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

  static validateIdentity(identity: string): boolean {
    // Identity should be alphanumeric with dashes/underscores
    const identityRegex = /^[a-zA-Z0-9_-]+$/;
    return identityRegex.test(identity) && identity.length >= 1 && identity.length <= 50;
  }

  static generateRandomIdentity(): string {
    return `user-${Math.floor(Math.random() * 10000)}`;
  }
}

export default TokenService;