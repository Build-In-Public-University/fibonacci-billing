/**
 * Fibonacci Billing - Webhook Handler Example
 * 
 * This example demonstrates how to set up webhook handlers for both
 * Stripe and Paddle integrations in an Express.js application.
 */

import express from 'express';
import dotenv from 'dotenv';
import { 
  FibonacciStripeIntegration, 
  FibonacciPaddleIntegration 
} from '../src';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Initialize Stripe integration
const fibonacciStripe = new FibonacciStripeIntegration({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  billingOptions: {
    basePrice: 19.99,
    discountRate: 0.08,
    capTerm: true,
    maxTerm: 24
  }
});

// Initialize Paddle integration
const fibonacciPaddle = new FibonacciPaddleIntegration({
  apiKey: process.env.PADDLE_API_KEY || 'your_api_key',
  vendorId: process.env.PADDLE_VENDOR_ID || 'your_vendor_id',
  vendorAuthCode: process.env.PADDLE_AUTH_CODE || 'your_auth_code',
  isSandbox: process.env.PADDLE_SANDBOX === 'true',
  billingOptions: {
    basePrice: 19.99,
    discountRate: 0.08,
    capTerm: true,
    maxTerm: 24
  }
});

// Middleware for Stripe webhooks (needs raw body)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).send('Missing Stripe signature');
    }
    
    // Process the webhook
    const result = await fibonacciStripe.handleWebhook(req.body, signature);
    
    console.log(`[Stripe Webhook] Processed event: ${result.action}`);
    
    // Handle different event types
    switch (result.action) {
      case 'subscription_created':
        await handleSubscriptionCreated(result, 'stripe');
        break;
        
      case 'payment_succeeded':
        await handlePaymentSucceeded(result, 'stripe');
        break;
        
      case 'payment_failed':
        await handlePaymentFailed(result, 'stripe');
        break;
        
      case 'subscription_updated':
        await handleSubscriptionUpdated(result, 'stripe');
        break;
        
      case 'subscription_ended':
        await handleSubscriptionEnded(result, 'stripe');
        break;
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Middleware for Paddle webhooks (uses JSON body)
app.post('/webhooks/paddle', express.json(), async (req, res) => {
  try {
    // Process the webhook
    const result = await fibonacciPaddle.handleWebhook(req.body);
    
    console.log(`[Paddle Webhook] Processed event: ${result.action}`);
    
    // Handle different event types
    switch (result.action) {
      case 'subscription_created':
        await handleSubscriptionCreated(result, 'paddle');
        break;
        
      case 'payment_succeeded':
        await handlePaymentSucceeded(result, 'paddle');
        break;
        
      case 'payment_failed':
        await handlePaymentFailed(result, 'paddle');
        break;
        
      case 'subscription_updated':
        await handleSubscriptionUpdated(result, 'paddle');
        break;
        
      case 'subscription_ended':
        await handleSubscriptionEnded(result, 'paddle');
        break;
        
      case 'ignored':
        console.log(`[Paddle Webhook] Ignored event type: ${result.eventType}`);
        break;
        
      case 'error':
        console.error(`[Paddle Webhook] Error processing webhook: ${result.error}`);
        break;
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Common webhook event handlers
async function handleSubscriptionCreated(result: any, provider: 'stripe' | 'paddle') {
  console.log(`[${provider.toUpperCase()}] New subscription ${result.subscriptionId} created for customer ${result.customerId}`);
  
  // Here you would typically:
  // 1. Update your database with the new subscription
  // 2. Send a welcome email to the customer
  // 3. Provision access to your product/service
  
  console.log(`[${provider.toUpperCase()}] Subscription created successfully handled`);
}

async function handlePaymentSucceeded(result: any, provider: 'stripe' | 'paddle') {
  console.log(`[${provider.toUpperCase()}] Payment succeeded for subscription ${result.subscriptionId}`);
  
  if (result.currentCycle !== undefined) {
    console.log(`[${provider.toUpperCase()}] Current cycle: ${result.currentCycle}`);
    
    // Schedule the next payment reminder
    try {
      if (provider === 'stripe') {
        await fibonacciStripe.schedulePaymentReminder(result.subscriptionId);
      } else {
        // For Paddle, we would need the subscription object and next billing info
        // This is simplified for the example
        if (result.subscription) {
          const nextBilling = result.nextBilling || { cycle: result.currentCycle + 1 };
          await fibonacciPaddle.scheduleNextPaymentReminder(result.subscription, nextBilling);
        }
      }
      
      console.log(`[${provider.toUpperCase()}] Scheduled next payment reminder`);
    } catch (error) {
      console.error(`[${provider.toUpperCase()}] Error scheduling payment reminder:`, error);
    }
    
    // Update subscription to next term if needed
    try {
      if (provider === 'stripe') {
        await fibonacciStripe.updateSubscriptionToNextTerm(result.subscriptionId);
      } else if (provider === 'paddle' && result.subscriptionId) {
        await fibonacciPaddle.updateSubscriptionToNextTerm(result.subscriptionId, result.currentCycle);
      }
      
      console.log(`[${provider.toUpperCase()}] Updated subscription to next term`);
    } catch (error) {
      console.error(`[${provider.toUpperCase()}] Error updating subscription:`, error);
    }
  }
  
  // Here you would typically:
  // 1. Update your database with the payment information
  // 2. Send a receipt to the customer
  // 3. Update subscription status
  
  console.log(`[${provider.toUpperCase()}] Payment succeeded successfully handled`);
}

async function handlePaymentFailed(result: any, provider: 'stripe' | 'paddle') {
  console.log(`[${provider.toUpperCase()}] Payment failed for subscription ${result.subscriptionId}`);
  
  // Here you would typically:
  // 1. Update your database with the failed payment
  // 2. Send a payment retry notification to the customer
  // 3. Update subscription status
  
  console.log(`[${provider.toUpperCase()}] Payment failed successfully handled`);
}

async function handleSubscriptionUpdated(result: any, provider: 'stripe' | 'paddle') {
  console.log(`[${provider.toUpperCase()}] Subscription ${result.subscriptionId} updated`);
  
  // Here you would typically:
  // 1. Update your database with the new subscription details
  // 2. Send a confirmation email to the customer
  
  console.log(`[${provider.toUpperCase()}] Subscription updated successfully handled`);
}

async function handleSubscriptionEnded(result: any, provider: 'stripe' | 'paddle') {
  console.log(`[${provider.toUpperCase()}] Subscription ${result.subscriptionId} ended`);
  
  // Here you would typically:
  // 1. Update your database to mark the subscription as ended
  // 2. Send a win-back email to the customer
  // 3. Revoke access to your product/service
  
  console.log(`[${provider.toUpperCase()}] Subscription ended successfully handled`);
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to receive webhooks at:');
  console.log(`- Stripe: http://localhost:${PORT}/webhooks/stripe`);
  console.log(`- Paddle: http://localhost:${PORT}/webhooks/paddle`);
}); 