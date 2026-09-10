import { cartService } from '../src/services/cart.service.js';
import { authService } from '../src/services/auth.service.js';
import { productRepository } from '../src/repositories/product.repository.js';

async function testCartFlow() {
  console.log('--- 🧪 STARTING PHASE 1: CART & GUEST MERGING TEST ---');

  const guestSessionToken = `guest_session_${Date.now()}`;
  console.log(`Generated Guest Session Token: ${guestSessionToken}`);

  // 1. Fetch available product for testing
  const { products } = await productRepository.findAll({ limit: 1 });
  if (!products || products.length === 0) {
    console.error('❌ No products found in database! Please seed initial products first.');
    process.exit(1);
  }

  const testProduct = products[0];
  console.log(`Selected Test Product: "${testProduct.name}" (ID: ${testProduct.productId}, Price: $${testProduct.price})`);

  // 2. Get Initial Guest Cart (Should be empty)
  console.log('\nStep 1: Fetching initial guest cart...');
  let cart = await cartService.getCartDetails({ sessionToken: guestSessionToken });
  console.log(`Cart ID: ${cart.cartId} | Item Count: ${cart.itemCount} | Subtotal: $${cart.subtotal}`);

  // 3. Add Product to Guest Cart
  console.log('\nStep 2: Adding 2 units of product to guest cart...');
  cart = await cartService.addItem({
    sessionToken: guestSessionToken,
    productId: testProduct.productId,
    quantity: 2,
  });
  console.log(`✅ Item added! New Item Count: ${cart.itemCount} | Subtotal: $${cart.subtotal}`);

  // 4. Update Item Quantity
  const cartItem = cart.items[0];
  console.log('\nStep 3: Updating item quantity to 3...');
  cart = await cartService.updateItemQuantity({
    sessionToken: guestSessionToken,
    cartItemId: cartItem.cartItemId,
    quantity: 3,
  });
  console.log(`✅ Quantity updated! Item Count: ${cart.itemCount} | Subtotal: $${cart.subtotal}`);

  // 5. Test Insufficient Stock Handling
  console.log('\nStep 4: Testing insufficient stock validation (trying 9999 units)...');
  try {
    await cartService.addItem({
      sessionToken: guestSessionToken,
      productId: testProduct.productId,
      quantity: 9999,
    });
    console.error('❌ ERROR: Out of stock validation failed to block request!');
  } catch (err) {
    console.log(`✅ Out of Stock Blocked Correctly: "${err.message}"`);
  }

  // 6. Create User & Test Guest Cart Merging
  console.log('\nStep 5: Registering customer & testing guest cart merging...');
  const userEmail = `cart_user_${Date.now()}@example.com`;
  const regResult = await authService.register({
    email: userEmail,
    password: 'Password123!',
    fullName: 'Cart TestUser',
  });

  const userId = regResult.user.userId;
  console.log(`Registered Customer User ID: ${userId}`);

  // Merge Guest Cart into Customer Cart
  const mergedCart = await cartService.mergeSessionCart({
    sessionToken: guestSessionToken,
    userId,
  });

  console.log(`✅ Guest Cart Merged into Customer Cart!`);
  console.log(`Customer Cart ID: ${mergedCart.cartId} | Item Count: ${mergedCart.itemCount} | Subtotal: $${mergedCart.subtotal}`);

  // 7. Verify Guest Cart is now Empty
  const cleanedGuestCart = await cartService.getCartDetails({ sessionToken: guestSessionToken });
  console.log(`Guest Cart Item Count after Merge: ${cleanedGuestCart.itemCount} (Expected: 0)`);

  console.log('\n--- 🎉 PHASE 1: CART & GUEST MERGING TEST PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testCartFlow().catch((err) => {
  console.error('❌ Cart Test Failed:', err);
  process.exit(1);
});
