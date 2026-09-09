import { authService } from '../src/services/auth.service.js';

async function testFlow() {
  const testEmail = `test_verify_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Verification TestUser';

  console.log('--- 🧪 STARTING EMAIL VERIFICATION FLOW TEST ---');
  console.log(`Test Email: ${testEmail}`);

  // 1. Register User
  console.log('\nStep 1: Registering user...');
  const regResult = await authService.register({
    email: testEmail,
    password: testPassword,
    fullName: testName,
  });

  console.log('Result status:', regResult.user.status);
  console.log('Requires verification:', regResult.requiresVerification);
  console.log('Verification link generated:', regResult.verificationLink);

  // 2. Attempt Login Before Verification
  console.log('\nStep 2: Attempting login BEFORE verifying email (should fail)...');
  try {
    await authService.login({ email: testEmail, password: testPassword });
    console.error('❌ ERROR: Login succeeded when it should have failed!');
  } catch (err) {
    console.log(`✅ Expected Login Blocked: HTTP ${err.statusCode} - ${err.message} (${err.code})`);
  }

  // 3. Extract Token & Verify Email
  console.log('\nStep 3: Verifying email using token...');
  const urlObj = new URL(regResult.verificationLink);
  const token = urlObj.searchParams.get('token');

  const verifyResult = await authService.verifyEmail(token);
  console.log('Verification status:', verifyResult.user.status);
  console.log('Tokens issued on verification:', Boolean(verifyResult.accessToken));

  // 4. Attempt Login After Verification
  console.log('\nStep 4: Attempting login AFTER verifying email (should succeed)...');
  const loginResult = await authService.login({ email: testEmail, password: testPassword });
  console.log('✅ Login Succeeded!');
  console.log(`User ID : ${loginResult.user.userId}`);
  console.log(`Status  : ${loginResult.user.status}`);
  console.log(`Role    : ${loginResult.user.role}`);
  console.log('--- 🎉 EMAIL VERIFICATION TEST COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

testFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
