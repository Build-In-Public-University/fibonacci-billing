# Fibonacci Billing

A flexible TypeScript/Node.js package that implements Fibonacci sequence-based subscription billing with payment provider integrations.

## What is Fibonacci Billing?

Unlike traditional subscription models that offer only monthly or annual renewal options, Fibonacci Billing uses the Fibonacci sequence to create progressively longer billing terms:

1 month → 2 months → 3 months → 5 months → 8 months → 13 months → ...

This approach provides several benefits:
- Rewards customer loyalty with increasing discounts
- Reduces churn by extending commitment periods
- Improves cash flow by collecting payments further in advance
- Creates a unique, memorable billing experience

## Installation

```bash
npm install fibonacci-billing
```

## Core Billing Engine

The core billing engine calculates Fibonacci terms, discounts, and pricing:

```typescript
import { FibonacciBilling } from 'fibonacci-billing';

// Create a new billing plan
const billing = new FibonacciBilling({
  basePrice: 20, // $20 per month base price
  discountRate: 0.05, // 5% discount per term length
});

// Calculate next billing for a new customer (cycle 0)
const nextBilling = billing.calculateNextBilling(0);
console.log(`Next billing: ${nextBilling.termMonths} months for $${nextBilling.finalAmount}`);

// Generate a billing schedule for 5 cycles
const schedule = billing.generateBillingSchedule(5);
console.log(schedule);
```

## Payment Integrations

### Stripe Integration

The package includes a Stripe integration for handling Fibonacci billing with Stripe's payment infrastructure:

```typescript
import { FibonacciStripeIntegration } from 'fibonacci-billing';

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

// Create a product
const product = await fibonacciStripe.createProduct({
  name: 'Premium Subscription',
  description: 'Access to premium features with Fibonacci billing'
});

// Create a subscription for a customer
const subscription = await fibonacciStripe.createSubscription({
  customerId: 'cus_123456',
  productId: 'prod_123456',
  paymentMethodId: 'pm_123456'
});

// Generate a checkout session
const checkout = await fibonacciStripe.createCheckoutSession({
  customerId: 'cus_123456',
  productId: 'prod_123456',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel'
});

// Handle Stripe webhooks
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await fibonacciStripe.handleWebhook(req.body, signature);
  
  if (result.action === 'subscription_ended') {
    // Handle subscription ending
    console.log(`Subscription ${result.subscriptionId} ended for customer ${result.customerId}`);
  }
  
  res.json({received: true});
});
```

### Paddle Integration

The package also includes a Paddle integration for handling Fibonacci billing with Paddle's payment infrastructure:

```typescript
import { FibonacciPaddleIntegration } from 'fibonacci-billing';

// Initialize with your Paddle credentials
const fibonacciPaddle = new FibonacciPaddleIntegration({
  apiKey: 'your_api_key',
  vendorId: 'your_vendor_id',
  vendorAuthCode: 'your_auth_code',
  isSandbox: true, // Set to false for production
  billingOptions: {
    basePrice: 19.99,
    discountRate: 0.08,
    capTerm: true,
    maxTerm: 24
  }
});

// Create a product
const product = await fibonacciPaddle.createProduct({
  name: 'Premium Subscription',
  description: 'Access to premium features with Fibonacci billing',
  basePrice: 19.99
});

// Generate a checkout URL
const checkoutUrl = await fibonacciPaddle.generateCheckoutUrl({
  productId: 'product_id',
  customerId: 'customer_id',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
  webhookUrl: 'https://example.com/paddle-webhook'
});

// Handle Paddle webhooks
app.post('/paddle-webhook', express.json(), async (req, res) => {
  try {
    const result = await fibonacciPaddle.handleWebhook(req.body);
    
    if (result.action === 'processed') {
      // Handle successful payment
      console.log(`Payment processed for customer ${result.subscription.customer_id}`);
      
      // Schedule next payment reminder
      await fibonacciPaddle.scheduleNextPaymentReminder(
        result.subscription, 
        result.nextBilling
      );
    }
    
    res.json({success: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({error: error.message});
  }
});
```

## Webhooks and Lifecycle Management

Both Stripe and Paddle integrations include webhook handlers for managing the subscription lifecycle:

1. **Subscription Creation**: Process new subscriptions and initialize customer billing history
2. **Payment Confirmation**: Handle successful payments and update billing records
3. **Subscription Ending**: Send renewal notifications before the current term ends
4. **Payment Failures**: Handle failed payments and send appropriate notifications

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| basePrice | number | 10 | Base price per month |
| discountRate | number | 0.05 | Discount rate applied per term (0-1) |
| capTerm | boolean | false | Whether to cap the maximum term length |
| maxTerm | number | 0 | Maximum term length in months if capped |

## Core Methods

### getNextTerm(currentCycle)
Returns the next billing term length in months.

### calculateNextBilling(currentCycle)
Calculates detailed billing information for the next cycle.

### generateBillingSchedule(cycles)
Generates a billing schedule for multiple future cycles.

### getBillingSummary(cycles)
Provides a summary of total costs and savings over specified cycles.

## Visualization Components

The package includes React components for visualizing the Fibonacci billing model:

```tsx
import { FibonacciBillingVisualizer } from 'fibonacci-billing';

// Then in your React component:
return (
  <div>
    <h1>Fibonacci Billing Calculator</h1>
    <FibonacciBillingVisualizer 
      basePrice={19.99} 
      discountRate={0.08} 
      cycles={8} 
    />
  </div>
);
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions for all components and methods.

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.