// Minimal ambient type declarations for Google Identity Services (GIS)
// https://accounts.google.com/gsi/client

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string }) => void;
}

interface TokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

interface Window {
  google: {
    accounts: {
      oauth2: {
        initTokenClient(config: TokenClientConfig): TokenClient;
        revoke(token: string, done?: () => void): void;
      };
    };
  };
}
