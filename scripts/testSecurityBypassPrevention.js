import { authService } from '../src/services/auth.service.js';

async function testSecurityBypassPrevention() {
  console.log('--- 🧪 TESTING SECURITY BYPASS PREVENTION ---');

  // Test 1: Register unverified user
  const testEmail = `bypass_test_${Date.now()}@alphaexplora.com`;
  console.log(`Step 1: Registering unverified user ${testEmail}...`);
  const regResult = await authService.register({
    email: testEmail,
    password: 'SecurePassword123!',
    fullName: 'Bypass Test User',
  });

  const unverifiedUserId = regResult.user.userId;
  console.log('Registered User ID:', unverifiedUserId);

  // Test 2: Attempting to verify using plain user ID (should fail)
  console.log('\nStep 2: Attempting verification using plain user ID (should fail with 400)...');
  try {
    await authService.verifyEmail(unverifiedUserId);
    console.error('❌ SECURITY FAILURE: Verification allowed using plain user ID!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ Expected Security Block: HTTP ${err.statusCode} - ${err.message}`);
  }

  // Test 3: Attempting to verify using forged token (should fail)
  console.log('\nStep 3: Attempting verification using forged token string (should fail with 400)...');
  try {
    await authService.verifyEmail('forged_fake_token_1234567890');
    console.error('❌ SECURITY FAILURE: Verification allowed using forged token!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ Expected Security Block: HTTP ${err.statusCode} - ${err.message}`);
  }

  // Test 4: Verifying using valid signed JWT (should succeed)
  console.log('\nStep 4: Verifying using legitimate signed JWT token (should succeed)...');
  const validToken = authService.generateVerificationToken(regResult.user);
  const validResult = await authService.verifyEmail(validToken);
  console.log('Legitimate Verification Status:', validResult.user.status);

  if (validResult.user.status !== 'ACTIVE') {
    throw new Error('Legitimate verification failed!');
  }

  console.log('✅ ALL SECURITY BYPASS PREVENTION TESTS PASSED 100%!');
  process.exit(0);
}

testSecurityBypassPrevention().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
