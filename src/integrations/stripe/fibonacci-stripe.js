/**
 * fibonacci-billing-stripe
 * Stripe integration for Fibonacci billing
 * 
 * @license MIT
 */

const FibonacciBilling = require('./fibonacci-billing');
const stripe = require('stripe');

class FibonacciStripeIntegration {
  /**
   * Creates a new Fibonacci billing Stripe integration
   * @param {Object} options - Configuration options
   * @param {string} options.stripeSecretKey - Stripe secret key
   * @param {Object} options.billingOptions - FibonacciBilling constructor options
   * @param {string} options.webhookSecret - Stripe webhook secret (for handling events)
   * @param {string} options.defaultCurrency - Default currency for charges (default: 'usd')
   */
  constructor(options = {}) {
    if (!options.stripeSecretKey) {
      throw new Error('Stripe secret key is required');
    }
    
    this.stripeClient = stripe(options.stripeSecretKey);
    this.webhookSecret = options.webhookSecret || null;
    this.currency = options.defaultCurrency || 'usd';
    this.billingEngine = new FibonacciBilling(options.billingOptions || {});
  }

  /**
   * Create a product in Stripe for Fibonacci billing
   * @param {Object} productDetails - Product details
   * @returns {Promise<Object>} - Stripe product object
   */
  async createProduct(productDetails) {
    if (!productDetails.name) {
      throw new Error('Product name is required');
    }

    return await this.stripeClient.products.create({
      name: productDetails.name,
      description: productDetails.description || 'Fibonacci billing product',
      metadata: {
        ...productDetails.metadata,
        billing_type: 'fibonacci'
      }
    });
  }

