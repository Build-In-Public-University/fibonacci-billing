/**
 * Fibonacci Billing - Stripe Integration Example
 * 
 * This example demonstrates how to use the Fibonacci Billing
 * Stripe integration to create products, subscriptions, and
 * handle webhooks for a complete billing cycle management.
 */

import { FibonacciStripeIntegration } from '../src';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Fibonacci Stripe integration
const fibonacciStripe = new FibonacciStripeIntegration({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  billingOptions: {
    basePrice: 19.99,        // $19.99 base price per month
    discountRate: 0.08,      // 8% discount per term
    capTerm: true,           // Cap the maximum term
    maxTerm: 24              // Maximum 24 month term
  }
});

// Create an Express server for handling webhooks
const app = express();

// Example: Create a new product
async function createProductExample() {
  try {
    const product = await fibonacciStripe.createProduct({
      name: 'Premium Subscription',
      description: 'Access to premium features with Fibonacci billing'
    });
    
    console.log('Created product:', product.id);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Example: Create a customer and subscription
async function createSubscriptionExample(customerId: string, productId: string, paymentMethodId?: string) {
  try {
    const subscription = await fibonacciStripe.createSubscription({
      customerId,
      productId,
      paymentMethodId
    });
    
    console.log('Created subscription:', subscription.id);
    console.log('Subscription status:', subscription.status);
    
    // Extract Fibonacci billing metadata
    const metadata = subscription.metadata || {};
    console.log('Fibonacci billing cycle:', metadata.fibonacciBillingCycle);
    console.log('Term length:', metadata.termMonths, 'months');
    console.log('Amount:', metadata.finalAmount);
    console.log('Effective monthly rate:', metadata.effectiveMonthlyRate);
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Example: Create a checkout session for a product
async function createCheckoutSessionExample(customerId: string, productId: string) {
  try {
    const checkoutSession = await fibonacciStripe.createCheckoutSession({
      customerId,
      productId,
      successUrl: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://example.com/cancel'
    });
    
    console.log('Created checkout session:', checkoutSession.id);
    console.log('Checkout URL:', checkoutSession.url);
    
    return checkoutSession;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Example: Schedule a payment reminder for a subscription
async function schedulePaymentReminderExample(subscriptionId: string) {
  try {
    const reminder = await fibonacciStripe.schedulePaymentReminder(subscriptionId);
    
    console.log('Scheduled payment reminder:');
    console.log('- Subscription ID:', reminder.subscriptionId);
    console.log('- Reminder date:', new Date(reminder.reminderDate).toLocaleDateString());
    console.log('- Next cycle:', reminder.nextCycle);
    console.log('- Next term months:', reminder.nextTermMonths);
    console.log('- Next amount:', reminder.nextAmount);
    
    return reminder;
  } catch (error) {
    console.error('Error scheduling payment reminder:', error);
    throw error;
  }
}

// Example: Update subscription to next Fibonacci term
async function updateSubscriptionToNextTermExample(subscriptionId: string) {
  try {
    const updatedSubscription = await fibonacciStripe.updateSubscriptionToNextTerm(subscriptionId);
    
    console.log('Updated subscription to next term:');
    console.log('- Subscription ID:', updatedSubscription.id);
    console.log('- New billing cycle:', updatedSubscription.metadata?.fibonacciBillingCycle);
    console.log('- New term months:', updatedSubscription.metadata?.termMonths);
    console.log('- New amount:', updatedSubscription.metadata?.finalAmount);
    
    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Set up webhook endpoint
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    // Process the webhook
    const result = await fibonacciStripe.handleWebhook(req.body, signature);
    
    console.log('Processed webhook event:', result.action);
    
    // Handle different event types
    switch (result.action) {
      case 'subscription_created':
        console.log(`New subscription ${result.subscriptionId} created for customer ${result.customerId}`);
        break;
        
      case 'payment_succeeded':
        console.log(`Payment succeeded for subscription ${result.subscriptionId}`);
        console.log(`Current cycle: ${result.currentCycle}`);
        
        // You could send a thank you email to the customer here
        break;
        
      case 'payment_failed':
        console.log(`Payment failed for subscription ${result.subscriptionId}`);
        
        // You could send a payment reminder email to the customer here
        break;
        
      case 'subscription_updated':
        console.log(`Subscription ${result.subscriptionId} updated`);
        break;
        
      case 'subscription_ended':
        console.log(`Subscription ${result.subscriptionId} ended`);
        
        // You could send a win-back email to the customer here
        break;
    }
    
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Example function to run all examples in sequence
async function runExamples() {
  try {
    // Step 1: Create a product
    const product = await createProductExample();
    
    // Step 2: Create a customer in Stripe (you would normally do this through Stripe's API)
    console.log('In a real application, you would create a customer in Stripe');
    const mockCustomerId = 'cus_example123';
    
    // Step 3: Create a checkout session for the customer
    const checkoutSession = await createCheckoutSessionExample(mockCustomerId, product.id);
    
    // Step 4: After customer completes checkout, create a subscription
    console.log('After customer completes checkout, you would create a subscription');
    
    // Step 5: On successful payment, schedule next payment reminder
    console.log('After successful payment, you would schedule the next payment reminder');
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to receive Stripe webhook events at /webhook');
  
  // Uncomment to run the examples
  // runExamples();
}); 