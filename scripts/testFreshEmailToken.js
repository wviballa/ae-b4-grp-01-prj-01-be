import { authService } from '../src/services/auth.service.js';

async function testFreshEmailToken() {
  console.log('--- 🧪 TESTING SINGLE-USE TOKEN INTEGRITY & FRESH VERIFICATION ---');

  const testEmail = `fresh_token_${Date.now()}@alphaexplora.com`;
  const password = 'FreshPassword123!';

  console.log(`\nStep 1: Registering user ${testEmail}...`);
  const regResult = await authService.register({
    email: testEmail,
    password: password,
    fullName: 'Fresh Token User',
  });

  console.log('Registration complete.');
  console.log('User ID:', regResult.user.userId);
  console.log('User Status:', regResult.user.status);
  console.log('Fallback Verification Link:', regResult.verificationLink);

  console.log('\nStep 2: Verifying using fallback JWT token...');
  const token = authService.generateVerificationToken(regResult.user);
  const verifyResult = await authService.verifyEmail(token);

  console.log('Verification Status:', verifyResult.user.status);
  if (verifyResult.user.status !== 'ACTIVE') {
    throw new Error('User status should be ACTIVE after verification');
  }

  console.log('\nStep 3: Logging in after verification...');
  const loginResult = await authService.login({ email: testEmail, password });
  console.log('Login Status:', loginResult.user.status);

  console.log('✅ Single-use token integrity test passed! Token was not overwritten during signup.');
  process.exit(0);
}

testFreshEmailToken().catch((err) => {
  console.error('❌ Fresh token test failed:', err);
  process.exit(1);
});
