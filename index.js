import crypto from 'crypto';

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
        this.issuer = "https://central-backend.rnetai.org";
        this.aiProvider = "https://ai-provider.rnetai.org";
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
     * @param {string} [scopes] The scopes to request (default: "openid profile email")
     * @returns {string} The authorization URL
     */
    getAuthorizationUrl(challenge) {
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

        return `${this.issuer}/oauth2/authorize?${params.toString()}`;
    }

    /**
     * Exchanges an authorization code for tokens
     * @param {string} code The authorization code received from the frontend
     * @param {string} [codeVerifier] The PKCE verifier
     * @returns {Promise<Object>} Token response
     */
    async exchangeCodeForToken(code, codeVerifier) {
        const tokenEndpoint = `${this.issuer}/oauth2/token`;

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
        const tokenEndpoint = `${this.issuer}/oauth2/token`;

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

    async _handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
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
    /**
     * @param {Object} config Configuration object
     * @param {string} config.aiProvider The AI provider URL
     */
    constructor() {
        this.aiProvider = "https://ai-provider.rnetai.org";
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
        const url = `${this.aiProvider}/ai?${params.toString()}`;

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
        const url = `${this.aiProvider}/ai/stream?${params.toString()}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI stream request failed: ${response.status} - ${errorData.error || ''}`);
        }

        return response.body;
    }

    async _handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Request failed: ${response.status} - ${errorData.error || ''}`);
        }
        return await response.json();
    }
}

export { RNetAuth, RNetAi };
export default RNetAuth;
