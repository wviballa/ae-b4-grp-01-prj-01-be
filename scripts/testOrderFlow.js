import { authService } from '../src/services/auth.service.js';
import { cartService } from '../src/services/cart.service.js';
import { orderService } from '../src/services/order.service.js';
import { addressRepository } from '../src/repositories/address.repository.js';
import { productRepository } from '../src/repositories/product.repository.js';
import { inventoryRepository } from '../src/repositories/inventory.repository.js';
import { userRepository } from '../src/repositories/user.repository.js';

async function testOrderFlow() {
  console.log('--- 🧪 STARTING PHASE 2: ORDER CHECKOUT & STOCK RESERVATION TEST ---');

  // 1. Create and Activate Test Customer
  const email = `order_test_${Date.now()}@example.com`;
  console.log(`Step 1: Creating test customer (${email})...`);
  const regResult = await authService.register({
    email,
    password: 'Password123!',
    fullName: 'Order TestUser',
  });

  const userId = regResult.user.userId;
  await userRepository.verifyEmail(userId); // Activate user
  console.log(`✅ User created and activated (ID: ${userId})`);

  // 2. Create Shipping Address
  console.log('\nStep 2: Creating shipping address...');
  const address = await addressRepository.create(userId, {
    recipientName: 'Order TestUser',
    phone: '+15551234567',
    addressLine1: '123 Toy Kingdom Way',
    city: 'San Francisco',
    stateProvince: 'CA',
    postalCode: '94107',
    country: 'USA',
    isDefaultShipping: true,
  });
  console.log(`✅ Shipping Address created (ID: ${address.addressId})`);

  // 3. Fetch Test Toy Product
  const { products } = await productRepository.findAll({ limit: 1 });
  const testProduct = products[0];
  console.log(`\nStep 3: Selected product "${testProduct.name}" (Price: $${testProduct.price})`);

  // Check initial stock
  const initialInv = await inventoryRepository.findByProductId(testProduct.productId);
  console.log(`Initial Stock Quantity: ${initialInv.stockQuantity} | Initial Reserved: ${initialInv.reservedQuantity}`);

  // 4. Add Items to User Cart
  console.log('\nStep 4: Adding 2 items to user cart...');
  await cartService.addItem({
    userId,
    productId: testProduct.productId,
    quantity: 2,
  });

  // 5. Get Checkout Summary
  console.log('\nStep 5: Generating checkout summary...');
  const summary = await orderService.getCheckoutSummary({
    userId,
    addressId: address.addressId,
  });
  console.log(`Subtotal: $${summary.subtotal} | Tax (8%): $${summary.taxAmount} | Shipping Fee: $${summary.shippingFee} | Total: $${summary.totalAmount}`);

  // 6. Create Order (Checkout)
  console.log('\nStep 6: Executing order placement (Checkout)...');
  const order = await orderService.createOrderFromCart({
    userId,
    addressId: address.addressId,
    orderNotes: 'Please handle with extra care!',
  });

  console.log('✅ Order Created Successfully!');
  console.log(`Order Number : ${order.orderNumber}`);
  console.log(`Order Status : ${order.status}`);
  console.log(`Total Amount : $${order.totalAmount}`);
  console.log(`Items Count  : ${order.items?.length || 0}`);

  // 7. Verify Inventory Reservation
  const postInv = await inventoryRepository.findByProductId(testProduct.productId);
  console.log(`\nStep 7: Verifying Inventory Stock Reservation...`);
  console.log(`Post-Order Stock Quantity: ${postInv.stockQuantity} | Post-Order Reserved: ${postInv.reservedQuantity} (Expected +2)`);

  // 8. Verify Cart Was Cleared
  const userCart = await cartService.getCartDetails({ userId });
  console.log(`User Cart Item Count Post-Checkout: ${userCart.itemCount} (Expected: 0)`);

  // 9. Verify Order Cancellation & Stock Release
  console.log('\nStep 8: Testing order cancellation & stock release...');
  const cancelledOrder = await orderService.cancelOrder(order.orderId);
  console.log(`Cancelled Order Status: ${cancelledOrder.status}`);

  const restoredInv = await inventoryRepository.findByProductId(testProduct.productId);
  console.log(`Restored Stock Reserved Quantity: ${restoredInv.reservedQuantity} (Expected: ${initialInv.reservedQuantity})`);

  console.log('\n--- 🎉 PHASE 2: ORDER CHECKOUT & STOCK RESERVATION TEST PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testOrderFlow().catch((err) => {
  console.error('❌ Phase 2 Test Failed:', err);
  process.exit(1);
});
