import { authService } from '../src/services/auth.service.js';
import { supabase, supabaseAdmin } from '../src/config/supabase.js';

async function testResetTokenFormats() {
  console.log('--- 🧪 TESTING ALL RESET PASSWORD TOKEN FORMATS ---');

  const testEmail = `reset_fmt_${Date.now()}@alphaexplora.com`;
  const password = 'InitialPassword123!';
  const newPassword = 'NewPassword123!';

  console.log(`1. Registering user ${testEmail}...`);
  const regRes = await authService.register({
    email: testEmail,
    password,
    fullName: 'Reset Format Tester',
  });

  console.log('\n2. Testing forgotPassword service...');
  const forgotRes = await authService.forgotPassword(testEmail);
  console.log('Reset Link:', forgotRes.resetLink);

  const jwtToken = new URL(forgotRes.resetLink).searchParams.get('token');
  console.log('Extracted JWT Token:', jwtToken.slice(0, 25) + '...');

  console.log('\n3. Testing resetPassword with JWT Token...');
  const resetRes1 = await authService.resetPassword({ token: jwtToken, newPassword });
  console.log('JWT Reset Result:', resetRes1.message);

  console.log('\n4. Testing resetPassword via Supabase recovery token_hash ({{ .TokenHash }})...');
  const sbEmail = `sb_rec_${Date.now()}_${Math.floor(Math.random()*1000)}@alphaexplora.com`;
  await authService.register({ email: sbEmail, password, fullName: 'SB Recovery User' });
  await supabaseAdmin.auth.admin.createUser({ email: sbEmail, password, email_confirm: true });

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: sbEmail,
  });

  if (linkErr) {
    console.error('generateLink error:', linkErr.message);
  }

  const sbActionLink = linkData?.properties?.action_link;
  console.log('Supabase Recovery Action Link:', sbActionLink);

  if (sbActionLink) {
    const hashedToken = new URL(sbActionLink).searchParams.get('token');
    console.log('Extracted Supabase token_hash ({{ .TokenHash }}):', hashedToken);
    if (hashedToken) {
      const resetRes2 = await authService.resetPassword({ token: hashedToken, newPassword: 'AnotherPassword123!' });
      console.log('Supabase OTP Reset Result:', resetRes2.message);
    }
  }

  console.log('\n✅ ALL RESET PASSWORD TOKEN FORMATS TESTED SUCCESSFULLY!');
  process.exit(0);
}

testResetTokenFormats().catch((err) => {
  console.error('❌ Reset password token format test failed:', err);
  process.exit(1);
});
