import { supabaseAdmin } from '../src/config/supabase.js';

async function checkLatestUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('userId, email, role, status, createdAt')
    .order('createdAt', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('=== LATEST 5 USERS IN SUPABASE ===');
    console.table(data);
  }
  process.exit(0);
}

checkLatestUsers();
