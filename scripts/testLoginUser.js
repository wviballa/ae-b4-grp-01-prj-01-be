import { authService } from '../src/services/auth.service.js';

async function testUserLogin() {
  const email = 'iballa.kylengis@gmail.com';
  console.log(`Testing backend login for: ${email}`);

  try {
    const res = await authService.login({ email, password: 'AnyPasswordHere123!' });
    console.log('Result:', res);
  } catch (err) {
    console.log(`✅ Backend Response: HTTP ${err.statusCode} - ${err.message} (code: ${err.code})`);
  }
  process.exit(0);
}

testUserLogin();
