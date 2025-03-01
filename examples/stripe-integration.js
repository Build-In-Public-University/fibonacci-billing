/**
 * Stripe integration example for Fibonacci Billing
 */

const { FibonacciStripeIntegration } = require('../dist');

// Initialize with your Stripe credentials
const fibonacciStripe = new FibonacciStripeIntegration({
  stripeSecretKey: 'sk_test_your_key',
  webhookSecret: 'whsec_your_webhook_secret',
  billingOptions: {
    basePrice: 19.99,
    discountRate: 0.08,
    capTerm: true,
    maxTerm: 24
  }
});

// Example: Create a product
async function createProduct() {
  try {
    const product = await fibonacciStripe.createProduct({
      name: 'Premium Subscription',
      description: 'Access to premium features with Fibonacci billing'
    });
    
    console.log('Product created:', product);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
  }
}

// Example: Create a subscription for a customer
async function createSubscription(customerId, productId) {
  try {
    const subscription = await fibonacciStripe.createSubscription({
      customerId: customerId,
      productId: productId,
      paymentMethodId: 'pm_example_payment_method'
    });
    
    console.log('Subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

// Example: Generate a checkout session
async function createCheckoutSession(customerId, productId) {
  try {
    const checkout = await fibonacciStripe.createCheckoutSession({
      customerId: customerId,
      productId: productId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    });
    
    console.log('Checkout session created:', checkout);
    console.log('Checkout URL:', checkout.url);
    return checkout;
  } catch (error) {
    console.error('Error creating checkout session:', error);
  }
}

// Example: Process a webhook
async function processWebhook(payload, signature) {
  try {
    const result = await fibonacciStripe.handleWebhook(payload, signature);
    
    console.log('Webhook processed:', result);
    
    if (result.action === 'subscription_ended') {
      console.log(`Subscription ${result.subscriptionId} ended for customer ${result.customerId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
}

// Run the examples
async function runExamples() {
  // In a real application, these would come from your database or Stripe
  const customerId = 'cus_example';
  const product = await createProduct();
  
  if (product) {
    await createSubscription(customerId, product.id);
    await createCheckoutSession(customerId, product.id);
    
    // Example webhook payload
    const webhookPayload = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_example',
          customer: customerId
        }
      }
    };
    
    await processWebhook(webhookPayload, 'example_signature');
  }
}

runExamples().catch(console.error); 