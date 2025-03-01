/**
 * Webhook handler for Fibonacci Billing subscription events
 * This runs as a separate process to manage subscription lifecycle
 */
const express = require('express');
const FibonacciStripeIntegration = require('./fibonacci-stripe-integration');
const nodemailer = require('nodemailer');

// Initialize Express app
const app = express();
app.use(express.raw({type: 'application/json'}));

// Configure email transporter (replace with your SMTP settings)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Initialize Fibonacci Stripe integration
const fibonacciStripe = new FibonacciStripeIntegration({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  billingOptions: {
    basePrice: 19.99,
    discountRate: 0.08,
    capTerm: true,
    maxTerm: 24
  }
});

/**
 * Send email notification for subscription events
 */
async function sendNotificationEmail(customer, emailType, billingDetails) {
  const emailTemplates = {
    subscription_created: {
      subject: 'Your subscription has been activated',
      body: `
        <h2>Welcome to Our Service!</h2>
        <p>Your subscription has been successfully activated.</p>
        <p>Current billing cycle: ${billingDetails.cycle}</p>
        <p>Billing period: ${billingDetails.termMonths} months</p>
        <p>Amount charged: $${billingDetails.finalAmount}</p>
        <p>Thank you for your business!</p>
      `
    },
    subscription_ended: {
      subject: 'Your subscription period is ending soon',
      body: `
        <h2>Your Current Subscription Period is Ending</h2>
        <p>Your current subscription period is coming to an end.</p>
        <p>Current billing cycle: ${billingDetails.cycle}</p>
        <p>Your next billing cycle will be for ${billingDetails.termMonths} months.</p>
        <p>With a ${billingDetails.discount}% discount, you'll pay $${billingDetails.finalAmount}.</p>
        <p>That's just $${billingDetails.effectiveMonthlyRate} per month - a great saving!</p>
        <p>Your card will be automatically charged on the renewal date.</p>
      `
    },
    payment_failed: {
      subject: 'Payment failed for your subscription',
      body: `
        <h2>We couldn't process your payment</h2>
        <p>We attempted to charge your card for your next subscription period but the payment failed.</p>
        <p>Please update your payment method to ensure continuous service.</p>
        <p>Next billing amount: $${billingDetails.finalAmount} for ${billingDetails.termMonths} months</p>
      `
    },
    renewal_reminder: {
      subject: 'Your subscription will renew soon',
      body: `
        <h2>Your Subscription Will Renew Soon</h2>
        <p>This is a friendly reminder that your subscription will renew in 7 days.</p>
        <p>Next billing cycle: ${billingDetails.cycle}</p>
        <p>Next billing period: ${billingDetails.termMonths} months</p>
        <p>Amount to be charged: $${billingDetails.finalAmount}</p>
        <p>Your effective monthly rate will be $${billingDetails.effectiveMonthlyRate} - a ${billingDetails.discount}% discount!</p>
      `
    }
  };
  
  const template = emailTemplates[emailType];
  
  if (!template) {
    console.error(`Email template "${emailType}" not found`);
    return;
  }
  
  try {
    await emailTransporter.sendMail({
      from: '"Your Service" <support@yourservice.com>',
      to: customer.email,
      subject: template.subject,
      html: template.body,
    });
    
    console.log(`Email sent to ${customer.email}: ${template.subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * Process a subscription ending and set up renewal
 */
async function processSubscriptionEnding(subscriptionId, customerId) {
  try {
    // Get customer details
    const customer = await fibonacciStripe.stripeClient.customers.retrieve(customerId);
    
    // Get customer's billing history
    const history = await fibonacciStripe.getCustomerBillingHistory(customerId);
    
    // Send notification email
    await sendNotificationEmail(customer, 'subscription_ended', history.nextBilling);
    
    console.log(`Processed ending subscription ${subscriptionId} for customer ${customerId}`);
    console.log(`Next billing cycle: ${history.nextBilling.cycle} (${history.nextBilling.termMonths} months)`);
  } catch (error) {
    console.error('Error processing subscription ending:', error);
  }
}

/**
 * Process a new subscription
 */
async function processNewSubscription(subscriptionId, customerId) {
  try {
    // Get customer details
    const customer = await fibonacciStripe.stripeClient.customers.retrieve(customerId);
    
    // Get the subscription
    const subscription = await fibonacciStripe.stripeClient.subscriptions.retrieve(subscriptionId);
    
    // Get customer's billing details
    const cycle = parseInt(subscription.metadata.fibonacci_cycle || '1');
    const termMonths = parseInt(subscription.metadata.term_months || '1');
    
    // Calculate the amount from the subscription
    const billingDetails = {
      cycle,
      termMonths,
      finalAmount: subscription.items.data[0].price.unit_amount / 100,
      discount: subscription.metadata.discount_percentage || '0',
      effectiveMonthlyRate: (subscription.items.data[0].price.unit_amount / 100 / termMonths).toFixed(2)
    };
    
    // Send welcome email
    await sendNotificationEmail(customer, 'subscription_created', billingDetails);
    
    console.log(`Processed new subscription ${subscriptionId} for customer ${customerId}`);
  } catch (error) {
    console.error('Error processing new subscription:', error);
  }
}

/**
 * Schedule renewal reminder for a subscription
 */
async function scheduleRenewalReminder(subscriptionId, customerId) {
  try {
    // Get the subscription
    const subscription = await fibonacciStripe.stripeClient.subscriptions.retrieve(subscriptionId);
    
    // Only proceed if it's a Fibonacci billing subscription
    if (!subscription.metadata || subscription.metadata.billing_type !== 'fibonacci') {
      return;
    }
    
    // Calculate reminder date (7 days before expiration)
    const cancelAtTimestamp = subscription.cancel_at;
    if (!cancelAtTimestamp) return;
    
    const cancelAtDate = new Date(cancelAtTimestamp * 1000);
    const reminderDate = new Date(cancelAtDate);
    reminderDate.setDate(reminderDate.getDate() - 7);
    
    // Store reminder in database (simplified here)
    console.log(`Scheduled reminder for ${customerId} on ${reminderDate.toISOString()}`);
    
    // In a real implementation, you'd store this in a database and have a separate process
    // that checks for reminders to send daily
  } catch (error) {
    console.error('Error scheduling renewal reminder:', error);
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailure(invoiceId, customerId) {
  try {
    // Get customer details
    const customer = await fibonacciStripe.stripeClient.customers.retrieve(customerId);
    
    // Get customer's billing history 
    const history = await fibonacciStripe.getCustomerBillingHistory(customerId);
    
    // Send payment failed email
    await sendNotificationEmail(customer, 'payment_failed', history.nextBilling);
    
    console.log(`Processed payment failure for customer ${customerId}, invoice ${invoiceId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle Stripe webhooks
app.post('/stripe-webhooks', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    const result = await fibonacciStripe.handleWebhook(req.body, signature);
    
    // Process different webhook events
    switch (result.event.type) {
      case 'customer.subscription.created':
        const newSubscription = result.event.data.object;
        await processNewSubscription(newSubscription.id, newSubscription.customer);
        await scheduleRenewalReminder(newSubscription.id, newSubscription.customer);
        break;
        
      case 'customer.subscription.deleted':
        if (result.action === 'subscription_ended') {
          await processSubscriptionEnding(result.subscriptionId, result.customerId);
        }
        break;
        
      case 'invoice.payment_failed':
        const invoice = result.event.data.object;
        await handlePaymentFailure(invoice.id, invoice.customer);
        break;
    }
    
    res.json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Daily job to check for upcoming renewals (simplified)
async function checkForRenewalReminders() {
  // In a real implementation, you would query your database for reminders to send
  // This is a simplified example
  console.log('Checking for renewal reminders to send...');
  
  // Example of sending reminder for a specific customer (in real implementation, would come from database)
  const customerId = 'cus_example123';
  const history = await fibonacciStripe.getCustomerBillingHistory(customerId);
  
  if (history && history.nextBilling) {
    const customer = await fibonacciStripe.stripeClient.customers.retrieve(customerId);
    await sendNotificationEmail(customer, 'renewal_reminder', history.nextBilling);
  }
}

// In a real implementation, you would use a proper scheduler like node-cron
// This is just for illustration
setInterval(checkForRenewalReminders, 24 * 60 * 60 * 1000); // Check once per day

// Start server
const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});