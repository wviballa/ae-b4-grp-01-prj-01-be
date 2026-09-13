import { authService } from '../src/services/auth.service.js';

async function testOptionBRedirect() {
  console.log('--- 🧪 TESTING OPTION B: REDIRECT TO /login?verified=true ---');

  const testEmail = `option_b_${Date.now()}@alphaexplora.com`;
  const regResult = await authService.register({
    email: testEmail,
    password: 'TestPassword123!',
    fullName: 'Option B Test User',
  });

  console.log('\nGenerated Verification Link:', regResult.verificationLink);
  
  if (!regResult.verificationLink.includes('/login') || !regResult.verificationLink.includes('verified=true')) {
    throw new Error(`Verification link should target /login?verified=true but got ${regResult.verificationLink}`);
  }

  console.log('✅ Option B link generation test passed!');
  process.exit(0);
}

testOptionBRedirect().catch(err => {
  console.error('❌ Option B test failed:', err);
  process.exit(1);
});