  /**
   * Calculate the next Fibonacci billing cycle for a customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} - Billing calculation and Stripe price object
   */
  async calculateNextBillingCycle(customerId) {
    // Fetch customer's subscription history from Stripe
    const subscriptions = await this.stripeClient.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100
    });

    // Count completed billing cycles for this customer
    const completedCycles = subscriptions.data.filter(sub => 
      sub.metadata && sub.metadata.fibonacci_cycle && 
      (sub.status === 'canceled' || sub.status === 'completed')
    ).length;

    // Calculate next billing details
    const nextBilling = this.billingEngine.calculateNextBilling(completedCycles);
    
    return nextBilling;
  }

  /**
   * Create a price for the next billing cycle
   * @param {string} productId - Stripe product ID
   * @param {Object} billingDetails - Billing calculation from calculateNextBillingCycle
   * @returns {Promise<Object>} - Stripe price object
   */
  async createPrice(productId, billingDetails) {
    return await this.stripeClient.prices.create({
      product: productId,
      unit_amount: Math.round(billingDetails.finalAmount * 100), // Convert to cents
      currency: this.currency,
      recurring: null, // Not a recurring price, as each cycle is different
      metadata: {
        fibonacci_cycle: billingDetails.cycle,
        term_months: billingDetails.termMonths,
        base_amount: billingDetails.baseAmount,
        discount_percentage: billingDetails.discount,
        effective_monthly_rate: billingDetails.effectiveMonthlyRate
      }
    });
  }

  /**
   * Create a subscription for a customer using Fibonacci billing
   * @param {Object} options - Subscription options
   * @param {string} options.customerId - Stripe customer ID
   * @param {string} options.productId - Stripe product ID
   * @param {string} options.paymentMethodId - Payment method ID to use
   * @param {Object} options.metadata - Additional metadata for the subscription
   * @returns {Promise<Object>} - Stripe subscription object
   */
  async createSubscription(options) {
    if (!options.customerId || !options.productId) {
      throw new Error('Customer ID and Product ID are required');
    }

    // Calculate the next billing cycle
    const nextBilling = await this.calculateNextBillingCycle(options.customerId);
    
    // Create a price for this cycle
    const price = await this.createPrice(options.productId, nextBilling);
    
    // Calculate expiration date (now + term months)
    const now = new Date();
    const expiresAt = new Date(
      now.getFullYear(),
      now.getMonth() + nextBilling.termMonths,
      now.getDate()
    );
    
    // Create the subscription with an end date
    const subscription = await this.stripeClient.subscriptions.create({
      customer: options.customerId,
      items: [{ price: price.id }],
      metadata: {
        ...options.metadata,
        fibonacci_cycle: nextBilling.cycle,
        term_months: nextBilling.termMonths,
        expires_at: expiresAt.toISOString(),
        billing_type: 'fibonacci'
      },
      default_payment_method: options.paymentMethodId,
      collection_method: 'charge_automatically',
      cancel_at: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp
    });
    
    return {
      subscription,
      billingDetails: nextBilling
    };
  }

  /**
   * Handle Stripe webhook events for Fibonacci billing
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {Object} - Processed event and actions
   */
  async handleWebhook(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret is required to process webhooks');
    }
    
    let event;
    
    try {
      event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
    
    // Handle subscription-related events
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      
      // Only process Fibonacci billing subscriptions
      if (subscription.metadata && subscription.metadata.billing_type === 'fibonacci') {
        // Customer's subscription has ended, can trigger renewal process here
        return {
          event,
          action: 'subscription_ended',
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          cycle: parseInt(subscription.metadata.fibonacci_cycle || '0')
        };
      }
    }
    
    // Handle other events as needed
    return { event, action: 'no_action' };
  }

  /**
   * Generate checkout session for Fibonacci billing
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Stripe checkout session
   */
  async createCheckoutSession(options) {
    if (!options.customerId || !options.productId || !options.successUrl || !options.cancelUrl) {
      throw new Error('Missing required checkout options');
    }
    
    // Calculate the next billing cycle
    const nextBilling = await this.calculateNextBillingCycle(options.customerId);
    
    // Create a price for this cycle
    const price = await this.createPrice(options.productId, nextBilling);
    
    // Create checkout session
    const session = await this.stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer: options.customerId,
      metadata: {
        fibonacci_cycle: nextBilling.cycle,
        term_months: nextBilling.termMonths,
        billing_type: 'fibonacci',
        product_id: options.productId
      }
    });
    
    return {
      session,
      billingDetails: nextBilling
    };
  }

  /**
   * Get a customer's billing history with Fibonacci cycles
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} - Customer's billing history
   */
  async getCustomerBillingHistory(customerId) {
    // Fetch charges for this customer
    const charges = await this.stripeClient.charges.list({
      customer: customerId,
      limit: 100
    });
    
    // Fetch subscriptions for this customer
    const subscriptions = await this.stripeClient.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100
    });
    
    // Filter for Fibonacci billing subscriptions
    const fibonacciSubscriptions = subscriptions.data.filter(
      sub => sub.metadata && sub.metadata.billing_type === 'fibonacci'
    );
    
    // Sort by cycle number
    fibonacciSubscriptions.sort((a, b) => {
      const cycleA = parseInt(a.metadata.fibonacci_cycle || '0');
      const cycleB = parseInt(b.metadata.fibonacci_cycle || '0');
      return cycleA - cycleB;
    });
    
    // Format the billing history
    const billingHistory = fibonacciSubscriptions.map(sub => {
      const cycle = parseInt(sub.metadata.fibonacci_cycle || '0');
      const termMonths = parseInt(sub.metadata.term_months || '0');
      
      // Find associated charge
      const relatedCharge = charges.data.find(charge => 
        charge.invoice === sub.latest_invoice
      );
      
      return {
        cycle,
        termMonths,
        startDate: new Date(sub.created * 1000).toISOString(),
        endDate: sub.metadata.expires_at,
        amount: relatedCharge ? relatedCharge.amount / 100 : null,
        status: sub.status,
        subscriptionId: sub.id
      };
    });
    
    // Calculate the next billing details
    const completedCycles = fibonacciSubscriptions.length;
    const nextBilling = this.billingEngine.calculateNextBilling(completedCycles);
    
    return {
      customer: customerId,
      billingHistory,
      completedCycles,
      nextBilling
    };
  }
}

module.exports = FibonacciStripeIntegration;