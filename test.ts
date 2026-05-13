import RNetAuth, { RNetAi, RNetAuthConfig, TokenResponse, PKCE } from './index.js';

const config: RNetAuthConfig = {
    clientId: 'test',
    clientSecret: 'test',
    redirectUri: 'http://localhost'
};

const auth = new RNetAuth(config);
const pkce: PKCE = auth.generatePKCE();
const authUrl: string = auth.getAuthorizationUrl(pkce.challenge);

async function test() {
    const tokens: TokenResponse = await auth.exchangeCodeForToken('code', pkce.verifier);
    const userInfo: Record<string, any> = await auth.getUserInfo(tokens.access_token);
    const ai = new RNetAi();
    const response = await ai.chat({ messages: [] }, tokens.access_token, 'model');
    const stream = await ai.chatStream({ messages: [] }, tokens.access_token, 'model');
}

console.log('TypeScript type check passed (if compiled successfully)');
