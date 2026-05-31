export interface RNetAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
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

export interface FileUploadResponse {
    fileReference: string;
    name: string;
    mimeType: string;
    provider: string;
}

export interface FileDeleteResponse {
    deleted: boolean;
    fileId: string;
    error?: string;
}

export class RNetAuth {
    constructor(config: RNetAuthConfig);
    generatePKCE(): PKCE;
    getAuthorizationUrl(challenge?: string, state?: string): string;
    exchangeCodeForToken(code: string, codeVerifier?: string): Promise<TokenResponse>;
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
    getUserInfo(accessToken: string): Promise<Record<string, any>>;
}

export class RNetAi {
    constructor();
    chat(body: any, accessToken: string, model: string): Promise<any>;
    chatStream(body: any, accessToken: string, model: string): Promise<ReadableStream>;
    geminiFileUpload(accessToken: string, model: string, file: Blob | Buffer, mimeType: string, displayName?: string): Promise<FileUploadResponse>;
    openAIFileUpload(accessToken: string, model: string, file: Blob | Buffer, mimeType: string, displayName?: string): Promise<FileUploadResponse>;
    claudeFileUpload(accessToken: string, model: string, file: Blob | Buffer, mimeType: string, displayName?: string): Promise<FileUploadResponse>;
    openAIFileDelete(accessToken: string, model: string, fileId: string): Promise<FileDeleteResponse>;
    claudeFileDelete(accessToken: string, model: string, fileId: string): Promise<FileDeleteResponse>;
}

export default RNetAuth;
