import { authService } from '../src/services/auth.service.js';

async function testResend() {
  const timestamp = Date.now();
  const testEmail = `resend_test_${timestamp}@alphaexplora.com`;
  const password = 'TestPassword123!';

  console.log('--- 🧪 TESTING RESEND VERIFICATION EMAIL ---');
  console.log(`Test Email: ${testEmail}`);

  // 1. Register User
  console.log('\nStep 1: Registering user...');
  const regResult = await authService.register({
    email: testEmail,
    password: password,
    fullName: 'Resend Verification Tester',
  });
  console.log('Registration message:', regResult.message);
  console.log('Requires verification:', regResult.requiresVerification);

  // 2. Request Resend Verification Link
  console.log('\nStep 2: Requesting resendVerification...');
  const resendResult = await authService.resendVerification(testEmail);
  console.log('Resend message:', resendResult.message);
  console.log('Verification link generated:', resendResult.verificationLink);

  console.log('\n✅ RESEND VERIFICATION TEST COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testResend().catch((err) => {
  console.error('❌ Resend test error:', err);
  process.exit(1);
});
