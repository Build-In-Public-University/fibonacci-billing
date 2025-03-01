/**
 * fibonacci-billing-paddle
 * Paddle integration for Fibonacci billing
 * 
 * @license MIT
 */

const FibonacciBilling = require('./fibonacci-billing');
const axios = require('axios');
const crypto = require('crypto');

class FibonacciPaddleIntegration {
  /**
   * Creates a new Fibonacci billing Paddle integration
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - Paddle API key
   * @param {string} options.vendorId - Paddle vendor ID
   * @param {string} options.vendorAuthCode - Paddle vendor auth code
   * @param {boolean} options.isSandbox - Whether to use Paddle sandbox
   * @param {Object} options.billingOptions - FibonacciBilling constructor options
   */
  constructor(options = {}) {
    if (!options.apiKey || !options.vendorId || !options.vendorAuthCode) {
      throw new Error('Paddle credentials are required');
    }
    
    this.apiKey = options.apiKey;
    this.vendorId = options.vendorId;
    this.vendorAuthCode = options.vendorAuthCode;
    this.isSandbox = options.isSandbox || false;
    this.billingEngine = new FibonacciBilling(options.billingOptions || {});
    
    // Paddle API base URL
    this.apiUrl = this.isSandbox 
      ? 'https://sandbox-vendors.paddle.com/api/2.0'
      : 'https://vendors.paddle.com/api/2.0';
  }

