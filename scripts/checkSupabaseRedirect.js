import { supabaseAdmin } from '../src/config/supabase.js';

async function checkLink() {
  const email = `check_redirect_${Date.now()}@example.com`;
  const res = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: 'Password123!',
    options: {
      redirectTo: 'https://ae-b4-grp-01-prj-01-fe.vercel.app/verify-email',
    },
  });

  console.log('Action Link:', res.data?.properties?.action_link);
  console.log('RedirectTo parameter in Link:', res.data?.properties?.redirect_to);
  process.exit(0);
}

checkLink().catch(err => {
  console.error(err);
  process.exit(1);
});
