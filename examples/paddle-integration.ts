/**
 * Fibonacci Billing - Paddle Integration Example
 * 
 * This example demonstrates how to use the Fibonacci Billing
 * Paddle integration to create products, handle checkouts,
 * and process webhooks for a complete billing cycle management.
 */

import { FibonacciPaddleIntegration, FibonacciBilling } from '../src';
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a billing engine for calculations
const billingEngine = new FibonacciBilling({
  basePrice: 19.99,
  discountRate: 0.08,
  capTerm: true,
  maxTerm: 24
});

// Initialize Fibonacci Paddle integration
const fibonacciPaddle = new FibonacciPaddleIntegration({
  apiKey: process.env.PADDLE_API_KEY || 'your_api_key',
  vendorId: process.env.PADDLE_VENDOR_ID || 'your_vendor_id',
  vendorAuthCode: process.env.PADDLE_AUTH_CODE || 'your_auth_code',
  isSandbox: process.env.PADDLE_SANDBOX === 'true', // Use sandbox mode for testing
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
    const product = await fibonacciPaddle.createProduct({
      name: 'Premium Subscription',
      description: 'Access to premium features with Fibonacci billing',
      basePrice: 19.99
    });
    
    console.log('Created product:', product.id);
    console.log('Initial price:', product.initialPrice.id);
    
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Example: Generate a checkout URL for a product
async function generateCheckoutUrlExample(productId: string, priceId: string, customerId: string) {
  try {
    const checkoutUrl = await fibonacciPaddle.generateCheckoutUrl({
      productId,
      priceId,
      customerId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      webhookUrl: 'https://example.com/paddle-webhook'
    });
    
    console.log('Generated checkout URL:', checkoutUrl);
    
    return checkoutUrl;
  } catch (error) {
    console.error('Error generating checkout URL:', error);
    throw error;
  }
}

// Example: Schedule a payment reminder
async function scheduleNextPaymentReminderExample(subscription: any, nextBilling: any) {
  try {
    const reminder = await fibonacciPaddle.scheduleNextPaymentReminder(subscription, nextBilling);
    
    console.log('Scheduled payment reminder:');
    console.log('- Subscription ID:', reminder.subscription_id);
    console.log('- Reminder date:', reminder.reminder_date);
    console.log('- Next billing date:', reminder.next_billing_date);
    console.log('- Next cycle:', reminder.next_cycle);
    console.log('- Next term months:', reminder.next_term_months);
    console.log('- Next amount:', reminder.next_amount);
    
    return reminder;
  } catch (error) {
    console.error('Error scheduling payment reminder:', error);
    throw error;
  }
}

// Example: Update subscription to next Fibonacci term
async function updateSubscriptionToNextTermExample(subscriptionId: string, currentCycle: number) {
  try {
    const updatedSubscription = await fibonacciPaddle.updateSubscriptionToNextTerm(subscriptionId, currentCycle);
    
    console.log('Updated subscription to next term:');
    console.log('- Subscription ID:', updatedSubscription.id);
    console.log('- Metadata:', updatedSubscription.metadata);
    
    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Set up webhook endpoint with JSON body parsing for Paddle
app.post('/paddle-webhook', express.json(), async (req, res) => {
  try {
    // Process the webhook
    const result = await fibonacciPaddle.handleWebhook(req.body);
    
    console.log('Processed Paddle webhook event:', result.action);
    
    // Handle different event types
    switch (result.action) {
      case 'subscription_created':
        console.log(`New subscription ${result.subscriptionId} created for customer ${result.customerId}`);
        break;
        
      case 'payment_succeeded':
        console.log(`Payment succeeded for subscription ${result.subscriptionId}`);
        if (result.currentCycle !== undefined) {
          console.log(`Current cycle: ${result.currentCycle}`);
          
          // Calculate next billing cycle
          const nextCycle = result.currentCycle + 1;
          console.log(`Next cycle will be: ${nextCycle}`);
          
          // You could update the subscription to the next term here
          if (result.subscriptionId) {
            try {
              await updateSubscriptionToNextTermExample(result.subscriptionId, result.currentCycle);
            } catch (updateError) {
              console.error('Error updating subscription term:', updateError);
            }
          }
        }
        
        // You could send a thank you email to the customer here
        break;
        
      case 'payment_failed':
        console.log(`Payment failed for subscription ${result.subscriptionId}`);
        
        // You could send a payment retry email to the customer here
        break;
        
      case 'subscription_updated':
        console.log(`Subscription ${result.subscriptionId} updated`);
        break;
        
      case 'subscription_ended':
        console.log(`Subscription ${result.subscriptionId} ended`);
        
        // You could send a win-back email to the customer here
        break;
        
      case 'ignored':
        console.log(`Ignored event type: ${result.eventType}`);
        break;
        
      case 'error':
        console.error(`Error processing webhook: ${result.error}`);
        break;
    }
    
    res.status(200).json({success: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example function to run all examples in sequence
async function runExamples() {
  try {
    // Step 1: Create a product
    const product = await createProductExample();
    
    // Step 2: Generate a checkout URL
    console.log('In a real application, you would have a customer ID from Paddle');
    const mockCustomerId = 'customer_example123';
    
    const checkoutUrl = await generateCheckoutUrlExample(
      product.id, 
      product.initialPrice.id,
      mockCustomerId
    );
    
    console.log(`\nCheckout URL: ${checkoutUrl}`);
    console.log('Customer would complete checkout via this URL');
    
    // Step 3: After customer completes checkout, you'd receive a webhook
    console.log('\nAfter checkout completion, you would receive a webhook notification');
    console.log('The webhook would be processed by your /paddle-webhook endpoint');
    
    // Step 4: Mock a subscription object for demonstration
    const mockSubscription = {
      id: 'sub_example123',
      customerId: mockCustomerId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    // Step 5: Schedule next payment reminder
    // Calculate the next billing cycle using our billing engine
    const nextBilling = billingEngine.calculateNextBilling(1); // Next cycle
    await scheduleNextPaymentReminderExample(mockSubscription, nextBilling);
    
    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to receive Paddle webhook events at /paddle-webhook');
  
  // Uncomment to run the examples
  // runExamples();
}); 