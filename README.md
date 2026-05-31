# RNet OAuth Node.js Library

A lightweight Node.js library for integrating **RNet OAuth** services. This library allows users to authenticate via RNet and pay for AI model token costs directly using their RNet account.

## Features

- **OAuth2 PKCE Support**: Secure authorization code flow with automatic code verifier and challenge generation.
- **Token Management**: Exchange authorization codes for tokens and refresh expired tokens.
- **UserInfo Endpoint**: Fetch the authenticated user's RNet profile with an access token.
- **AI Integration**: Easy methods to chat with AI models using standard or streaming responses.
- **Zero Dependencies**: Uses native `fetch` and `crypto` (Node.js 18+).
- **TypeScript Support**: Includes full type definitions (`index.d.ts`).
- **Modern JavaScript**: Built with ESM support.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher.

## Installation

```bash
npm install @rnet-ai/rnet-oauth-node
```

## Quick Start

### 1. Initialize the Clients
```javascript
import { RNetAuth, RNetAi } from '@rnet-ai/rnet-oauth-node';

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
// challenge: PKCE code challenge (optional)
// state: An optional string to maintain state between the request and callback (recommended for security)
const authUrl = auth.getAuthorizationUrl(challenge, 'optional-state');
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

### 5. Get User Info
```javascript
const userInfo = await auth.getUserInfo(accessToken);
console.log(userInfo.email);
console.log(userInfo.name);
```

The UserInfo response comes from RNet's `/userinfo` endpoint and may include:
`sub`, `email`, `email_verified`, `name`, `preferred_username`, `user_id`, `role`, and `status`.

### 6. Chat with AI
```javascript
const payload = {
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Hello!' }]
    }
  ]
};

const response = await ai.chat(payload, accessToken, 'gemini-2.5-flash-lite');
console.log(response);
```

### 7. Streaming AI Response (Untested)
```javascript
const stream = await ai.chatStream(payload, accessToken, "gemini-2.5-flash-lite");
// Process the ReadableStream...
```

### 8. File Upload (Untested)
```javascript
const fs = require('fs');
const fileBuffer = fs.readFileSync('document.pdf');

// Upload to Gemini
const geminiUpload = await ai.geminiFileUpload(accessToken, 'gemini-2.5-flash-lite', fileBuffer, 'application/pdf', 'document.pdf');
console.log(geminiUpload.fileReference); // Use this in chat payload

// Upload to OpenAI
const openaiUpload = await ai.openAIFileUpload(accessToken, 'gpt-4o', fileBuffer, 'application/pdf', 'document.pdf');
```

### 9. File Deletion (Untested)
```javascript
// Gemini files auto-delete after 48 hours, so there is no delete method.
// Delete an OpenAI file:
await ai.openAIFileDelete(accessToken, 'gpt-4o', openaiUpload.fileReference);
```

### 10. AI Chat with File & Tools (Untested)
```javascript
const payload = {
  contents: [
    {
      role: 'user',
      parts: [
        { text: 'Based on this document, what is my name? Also search the web for the current weather in London.' },
        { fileData: { fileUri: geminiUpload.fileReference, mimeType: geminiUpload.mimeType } }
      ]
    }
  ],
  tools: [
    { googleSearch: {} } // Enable Google Search tool
  ]
};

const response = await ai.chat(payload, accessToken, 'gemini-2.5-flash-lite');
console.log(response);
```

## License
This project is licensed under the MIT License.