  /**
   * Create a product in Paddle for Fibonacci billing
   * @param {Object} productDetails - Product details
   * @returns {Promise<Object>} - Created product
   */
  async createProduct(productDetails) {
    if (!productDetails.name || !productDetails.basePrice) {
      throw new Error('Product name and base price are required');
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/product/create`, {
        vendor_id: this.vendorId,
        vendor_auth_code: this.vendorAuthCode,
        name: productDetails.name,
        description: productDetails.description || 'Fibonacci billing product',
        base_price: productDetails.basePrice,
        sale_price: productDetails.basePrice, // Initial price
        images: productDetails.images || [],
        recurring: false, // We'll handle recurring manually
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error.message);
      }
      
      return response.data.response;
    } catch (error) {
      throw new Error(`Failed to create Paddle product: ${error.message}`);
    }
  }

  /**
   * Make a request to Paddle API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - API response
   */
  async paddleApiRequest(endpoint, data) {
    try {
      const response = await axios.post(`${this.apiUrl}/${endpoint}`, {
        vendor_id: this.vendorId,
        vendor_auth_code: this.vendorAuthCode,
        ...data
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data.response;
    } catch (error) {
      throw new Error(`Paddle API error (${endpoint}): ${error.message}`);
    }
  }

  /**
   * Verify Paddle webhook signature
   * @param {Object} data - Webhook data
   * @param {string} signature - Webhook signature
   * @returns {boolean} - Whether the signature is valid
   */
  verifyWebhookSignature(data, signature) {
    // Create a sorted array of key/value pairs
    const pairs = Object.keys(data)
      .filter(key => key !== 'p_signature')
      .sort()
      .map(key => `${key}:${data[key]}`);
    
    // Concatenate the pairs
    const serialized = pairs.join('\n');
    
    // Verify the signature using PHP-style serialization that Paddle expects
    const hash = crypto
      .createHash('sha1')
      .update(serialized)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Calculate the next Fibonacci billing cycle for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} - Billing calculation
   */
  async calculateNextBillingCycle(customerId) {
    try {
      // Fetch customer's subscription history from Paddle
      const subscriptionHistory = await this.paddleApiRequest('subscription/users', {
        customer_id: customerId
      });
      
      // Filter for Fibonacci billing subscriptions and count completed cycles
      const completedCycles = subscriptionHistory
        .filter(sub => 
          sub.custom_data && 
          sub.custom_data.billing_type === 'fibonacci' &&
          (sub.state === 'deleted' || sub.state === 'past_due')
        ).length;
      
      // Calculate next billing details
      const nextBilling = this.billingEngine.calculateNextBilling(completedCycles);
      
      return nextBilling;
    } catch (error) {
      throw new Error(`Failed to calculate next billing cycle: ${error.message}`);
    }
  }

  /**
   * Generate a checkout URL for Fibonacci billing
   * @param {Object} options - Checkout options
   * @param {string} options.productId - Paddle product ID
   * @param {string} options.customerId - Customer ID
   * @param {string} options.customerEmail - Customer email
   * @param {string} options.successUrl - Success URL
   * @param {string} options.cancelUrl - Cancel URL
   * @returns {Promise<Object>} - Checkout URL and billing details
   */
  async generateCheckoutUrl(options) {
    if (!options.productId || !options.customerId || !options.customerEmail) {
      throw new Error('Product ID, customer ID, and email are required');
    }
    
    try {
      // Calculate the next billing cycle
      const nextBilling = await this.calculateNextBillingCycle(options.customerId);
      
      // Create a one-time price for this billing cycle
      const price = nextBilling.finalAmount.toFixed(2);
      
      // Set custom data for tracking Fibonacci billing
      const passthrough = JSON.stringify({
        customer_id: options.customerId,
        fibonacci_cycle: nextBilling.cycle,
        term_months: nextBilling.termMonths,
        billing_type: 'fibonacci',
        base_amount: nextBilling.baseAmount,
        discount_percentage: nextBilling.discount
      });
      
      // Generate checkout URL
      const checkoutData = await this.paddleApiRequest('product/generate_pay_link', {
        product_id: options.productId,
        customer_email: options.customerEmail,
        customer_country: options.customerCountry,
        customer_postcode: options.customerPostcode,
        title: `Subscription - ${nextBilling.termMonths} months`,
        custom_message: `This purchase covers a ${nextBilling.termMonths}-month subscription period with a ${nextBilling.discount}% loyalty discount.`,
        prices: [`USD:${price}`],
        recurring_prices: {}, // Not using Paddle's recurring
        return_url: options.successUrl,
        cancel_url: options.cancelUrl,
        passthrough,
        webhook_url: options.webhookUrl
      });
      
      return {
        checkoutUrl: checkoutData.url,
        billingDetails: nextBilling
      };
    } catch (error) {
      throw new Error(`Failed to generate checkout URL: ${error.message}`);
    }
  }

  /**
   * Process a successful payment from Paddle webhook
   * @param {Object} webhookData - Webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async processSuccessfulPayment(webhookData) {
    try {
      // Parse passthrough data
      const passthrough = JSON.parse(webhookData.passthrough);
      
      // Only process Fibonacci billing payments
      if (passthrough.billing_type !== 'fibonacci') {
        return { action: 'ignored', reason: 'Not a Fibonacci billing payment' };
      }
      
      const customerId = passthrough.customer_id;
      const cycle = passthrough.fibonacci_cycle;
      const termMonths = passthrough.term_months;
      
      // Calculate expiration date (now + term months)
      const now = new Date();
      const expiresAt = new Date(
        now.getFullYear(),
        now.getMonth() + termMonths,
        now.getDate()
      );
      
      // Store subscription info in your database
      // This is just a placeholder - implement your own storage logic
      const subscriptionData = {
        order_id: webhookData.order_id,
        customer_id: customerId,
        fibonacci_cycle: cycle,
        term_months: termMonths,
        amount: webhookData.amount,
        currency: webhookData.currency,
        payment_date: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active'
      };
      
      console.log('Processed successful payment:', subscriptionData);
      
      // Calculate next billing cycle for future reference
      const nextBilling = this.billingEngine.calculateNextBilling(cycle);
      
      return {
        action: 'processed',
        subscription: subscriptionData,
        nextBilling
      };
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Schedule the next payment reminder
   * @param {Object} subscription - Current subscription data
   * @param {Object} nextBilling - Next billing details
   * @returns {Promise<Object>} - Scheduled reminder details
   */
  async scheduleNextPaymentReminder(subscription, nextBilling) {
    try {
      // Calculate reminder date (7 days before expiration)
      const expiresAt = new Date(subscription.expires_at);
      const reminderDate = new Date(expiresAt);
      reminderDate.setDate(reminderDate.getDate() - 7);
      
      // Store the reminder in your database
      // This is just a placeholder - implement your own storage logic
      const reminderData = {
        customer_id: subscription.customer_id,
        current_cycle: subscription.fibonacci_cycle,
        next_cycle: nextBilling.cycle,
        next_term_months: nextBilling.termMonths,
        next_amount: nextBilling.finalAmount,
        reminder_date: reminderDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'scheduled'
      };
      
      console.log('Scheduled next payment reminder:', reminderData);
      
      return {
        scheduled: true,
        reminder: reminderData
      };
    } catch (error) {
      throw new Error(`Failed to schedule reminder: ${error.message}`);
    }
  }

  /**
   * Get a customer's billing history
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} - Customer's billing history
   */
  async getCustomerBillingHistory(customerId) {
    try {
      // In a real implementation, you would query your database for this customer's
      // subscription history - this is just a placeholder
      
      // Simulate subscription history (in a real app, this would come from your database)
      const billingHistory = [
        {
          cycle: 1,
          termMonths: 1,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 19.99,
          status: 'completed'
        },
        {
          cycle: 2,
          termMonths: 2,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 36.78,
          status: 'active'
        }
      ];
      
      // Calculate the next billing details
      const completedCycles = billingHistory.length;
      const nextBilling = this.billingEngine.calculateNextBilling(completedCycles);
      
      return {
        customer: customerId,
        billingHistory,
        completedCycles,
        nextBilling
      };
    } catch (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }
  }

  /**
   * Handle Paddle webhook
   * @param {Object} webhookData - Webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleWebhook(webhookData) {
    // Verify webhook authenticity
    if (!this.verifyWebhookSignature(webhookData, webhookData.p_signature)) {
      throw new Error('Invalid webhook signature');
    }
    
    // Process different webhook alerts
    switch (webhookData.alert_name) {
      case 'payment_succeeded':
        return await this.processSuccessfulPayment(webhookData);
        
      case 'subscription_cancelled':
        // Handle cancellation if needed
        return { action: 'cancelled', order_id: webhookData.order_id };
        
      case 'subscription_payment_failed':
        // Handle payment failure
        return { action: 'payment_failed', order_id: webhookData.order_id };
        
      default:
        return { action: 'ignored', alert: webhookData.alert_name };
    }
  }
}

module.exports = FibonacciPaddleIntegration;