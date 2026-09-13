import { ENV } from '../src/config/env.js';
import { authService } from '../src/services/auth.service.js';

async function testProductionEmailLink() {
  console.log('--- 🧪 STARTING PRODUCTION EMAIL LINK & TAB SYNC TEST ---');

  // Test 1: Production URL Resolution
  process.env.NODE_ENV = 'production';
  process.env.CLIENT_URL = 'https://toy-store-frontend.vercel.app';
  
  const publicUrl = ENV.getPublicBaseUrl();
  console.log('\n[Test 1] Production CLIENT_URL set to https://toy-store-frontend.vercel.app');
  console.log('Resolved Base URL:', publicUrl);
  if (publicUrl !== 'https://toy-store-frontend.vercel.app') {
    throw new Error(`Expected production URL https://toy-store-frontend.vercel.app but got ${publicUrl}`);
  }
  console.log('✅ Test 1 Passed: Production URL correctly resolved!');

  // Test 2: VERCEL_URL Fallback Resolution
  delete process.env.CLIENT_URL;
  process.env.VERCEL_URL = 'toy-store-backend.vercel.app';
  const vercelPublicUrl = ENV.getPublicBaseUrl();
  console.log('\n[Test 2] VERCEL_URL set to toy-store-backend.vercel.app');
  console.log('Resolved Vercel Base URL:', vercelPublicUrl);
  if (vercelPublicUrl !== 'https://toy-store-backend.vercel.app') {
    throw new Error(`Expected https://toy-store-backend.vercel.app but got ${vercelPublicUrl}`);
  }
  console.log('✅ Test 2 Passed: Vercel URL fallback correctly resolved with HTTPS!');

  // Test 3: Link building in authService with production URL
  delete process.env.VERCEL_URL;
  process.env.CLIENT_URL = 'https://ae-b4-grp-01-prj-01-fe.vercel.app';

  const testEmail = `prod_test_${Date.now()}@alphaexplora.com`;
  const regResult = await authService.register({
    email: testEmail,
    password: 'SecureProdPassword123!',
    fullName: 'Prod Test User',
  });

  console.log('\n[Test 3] User registration with production CLIENT_URL');
  console.log('Verification link generated:', regResult.verificationLink);
  const isValidLink = regResult.verificationLink.includes('ae-b4-grp-01-prj-01-fe.vercel.app');
  if (!isValidLink) {
    throw new Error(`Verification link should target production URL but got ${regResult.verificationLink}`);
  }
  console.log('✅ Test 3 Passed: Verification link correctly targets production site URL!');

  console.log('\n--- 🎉 ALL PRODUCTION EMAIL LINK TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testProductionEmailLink().catch((err) => {
  console.error('❌ Production email link test failed:', err);
  process.exit(1);
});
