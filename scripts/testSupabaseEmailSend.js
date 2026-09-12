import { supabase, supabaseAdmin } from '../src/config/supabase.js';

async function testSupabaseEmailSend() {
  const testEmail = `toystore_test_${Date.now()}@gmail.com`;
  const password = 'TestPassword123!';
  const redirectUrl = 'http://localhost:3000/verify-email';

  console.log(`Testing Supabase Auth Free Email trigger for: ${testEmail}...`);

  // Test with standard anon client supabase.auth.signUp
  console.log('\n--- 1. Testing with standard supabase.auth.signUp (Anon Client) ---');
  const res1 = await supabase.auth.signUp({
    email: testEmail,
    password: password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  console.log('signUp (Anon Client) result:');
  console.log('  - user id:', res1.data?.user?.id);
  console.log('  - user email:', res1.data?.user?.email);
  console.log('  - confirmation_sent_at:', res1.data?.user?.confirmation_sent_at);
  console.log('  - error:', res1.error?.message || 'None');

  process.exit(0);
}

testSupabaseEmailSend().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
