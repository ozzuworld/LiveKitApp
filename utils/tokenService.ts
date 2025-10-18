export interface TokenResponse {
  token: string;
  roomName: string;
  participantName: string;
  livekitUrl: string;
}

export class TokenService {
  private static readonly BASE_URL = 'https://api.ozzu.world';
  private static readonly TOKEN_ENDPOINT = '/livekit/token';

  static async fetchToken(roomName: string, participantName: string): Promise<TokenResponse> {
    if (!roomName.trim() || !participantName.trim()) {
      throw new Error('Room name and participant name are required');
    }

    try {
      const response = await fetch(`${this.BASE_URL}${this.TOKEN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          participantName: participantName.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data: TokenResponse = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching token');
    }
  }

  static getWebSocketUrl(): string {
    return 'wss://livekit.ozzu.world';
  }
}

export default TokenService;