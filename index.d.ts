export interface RNetAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface RNetAiConfig {
    aiProvider?: string;
}

export interface PKCE {
    verifier: string;
    challenge: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
    [key: string]: any;
}

export class RNetAuth {
    constructor(config: RNetAuthConfig);
    generatePKCE(): PKCE;
    getAuthorizationUrl(challenge: string): string;
    exchangeCodeForToken(code: string, codeVerifier?: string): Promise<TokenResponse>;
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
}

export class RNetAi {
    constructor(config?: RNetAiConfig);
    chat(body: any, accessToken: string, model: string): Promise<any>;
    chatStream(body: any, accessToken: string, model: string): Promise<ReadableStream>;
}

export default RNetAuth;
