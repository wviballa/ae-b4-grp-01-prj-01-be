import { supabase, supabaseAdmin } from '../src/config/supabase.js';

async function testOtp() {
  const email = `otp_test_${Date.now()}@alphaexplora.com`;
  const password = 'TestPassword123!';
  const redirectUrl = 'https://ae-b4-grp-01-prj-01-fe.vercel.app/verify-email';

  console.log('1. Registering user via supabase.auth.signUp...');
  const regRes = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  console.log('User created:', regRes.data?.user?.id);
  console.log('Confirmation sent at:', regRes.data?.user?.confirmation_sent_at);
  console.log('Error:', regRes.error?.message);

  console.log('\n2. Listing user in admin to inspect confirmation token status...');
  const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = adminUsers.users.find(u => u.email === email);
  console.log('Supabase user email_confirmed_at:', sbUser?.email_confirmed_at);
  console.log('Supabase user confirmation_sent_at:', sbUser?.confirmation_sent_at);

  process.exit(0);
}

testOtp().catch(err => {
  console.error(err);
  process.exit(1);
});
