import crypto from 'crypto';

const ISSUER = "https://central-backend.rnetai.org";
const AI_PROVIDER = "https://ai-provider.rnetai.org";

/**
 * RNet Auth Node.js Library
 * A backend library to verify and exchange OAuth2 tokens and interact with rNet Ai.
 */
class RNetAuth {
    /**
     * @param {Object} config Configuration object
     * @param {string} config.clientId Client ID of the OAuth application
     * @param {string} config.clientSecret Client Secret of the OAuth application
     * @param {string} config.redirectUri The redirect URI matching the frontend
     */
    constructor(config) {
        if (!config.clientId || !config.clientSecret || !config.redirectUri) {
            throw new Error("clientId, clientSecret, and redirectUri are required");
        }

        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.redirectUri = config.redirectUri;
        Object.defineProperty(this, 'issuer', {
            value: ISSUER,
            writable: false,
            configurable: false,
            enumerable: true
        });
    }

    /**
     * Generates a PKCE code_verifier and code_challenge
     * @returns {Object} { verifier, challenge }
     */
    generatePKCE() {
        const verifier = crypto.randomBytes(32).toString('base64url');
        const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
        return { verifier, challenge };
    }

    /**
     * Generates the authorization URL to redirect the user to the login page.
     * @param {string} [challenge] The PKCE code challenge
     * @param {string} [state] An optional state parameter to prevent CSRF and manage multiple users
     * @returns {string} The authorization URL
     */
    getAuthorizationUrl(challenge, state) {
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: "openid profile email" // doesn't make sense for me to use this but it work so i don't touch it
        });

        if (challenge) {
            params.append('code_challenge', challenge);
            params.append('code_challenge_method', 'S256');
        }

        if (state) {
            params.append('state', state);
        }

        return `${ISSUER}/oauth2/authorize?${params.toString()}`;
    }

    /**
     * Exchanges an authorization code for tokens
     * @param {string} code The authorization code received from the frontend
     * @param {string} [codeVerifier] The PKCE verifier
     * @returns {Promise<Object>} Token response
     */
    async exchangeCodeForToken(code, codeVerifier) {
        const tokenEndpoint = `${ISSUER}/oauth2/token`;

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirectUri
        });

        if (codeVerifier) {
            params.append('code_verifier', codeVerifier);
        }

        const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: params.toString()
        });

        return this._handleResponse(response);
    }

    /**
     * Renews tokens using a refresh token
     * @param {string} refreshToken The refresh token
     * @returns {Promise<Object>} Token response
     */
    async refreshAccessToken(refreshToken) {
        const tokenEndpoint = `${ISSUER}/oauth2/token`;

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });

        const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            },
            body: params.toString()
        });

        return this._handleResponse(response);
    }

    /**
     * Fetches the authenticated user's profile from the OAuth UserInfo endpoint.
     * @param {string} accessToken The current user's access token
     * @returns {Promise<Object>} UserInfo claims such as sub, email, name, user_id, role, and status
     */
    async getUserInfo(accessToken) {
        if (!accessToken) throw new Error("accessToken is required");

        const response = await fetch(`${ISSUER}/userinfo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return this._handleResponse(response);
    }

    async _handleResponse(response) {
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errorData = {};
            try { errorData = JSON.parse(text); } catch(e) {}
            console.error("\n🚨 [RNetAi Debug] RAW ERROR BODY:", text, "\n");
            throw new Error(`Request failed: ${response.status} - ${errorData.error || ''}`);
        }
        return await response.json();
    }
}

/**
 * rNet Ai Library
 * Interaction with rNet Ai services.
 */
class RNetAi {
    constructor() {
        Object.defineProperty(this, 'aiProvider', {
            value: AI_PROVIDER,
            writable: false,
            configurable: false,
            enumerable: true
        });
    }

    /**
     * Calls the rNet Ai Provider API
     * @param {Object} body The AI request payload
     * @param {string} accessToken The current user's access token
     * @param {string} model AI model name
     * @returns {Promise<Object>} The AI model's response
     */
    async chat(body, accessToken, model) {
        if (!accessToken) throw new Error("accessToken is required");
        if (!model) throw new Error("model is required");

        const params = new URLSearchParams({ access_token: accessToken, model });
        const url = `${AI_PROVIDER}/ai?${params.toString()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return this._handleResponse(response);
    }

    /**
     * Calls the rNet Ai Provider API and returns the response stream
     * @param {Object} body The AI request payload
     * @param {string} accessToken The current user's access token
     * @param {string} model AI model name
     * @returns {Promise<ReadableStream>} The AI model's response stream
     */
    async chatStream(body, accessToken, model) {
        if (!accessToken) throw new Error("accessToken is required");
        if (!model) throw new Error("model is required");

        const params = new URLSearchParams({ access_token: accessToken, model });
        const url = `${AI_PROVIDER}/ai/stream?${params.toString()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errorData = {};
            try { errorData = JSON.parse(text); } catch(e) {}
            console.error("\n🚨 [RNetAi Debug] RAW ERROR BODY:", text, "\n");
            throw new Error(`AI stream request failed: ${response.status} - ${errorData.error || ''}`);
        }

        return response.body;
    }

    /**
     * Uploads a file for use with Gemini models.
     * Gemini files auto-delete after 48 hours.
     * @param {string} accessToken JWT token
     * @param {string} model Gemini model name (e.g. "gemini-2.5-flash-lite")
     * @param {Blob|Buffer} file Binary file data
     * @param {string} mimeType MIME type (e.g. "image/png", "video/mp4", "application/pdf")
     * @param {string} [displayName] Human-readable name
     * @returns {Promise<Object>} { fileReference, name, mimeType, provider }
     */
    async geminiFileUpload(accessToken, model, file, mimeType, displayName) {
        return this._uploadFile(accessToken, model, file, mimeType, displayName);
    }

    /**
     * Uploads a file for use with OpenAI models.
     * Files persist until explicitly deleted via openAIFileDelete.
     * @param {string} accessToken JWT token
     * @param {string} model OpenAI model name (e.g. "gpt-4o")
     * @param {Blob|Buffer} file Binary file data
     * @param {string} mimeType MIME type (e.g. "image/png")
     * @param {string} [displayName] Filename
     * @returns {Promise<Object>} { fileReference, name, mimeType, provider }
     */
    async openAIFileUpload(accessToken, model, file, mimeType, displayName) {
        return this._uploadFile(accessToken, model, file, mimeType, displayName);
    }

    /**
     * Uploads a file for use with Claude models.
     * Files persist until explicitly deleted via claudeFileDelete.
     * @param {string} accessToken JWT token
     * @param {string} model Claude model name (e.g. "claude-3-sonnet-20240229")
     * @param {Blob|Buffer} file Binary file data
     * @param {string} mimeType MIME type (e.g. "image/png", "application/pdf")
     * @param {string} [displayName] Filename
     * @returns {Promise<Object>} { fileReference, name, mimeType, provider }
     */
    async claudeFileUpload(accessToken, model, file, mimeType, displayName) {
        return this._uploadFile(accessToken, model, file, mimeType, displayName);
    }

    /**
     * Deletes a file previously uploaded for OpenAI models.
     * @param {string} accessToken JWT token
     * @param {string} model OpenAI model name
     * @param {string} fileId The fileReference from the upload response
     * @returns {Promise<Object>} { deleted: boolean, fileId: string, error?: string }
     */
    async openAIFileDelete(accessToken, model, fileId) {
        return this._deleteFile(accessToken, model, fileId);
    }

    /**
     * Deletes a file previously uploaded for Claude models.
     * @param {string} accessToken JWT token
     * @param {string} model Claude model name
     * @param {string} fileId The fileReference from the upload response
     * @returns {Promise<Object>} { deleted: boolean, fileId: string, error?: string }
     */
    async claudeFileDelete(accessToken, model, fileId) {
        return this._deleteFile(accessToken, model, fileId);
    }

    async _uploadFile(accessToken, model, file, mimeType, displayName) {
        if (!accessToken) throw new Error("accessToken is required");
        if (!model) throw new Error("model is required");
        if (!file) throw new Error("file is required");
        if (!mimeType) throw new Error("mimeType is required");

        const params = new URLSearchParams({ access_token: accessToken, model });
        const url = `${AI_PROVIDER}/ai/upload?${params.toString()}`;

        const formData = new FormData();

        if (Buffer.isBuffer(file)) {
            formData.append('file', new Blob([file], { type: mimeType }), displayName || 'file');
        } else {
            formData.append('file', file, displayName || 'file');
        }

        formData.append('mimeType', mimeType);
        if (displayName) {
            formData.append('displayName', displayName);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        return this._handleResponse(response);
    }

    async _deleteFile(accessToken, model, fileId) {
        if (!accessToken) throw new Error("accessToken is required");
        if (!model) throw new Error("model is required");
        if (!fileId) throw new Error("fileId is required");

        const params = new URLSearchParams({ access_token: accessToken, model, fileId });
        const url = `${AI_PROVIDER}/ai/upload?${params.toString()}`;

        const response = await fetch(url, { method: 'DELETE' });

        return this._handleResponse(response);
    }

    async _handleResponse(response) {
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errorData = {};
            try { errorData = JSON.parse(text); } catch(e) {}
            console.error("\n🚨 [RNetAi Debug] RAW ERROR BODY:", text, "\n");
            throw new Error(`Request failed: ${response.status} - ${errorData.error || ''}`);
        }
        return await response.json();
    }
}

export { RNetAuth, RNetAi };
export default RNetAuth;
