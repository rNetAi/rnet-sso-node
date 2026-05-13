import { RNetAuth, RNetAi } from './index.js';
import assert from 'assert';

console.log('Running basic tests...');

const originalFetch = globalThis.fetch;

try {
    // Test RNetAuth instantiation
    const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3000'
    };
    const auth = new RNetAuth(config);
    assert.strictEqual(auth.clientId, 'test-id');
    console.log('RNetAuth instantiated correctly');

    // Test PKCE generation
    const pkce = auth.generatePKCE();
    assert.ok(pkce.verifier);
    assert.ok(pkce.challenge);
    console.log('PKCE generation works');

    // Test Authorization URL
    const url = auth.getAuthorizationUrl(pkce.challenge);
    assert.ok(url.includes('code_challenge=' + pkce.challenge));
    console.log('Authorization URL generated correctly');

    // Test RNetAi instantiation
    const ai = new RNetAi();
    assert.strictEqual(ai.aiProvider, 'https://ai-provider.rnetai.org');
    console.log('RNetAi instantiated correctly with default provider');

    // Test UserInfo request
    globalThis.fetch = async (url, options) => {
        assert.strictEqual(url, 'https://central-backend.rnetai.org/userinfo');
        assert.strictEqual(options.method, 'GET');
        assert.strictEqual(options.headers.Authorization, 'Bearer test-access-token');
        return new Response(JSON.stringify({
            sub: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
            user_id: 123,
            role: 'USER',
            status: 'ACTIVE'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const userInfo = await auth.getUserInfo('test-access-token');
    assert.strictEqual(userInfo.sub, 'user-123');
    assert.strictEqual(userInfo.email, 'user@example.com');
    console.log('UserInfo request works');

    console.log('\nAll basic tests passed!');
} catch (error) {
    console.error('\nTest failed:');
    console.error(error);
    process.exit(1);
} finally {
    globalThis.fetch = originalFetch;
}
