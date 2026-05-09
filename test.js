import { RNetAuth, RNetAi } from './index.js';
import assert from 'assert';

console.log('Running basic tests...');

try {
    // Test RNetAuth instantiation
    const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3000'
    };
    const auth = new RNetAuth(config);
    assert.strictEqual(auth.clientId, 'test-id');
    console.log('✓ RNetAuth instantiated correctly');

    // Test PKCE generation
    const pkce = auth.generatePKCE();
    assert.ok(pkce.verifier);
    assert.ok(pkce.challenge);
    console.log('✓ PKCE generation works');

    // Test Authorization URL
    const url = auth.getAuthorizationUrl(pkce.challenge);
    assert.ok(url.includes('code_challenge=' + pkce.challenge));
    console.log('✓ Authorization URL generated correctly');

    // Test RNetAi instantiation
    const ai = new RNetAi();
    assert.strictEqual(ai.aiProvider, 'https://ai-provider.rnetai.org');
    console.log('✓ RNetAi instantiated correctly with default provider');

    console.log('\nAll basic tests passed!');
} catch (error) {
    console.error('\nTest failed:');
    console.error(error);
    process.exit(1);
}
