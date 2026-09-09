import { authService } from '../src/services/auth.service.js';

const args = process.argv.slice(2);
const email = args[0] || 'admin@toystore.com';
const password = args[1] || 'Admin123!';
const firstName = args[2] || 'Test';
const lastName = args[3] || 'Admin';

async function createAdmin() {
  console.log('--- Creating Toy Store Admin Account ---');
  console.log(`Email: ${email}`);
  console.log(`Role: ADMIN`);

  try {
    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'ADMIN',
    });

    console.log('\n✅ Admin user successfully created!');
    console.log('-----------------------------------');
    console.log(`User ID   : ${result.user.userId}`);
    console.log(`Email     : ${result.user.email}`);
    console.log(`Role      : ${result.user.role}`);
    console.log(`Tokens    : ${result.accessToken ? 'Generated' : 'None'}`);
    console.log('-----------------------------------');
  } catch (err) {
    console.error('\n❌ Error creating admin user:', err.message);
    if (err.details && err.details.length > 0) {
      console.error('Validation errors:', err.details);
    }
  } finally {
    process.exit(0);
  }
}

createAdmin();
