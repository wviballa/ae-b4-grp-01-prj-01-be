import { authService } from '../src/services/auth.service.js';
import { userRepository } from '../src/repositories/user.repository.js';

async function runForgotPasswordTest() {
  console.log('================================================================');
  console.log('🧪 TESTING FORGOT PASSWORD & RESET PASSWORD LIFECYCLE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testEmail = `forgot_test_${timestamp}@toystore.com`;
  const initialPassword = 'InitialPassword123!';
  const updatedPassword = 'NewResetPassword456!';

  // 1. REGISTER TEST USER
  console.log(`[STEP 1] Registering user: ${testEmail}...`);
  const regRes = await authService.register({
    email: testEmail,
    password: initialPassword,
    fullName: 'Password Reset Tester',
  });

  // Verify email directly to allow login
  await userRepository.verifyEmail(regRes.user.userId);
  console.log('  ✅ User registered & email marked ACTIVE!\n');

  // 2. REQUEST FORGOT PASSWORD
  console.log(`[STEP 2] Requesting forgotPassword for ${testEmail}...`);
  const forgotRes = await authService.forgotPassword(testEmail);
  console.log(`  Response message : "${forgotRes.message}"`);
  console.log(`  Reset link       : ${forgotRes.resetLink}`);

  if (!forgotRes.resetLink || !forgotRes.resetLink.includes('token=')) {
    console.error('❌ STEP 2 FAILED: Missing reset token in reset link');
    process.exit(1);
  }
  const token = new URL(forgotRes.resetLink).searchParams.get('token');
  console.log(`  ✅ Token extracted: ${token.slice(0, 20)}...\n`);

  // 3. RESET PASSWORD
  console.log(`[STEP 3] Resetting password via resetPassword method...`);
  const resetRes = await authService.resetPassword({
    token,
    newPassword: updatedPassword,
  });
  console.log(`  Response message : "${resetRes.message}"`);
  console.log('  ✅ Password updated in database successfully!\n');

  // 4. VERIFY LOGIN WITH OLD PASSWORD (MUST FAIL)
  console.log('[STEP 4] Attempting login with OLD password (should fail)...');
  try {
    await authService.login({ email: testEmail, password: initialPassword });
    console.error('❌ STEP 4 FAILED: Login succeeded with old password!');
    process.exit(1);
  } catch (err) {
    console.log(`  ✅ Expected Login Blocked: ${err.message} (${err.statusCode})\n`);
  }

  // 5. VERIFY LOGIN WITH NEW PASSWORD (MUST SUCCEED)
  console.log('[STEP 5] Attempting login with NEW password (should succeed)...');
  const loginRes = await authService.login({ email: testEmail, password: updatedPassword });
  console.log(`  ✅ Login Succeeded! User ID: ${loginRes.user.userId}`);
  console.log(`  Tokens issued : AccessToken=${Boolean(loginRes.accessToken)} | RefreshToken=${Boolean(loginRes.refreshToken)}\n`);

  console.log('================================================================');
  console.log('🎉 FORGOT & RESET PASSWORD TEST COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
}

runForgotPasswordTest().catch((err) => {
  console.error('❌ Forgot Password Test Error:', err);
  process.exit(1);
});
