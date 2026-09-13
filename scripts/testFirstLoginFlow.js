import { authService } from '../src/services/auth.service.js';
import { supabaseAdmin } from '../src/config/supabase.js';

async function testFirstLoginFlow() {
  console.log('--- 🧪 TESTING FIRST-TIME LOGIN FAST ACTIVATION ---');

  const testEmail = `first_login_${Date.now()}@alphaexplora.com`;
  const password = 'TestPassword123!';

  console.log(`1. Registering user ${testEmail}...`);
  const regResult = await authService.register({
    email: testEmail,
    password,
    fullName: 'First Login User',
  });

  console.log('User status after registration:', regResult.user.status);
  if (regResult.user.status !== 'UNVERIFIED') {
    throw new Error('User status should initially be UNVERIFIED');
  }

  console.log('\n2. Simulating email confirmation in Supabase Auth (setting email_confirmed_at)...');
  const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = adminUsers.users.find(u => u.email === testEmail);
  
  if (sbUser) {
    await supabaseAdmin.auth.admin.updateUserById(sbUser.id, {
      email_confirm: true,
    });
    console.log('Supabase user email_confirmed set to true.');
  }

  console.log('\n3. Performing VERY FIRST LOGIN attempt...');
  const loginResult = await authService.login({ email: testEmail, password });

  console.log('Login Result Status:', loginResult.user.status);
  console.log('Access Token Generated:', Boolean(loginResult.accessToken));

  if (loginResult.user.status !== 'ACTIVE' || !loginResult.accessToken) {
    throw new Error('First login attempt failed to activate user!');
  }

  console.log('✅ FIRST LOGIN ATTEMPT SUCCEEDED INSTANTLY ON 1ST TRY!');
  process.exit(0);
}

testFirstLoginFlow().catch(err => {
  console.error('❌ First login test failed:', err);
  process.exit(1);
});
