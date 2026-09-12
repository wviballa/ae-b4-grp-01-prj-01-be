import { productService } from '../src/services/product.service.js';
import { productRepository } from '../src/repositories/product.repository.js';
import { inventoryRepository } from '../src/repositories/inventory.repository.js';

async function runQuantityVerification() {
  console.log('================================================================');
  console.log('🧪 TESTING PRODUCT QUANTITY CREATION, UPDATE & INVENTORY SYNC');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testName = `Test Toy Figure ${timestamp}`;
  const initialQuantity = 75;

  // 1. CREATE PRODUCT WITH QUANTITY
  console.log(`[TEST 1] Creating product "${testName}" with quantity ${initialQuantity}...`);
  const created = await productService.createProduct({
    name: testName,
    sku: `QTY-TEST-${timestamp.toString().slice(-6)}`,
    price: 19.99,
    quantity: initialQuantity,
    description: 'A test toy for quantity verification',
  });

  console.log('  Response object verification:');
  console.log(`    - productId     : ${created.productId}`);
  console.log(`    - quantity      : ${created.quantity} (Expected: ${initialQuantity})`);
  console.log(`    - stockQuantity : ${created.stockQuantity} (Expected: ${initialQuantity})`);
  console.log(`    - inStock       : ${created.inStock} (Expected: true)`);
  console.log(`    - isOutOfStock  : ${created.isOutOfStock} (Expected: false)`);
  console.log(`    - inventory.stockQuantity : ${created.inventory?.stockQuantity} (Expected: ${initialQuantity})`);

  if (created.quantity !== initialQuantity || created.inStock !== true || created.isOutOfStock !== false) {
    console.error('❌ TEST 1 FAILED: Incorrect quantity or stock status on creation');
    process.exit(1);
  }
  console.log('  ✅ TEST 1 PASSED: Product created with quantity successfully!\n');

  // 2. UPDATE PRODUCT QUANTITY TO OUT OF STOCK (0)
  console.log(`[TEST 2] Updating product quantity to 0 (Out of stock)...`);
  const updatedToZero = await productService.updateProduct(created.productId, {
    quantity: 0,
  });

  console.log('  Updated object verification:');
  console.log(`    - quantity      : ${updatedToZero.quantity} (Expected: 0)`);
  console.log(`    - inStock       : ${updatedToZero.inStock} (Expected: false)`);
  console.log(`    - isOutOfStock  : ${updatedToZero.isOutOfStock} (Expected: true)`);

  const invRecordZero = await inventoryRepository.findByProductId(created.productId);
  console.log(`    - inventory record stockQuantity : ${invRecordZero.stockQuantity} (Expected: 0)`);

  if (updatedToZero.quantity !== 0 || updatedToZero.inStock !== false || updatedToZero.isOutOfStock !== true || invRecordZero.stockQuantity !== 0) {
    console.error('❌ TEST 2 FAILED: Product stock update to zero failed');
    process.exit(1);
  }
  console.log('  ✅ TEST 2 PASSED: Product quantity updated to 0 and inventory synchronized!\n');

  // 3. UPDATE PRODUCT QUANTITY BACK TO 25
  console.log(`[TEST 3] Updating product quantity to 25...`);
  const updatedTo25 = await productService.updateProduct(created.productId, {
    quantity: 25,
  });

  console.log(`    - quantity      : ${updatedTo25.quantity} (Expected: 25)`);
  console.log(`    - inStock       : ${updatedTo25.inStock} (Expected: true)`);

  if (updatedTo25.quantity !== 25 || updatedTo25.inStock !== true) {
    console.error('❌ TEST 3 FAILED: Product stock update to 25 failed');
    process.exit(1);
  }
  console.log('  ✅ TEST 3 PASSED: Restocked product successfully!\n');

  // 4. LIST PRODUCTS VERIFICATION
  console.log(`[TEST 4] Fetching products list and checking quantity field presence...`);
  const listResult = await productService.getProducts({ limit: 5 });
  const sampleProduct = listResult.products[0];

  console.log('  Sample product from list response:');
  console.log(`    - name          : ${sampleProduct.name}`);
  console.log(`    - quantity      : ${sampleProduct.quantity}`);
  console.log(`    - inStock       : ${sampleProduct.inStock}`);

  if (sampleProduct.quantity === undefined || sampleProduct.inStock === undefined) {
    console.error('❌ TEST 4 FAILED: Product list response missing quantity/inStock fields');
    process.exit(1);
  }
  console.log('  ✅ TEST 4 PASSED: Product list properly formats quantity & inStock flags!\n');

  // CLEANUP
  console.log('[CLEANUP] Archiving test product...');
  await productService.archiveProduct(created.productId);
  console.log('  ✅ Test product archived.\n');

  console.log('================================================================');
  console.log('🎉 ALL PRODUCT QUANTITY VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
}

runQuantityVerification().catch((err) => {
  console.error('❌ Product Quantity Test Error:', err);
  process.exit(1);
});
