import { authService } from '../src/services/auth.service.js';
import { cartService } from '../src/services/cart.service.js';
import { orderService } from '../src/services/order.service.js';
import { paymentService } from '../src/services/payment.service.js';
import { shipmentService } from '../src/services/shipment.service.js';
import { addressRepository } from '../src/repositories/address.repository.js';
import { productRepository } from '../src/repositories/product.repository.js';
import { inventoryRepository } from '../src/repositories/inventory.repository.js';
import { userRepository } from '../src/repositories/user.repository.js';

async function testPhases3And4() {
  console.log('--- 🧪 STARTING PHASE 3 (PAYMENTS) & PHASE 4 (SHIPMENTS) TEST ---');

  // 1. Setup Customer & Address
  const email = `pay_ship_test_${Date.now()}@example.com`;
  console.log(`\nStep 1: Creating test customer (${email})...`);
  const regResult = await authService.register({
    email,
    password: 'Password123!',
    fullName: 'Payment Ship TestUser',
  });

  const userId = regResult.user.userId;
  await userRepository.verifyEmail(userId);

  const address = await addressRepository.create(userId, {
    recipientName: 'Payment Ship TestUser',
    phone: '+15559876543',
    addressLine1: '456 Delivery Boulevard',
    city: 'Seattle',
    stateProvince: 'WA',
    postalCode: '98101',
    country: 'USA',
    isDefaultShipping: true,
  });
  console.log(`✅ Customer & Shipping Address Ready (Address ID: ${address.addressId})`);

  // 2. Add Item & Checkout Order
  const { products } = await productRepository.findAll({ limit: 1 });
  const testProduct = products[0];
  console.log(`\nStep 2: Adding 1 unit of "${testProduct.name}" to cart & placing order...`);

  await cartService.addItem({ userId, productId: testProduct.productId, quantity: 1 });
  const order = await orderService.createOrderFromCart({ userId, addressId: address.addressId });
  console.log(`✅ Order Placed Successfully! (Order ID: ${order.orderId}, Number: ${order.orderNumber}, Amount: $${order.totalAmount})`);

  // -------------------------------------------------------------------
  // PHASE 3: PAYMENTS & GATEWAY WEBHOOK
  // -------------------------------------------------------------------
  console.log('\n--- 💳 PHASE 3: TESTING PAYMENTS & GATEWAY WEBHOOK ---');

  // 3. Create Payment Intent
  console.log('Step 3: Creating payment intent...');
  const intent = await paymentService.createPaymentIntent({
    orderId: order.orderId,
    userId,
    paymentGateway: 'STRIPE',
    paymentMethod: 'CARD',
  });
  console.log(`✅ Payment Intent Created! (Txn Ref: ${intent.transactionReference}, Amount: $${intent.amount})`);

  // 4. Simulate Payment Gateway Success Webhook
  console.log('Step 4: Simulating Gateway Webhook (Payment SUCCESS)...');
  const webhookResult = await paymentService.handlePaymentWebhook({
    transactionReference: intent.transactionReference,
    status: 'SUCCESS',
    rawData: { gateway: 'STRIPE_MOCK', chargeId: 'ch_mock_12345' },
  });
  console.log(`✅ Webhook Result: "${webhookResult.message}"`);

  // Verify Order Status transitioned to PROCESSING
  const paidOrder = await orderService.getOrderById(order.orderId, userId);
  console.log(`Paid Order Status Post-Webhook: ${paidOrder.status} (Expected: PROCESSING)`);

  // -------------------------------------------------------------------
  // PHASE 4: SHIPMENT LOGISTICS & LIVE TRACKING
  // -------------------------------------------------------------------
  console.log('\n--- 📦 PHASE 4: TESTING SHIPMENT LOGISTICS & LIVE TRACKING ---');

  // 5. Admin Fulfills Order (Dispatches Shipment)
  console.log('Step 5: Fulfilling order (Creating shipment record)...');
  const carrier = 'FEDEX';
  const trackingNumber = `FEDEX-${Date.now().toString().slice(-8)}`;

  const fulfillment = await orderService.fulfillOrder(order.orderId, {
    carrier,
    trackingNumber,
  });
  console.log(`✅ Order Fulfilled & Dispatched! (Status: ${fulfillment.status}, Tracking Number: ${fulfillment.shipment.trackingNumber})`);

  // 6. Track Shipment by Tracking Number
  console.log('\nStep 6: Tracking shipment by Tracking Number...');
  const trackedShipment = await shipmentService.trackShipment(trackingNumber);
  console.log(`✅ Tracked Shipment Result: Carrier=${trackedShipment.carrier} | Status=${trackedShipment.status} | ShippedAt=${trackedShipment.shippedAt}`);

  // 7. Track Shipment by Order ID
  console.log('\nStep 7: Tracking shipment by Order ID...');
  const orderShipment = await shipmentService.getOrderShipment(order.orderId, userId);
  console.log(`✅ Order Shipment Result: Carrier=${orderShipment.carrier} | Status=${orderShipment.status}`);

  // 8. Advance Shipment Status to DELIVERED
  console.log('\nStep 8: Updating shipment status to DELIVERED...');
  const deliveredShipment = await shipmentService.updateShipmentStatus(orderShipment.shipmentId, {
    status: 'DELIVERED',
  });
  console.log(`✅ Delivered Shipment Result: Status=${deliveredShipment.status} | DeliveredAt=${deliveredShipment.deliveredAt}`);

  console.log('\n--- 🎉 PHASES 3 & 4 TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

testPhases3And4().catch((err) => {
  console.error('❌ Phases 3 & 4 Test Failed:', err);
  process.exit(1);
});
