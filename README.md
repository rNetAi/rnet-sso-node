# RNet Auth Node.js Library

A lightweight Node.js library for integrating **RNet Auth** and **AI Provider** services. This library allows users to authenticate via RNet and pay for AI model token costs directly using their RNet account.

## Features

- **OAuth2 PKCE Support**: Secure authorization code flow with automatic code verifier and challenge generation.
- **Token Management**: Exchange authorization codes for tokens and refresh expired tokens.
- **AI Integration**: Easy methods to chat with AI models using standard or streaming responses.
- **Zero Dependencies**: Uses native `fetch` and `crypto` (Node.js 18+).
- **TypeScript Support**: Includes full type definitions (`index.d.ts`).
- **Modern JavaScript**: Built with ESM support.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher.

## Installation

```bash
npm install @rnet-ai/rnet-sso-node
```

## Quick Start

### 1. Initialize the Clients
```javascript
import { RNetAuth, RNetAi } from '@rnet-ai/rnet-sso-node';

const config = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  redirectUri: 'redirect-uri'
};

const auth = new RNetAuth(config);
const ai = new RNetAi();
```

### 2. Generate Authorization URL (OAuth2 PKCE)
```javascript
// Generate PKCE values
const { verifier, challenge } = auth.generatePKCE(); // Store 'verifier' in user session

// Get the URL to redirect the user to
const authUrl = auth.getAuthorizationUrl(challenge);
```

### 3. Exchange Code for Tokens
```javascript
// After the user redirects back with a ?code=...
const tokens = await auth.exchangeCodeForToken(code, verifier);
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;
```

### 4. Refresh Tokens
```javascript
const refreshedTokens = await auth.refreshAccessToken(refreshToken);
const newAccessToken = refreshedTokens.access_token;
```

### 5. Chat with AI
```javascript
const payload = {
  messages: [{ role: 'user', content: 'Hello!' }]
};

const response = await ai.chat(payload, accessToken, 'gemini-2.5-flash-lite');
console.log(response);
```

### 6. Streaming AI Response
```javascript
const stream = await ai.chatStream(payload, accessToken, "gemini-2.5-flash-lite");
// Process the ReadableStream...
```

## License
This project is licensed under the MIT License.
