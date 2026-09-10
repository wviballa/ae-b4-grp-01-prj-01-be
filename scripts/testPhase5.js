import { authService } from '../src/services/auth.service.js';
import { productRepository } from '../src/repositories/product.repository.js';
import { reviewRepository } from '../src/repositories/review.repository.js';
import { adminController } from '../src/controllers/admin.controller.js';
import { userRepository } from '../src/repositories/user.repository.js';

async function testPhase5() {
  console.log('--- 🧪 STARTING PHASE 5: PRODUCT REVIEWS & ADMIN CONSOLE TEST ---');

  // 1. Setup Customer & Submit Product Review
  const email = `review_test_${Date.now()}@example.com`;
  console.log(`Step 1: Creating test customer (${email})...`);
  const regResult = await authService.register({
    email,
    password: 'Password123!',
    fullName: 'Reviewer TestUser',
  });

  const userId = regResult.user.userId;
  await userRepository.verifyEmail(userId);

  // Fetch Test Product
  const { products } = await productRepository.findAll({ limit: 1 });
  const testProduct = products[0];
  console.log(`Selected Product for Review: "${testProduct.name}" (ID: ${testProduct.productId})`);

  // 2. Submit Review
  console.log('\nStep 2: Submitting 5-star product review...');
  const review = await reviewRepository.create({
    userId,
    productId: testProduct.productId,
    rating: 5,
    title: 'Amazing Space Ship Toy!',
    comment: 'Super fast delivery and fantastic build quality. My kids love it!',
    status: 'APPROVED',
  });
  console.log(`✅ Review Created! (Review ID: ${review.reviewId}, Rating: ${review.rating} Stars)`);

  // 3. Fetch Product Reviews List
  console.log('\nStep 3: Fetching product reviews for item...');
  const productReviews = await reviewRepository.findByProductId(testProduct.productId);
  console.log(`✅ Approved Reviews Count for "${testProduct.name}": ${productReviews.length}`);
  console.log(`Latest Review Title: "${productReviews[0]?.title}" by ${productReviews[0]?.user?.profile?.firstName || 'Customer'}`);

  // 4. Admin BI Dashboard Overview
  console.log('\nStep 4: Fetching Admin Executive BI Overview Reports...');
  const mockReq = {};
  let overviewData = null;
  const mockRes = {
    status(code) {
      return this;
    },
    json(payload) {
      overviewData = payload.data;
      return this;
    },
  };
  const mockNext = (err) => { if (err) throw err; };

  await adminController.getOverview(mockReq, mockRes, mockNext);
  console.log('✅ Admin Overview Dashboard Metrics:');
  console.log(`  - Total Revenue      : $${overviewData.totalRevenue}`);
  console.log(`  - Total Orders       : ${overviewData.totalOrders}`);
  console.log(`  - Active Products    : ${overviewData.activeProducts}`);
  console.log(`  - Low Stock Alerts   : ${overviewData.lowStockAlertsCount}`);

  console.log('\n--- 🎉 PHASE 5: PRODUCT REVIEWS & ADMIN CONSOLE TEST PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testPhase5().catch((err) => {
  console.error('❌ Phase 5 Test Failed:', err);
  process.exit(1);
});
