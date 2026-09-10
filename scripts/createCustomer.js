import { authService } from '../src/services/auth.service.js';
import { userRepository } from '../src/repositories/user.repository.js';

const args = process.argv.slice(2);
const email = args[0] || 'testcustomer@toystore.com';
const password = args[1] || 'Customer123!';
const fullName = args[2] || 'Default Test Customer';

async function createCustomer() {
  console.log('--- Creating Default Toy Store Customer Account ---');
  console.log(`Email   : ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role    : CUSTOMER`);

  try {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      console.log(`\n⚠️ Customer user "${email}" already exists! (User ID: ${existing.userId})`);
      await userRepository.verifyEmail(existing.userId);
      console.log(`✅ Ensured email status is ACTIVE.`);
      process.exit(0);
    }

    const result = await authService.register({
      email,
      password,
      fullName,
      role: 'CUSTOMER',
    });

    // Mark email as ACTIVE for immediate testing without email confirmation link
    if (result?.user?.userId) {
      await userRepository.verifyEmail(result.user.userId);
    }

    console.log('\n✅ Customer account successfully created and activated!');
    console.log('-----------------------------------');
    console.log(`User ID   : ${result.user.userId}`);
    console.log(`Email     : ${result.user.email}`);
    console.log(`Password  : ${password}`);
    console.log(`Status    : ACTIVE`);
    console.log('-----------------------------------');
  } catch (err) {
    console.error('\n❌ Error creating customer user:', err.message);
  } finally {
    process.exit(0);
  }
}

createCustomer();
