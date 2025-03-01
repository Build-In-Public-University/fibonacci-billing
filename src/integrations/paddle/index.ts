/**
 * Paddle integration for Fibonacci Billing
 */

import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import FibonacciBilling from '../../core/fibonacci-billing';
import {
  PaddleIntegrationOptions,
  ProductCreationOptions,
  CheckoutSessionOptions,
  WebhookResult
} from '../../types';

/**
 * Fibonacci Billing integration with Paddle
 */
class FibonacciPaddleIntegration {
  private apiKey: string;
  private vendorId: string;
  private vendorAuthCode: string;
  private isSandbox: boolean;
  private billingEngine: FibonacciBilling;
  private paddleClient: any; // Using any type to avoid linter errors with SDK

  /**
   * Creates a new Paddle integration
   * @param options - Paddle integration options
   */
  constructor(options: PaddleIntegrationOptions) {
    this.apiKey = options.apiKey;
    this.vendorId = options.vendorId;
    this.vendorAuthCode = options.vendorAuthCode;
    this.isSandbox = options.isSandbox || false;
    this.billingEngine = new FibonacciBilling(options.billingOptions);
    
    // Initialize Paddle SDK - using any type to avoid typechecking issues
    this.paddleClient = new Paddle(this.apiKey, {
      environment: this.isSandbox ? Environment.sandbox : Environment.production
    });
  }

  /**
   * Creates a product in Paddle
   * @param options - Product creation options
   * @returns Promise resolving to the created product
   */
  async createProduct(options: ProductCreationOptions): Promise<any> {
    const basePrice = options.basePrice || this.billingEngine.calculateNextBilling(0).baseAmount;
    
    try {
      // Create product in Paddle
      const product = await this.paddleClient.products.create({
        name: options.name,
        description: options.description,
        // Use any additional fields required by Paddle API
      });
      
      // Create a price for the product (initial term)
      const price = await this.paddleClient.prices.create({
        productId: product.id,
        description: `${options.name} - Monthly`,
        unitPrice: {
          amount: String(Math.round(basePrice * 100)),
          currencyCode: 'USD'
        },
        billingCycle: {
          interval: 'month',
          frequency: 1
        },
        // Store Fibonacci data as metadata
      });
      
      return {
        ...product,
        initialPrice: price
      };
    } catch (error) {
      console.error('Error creating Paddle product:', error);
      throw error;
    }
  }

  /**
   * Generates a checkout URL for a product
   * @param options - Checkout session options
   * @returns Promise resolving to the checkout URL
   */
  async generateCheckoutUrl(options: CheckoutSessionOptions): Promise<string> {
    try {
      // Create a checkout session
      const checkout = await this.paddleClient.checkout.create({
        items: [
          {
            priceId: options.priceId, // Use the specific price ID
            quantity: 1
          }
        ],
        // Add customer details, success URL, etc.
        customerId: options.customerId,
        // Additional checkout options as required by Paddle API
      });
      
      // Return the checkout URL - adjust based on actual SDK response
      return checkout.checkoutUrl || checkout.url || '';
    } catch (error) {
      console.error('Error generating Paddle checkout URL:', error);
      throw error;
    }
  }

  /**
   * Handles Paddle webhook events
   * @param payload - Webhook payload
   * @returns Promise resolving to webhook processing result
   */
  async handleWebhook(payload: any): Promise<WebhookResult> {
    try {
      // Verify webhook signature
      // Note: In production, you would verify the webhook signature using Paddle's API
      
      const eventType = payload.type || payload.event_type || payload.alert_name;
      
      switch (eventType) {
        case 'subscription.created':
          return this.handleSubscriptionCreated(payload);
          
        case 'subscription.updated':
          return this.handleSubscriptionUpdated(payload);
          
        case 'subscription.canceled':
          return this.handleSubscriptionCanceled(payload);
          
        case 'subscription.payment_succeeded':
        case 'payment_succeeded':
          return this.handlePaymentSucceeded(payload);
          
        case 'subscription.payment_failed':
        case 'payment_failed':
          return this.handlePaymentFailed(payload);
          
        default:
          return {
            action: 'ignored',
            eventType
          };
      }
    } catch (error) {
      console.error('Error handling Paddle webhook:', error);
      return {
        action: 'error',
        error: String(error)
      };
    }
  }
  
  /**
   * Handle subscription created event
   * @param payload - Webhook payload
   * @returns Webhook result
   */
  private async handleSubscriptionCreated(payload: any): Promise<WebhookResult> {
    const subscriptionId = this.extractId(payload, 'subscription');
    const customerId = this.extractId(payload, 'customer');
    
    if (!subscriptionId) {
      return {
        action: 'error',
        error: 'No subscription ID found in webhook payload'
      };
    }
    
    return {
      action: 'subscription_created',
      customerId,
      subscriptionId,
      subscription: payload.subscription || payload
    };
  }
  
  /**
   * Handle subscription updated event
   * @param payload - Webhook payload
   * @returns Webhook result
   */
  private async handleSubscriptionUpdated(payload: any): Promise<WebhookResult> {
    const subscriptionId = this.extractId(payload, 'subscription');
    const customerId = this.extractId(payload, 'customer');
    
    if (!subscriptionId) {
      return {
        action: 'error',
        error: 'No subscription ID found in webhook payload'
      };
    }
    
    return {
      action: 'subscription_updated',
      customerId,
      subscriptionId,
      subscription: payload.subscription || payload
    };
  }
  
  /**
   * Handle subscription canceled event
   * @param payload - Webhook payload
   * @returns Webhook result
   */
  private async handleSubscriptionCanceled(payload: any): Promise<WebhookResult> {
    const subscriptionId = this.extractId(payload, 'subscription');
    const customerId = this.extractId(payload, 'customer');
    
    if (!subscriptionId) {
      return {
        action: 'error',
        error: 'No subscription ID found in webhook payload'
      };
    }
    
    return {
      action: 'subscription_ended',
      customerId,
      subscriptionId,
      subscription: payload.subscription || payload
    };
  }
  
  /**
   * Handle payment succeeded event
   * @param payload - Webhook payload
   * @returns Webhook result
   */
  private async handlePaymentSucceeded(payload: any): Promise<WebhookResult> {
    const subscriptionId = this.extractId(payload, 'subscription');
    const customerId = this.extractId(payload, 'customer');
    
    if (!subscriptionId) {
      return {
        action: 'error',
        error: 'No subscription ID found in webhook payload'
      };
    }
    
    try {
      // Get the subscription
      const subscription = await this.paddleClient.subscriptions.get(subscriptionId);
      
      // Check if this is a Fibonacci billing subscription
      // This would be stored in metadata or custom fields
      const metadata = subscription.metadata || {};
      if (!metadata.fibonacciBillingCycle) {
        return {
          action: 'payment_succeeded_non_fibonacci',
          customerId,
          subscriptionId
        };
      }
      
      const currentCycle = parseInt(metadata.fibonacciBillingCycle, 10);
      
      // Schedule the next payment reminder
      await this.scheduleNextPaymentReminder(subscription, this.billingEngine.calculateNextBilling(currentCycle));
      
      return {
        action: 'payment_succeeded',
        customerId,
        subscriptionId,
        currentCycle,
        subscription
      };
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
      return {
        action: 'error',
        error: String(error)
      };
    }
  }
  
  /**
   * Handle payment failed event
   * @param payload - Webhook payload
   * @returns Webhook result
   */
  private async handlePaymentFailed(payload: any): Promise<WebhookResult> {
    const subscriptionId = this.extractId(payload, 'subscription');
    const customerId = this.extractId(payload, 'customer');
    
    if (!subscriptionId) {
      return {
        action: 'error',
        error: 'No subscription ID found in webhook payload'
      };
    }
    
    return {
      action: 'payment_failed',
      customerId,
      subscriptionId,
      payload
    };
  }

  /**
   * Helper to extract IDs from webhook payloads
   * @param payload - Webhook payload
   * @param type - ID type to extract
   * @returns The extracted ID or undefined
   */
  private extractId(payload: any, type: string): string | undefined {
    // Handle different payload formats
    if (payload[type]?.id) {
      return payload[type].id;
    }
    
    if (payload[`${type}_id`]) {
      return payload[`${type}_id`];
    }
    
    if (payload[`${type}Id`]) {
      return payload[`${type}Id`];
    }
    
    return undefined;
  }

  /**
   * Schedules the next payment reminder
   * @param subscription - Paddle subscription object
   * @param nextBilling - Next billing information
   * @returns Promise resolving when reminder is scheduled
   */
  async scheduleNextPaymentReminder(subscription: any, nextBilling: any): Promise<any> {
    try {
      const subscriptionId = subscription.id;
      const customerId = subscription.customerId || subscription.customer_id;
      
      // Get the next billing date - adapt to match SDK response format
      const currentPeriodEnd = new Date(subscription.currentPeriodEnd || subscription.current_period_end);
      const daysBeforeRenewal = 7;
      const reminderDate = new Date(currentPeriodEnd.getTime() - (daysBeforeRenewal * 24 * 60 * 60 * 1000));
      
      // In a real implementation, you would use a scheduling service or database
      // to store the reminder and trigger it at the appropriate time
      
      return {
        scheduled: true,
        subscription_id: subscriptionId,
        customer_id: customerId,
        reminder_date: reminderDate.toISOString(),
        next_billing_date: currentPeriodEnd.toISOString(),
        next_cycle: nextBilling.cycle,
        next_term_months: nextBilling.termMonths,
        next_amount: nextBilling.finalAmount
      };
    } catch (error) {
      console.error('Error scheduling next payment reminder:', error);
      throw error;
    }
  }

  /**
   * Updates a subscription to the next Fibonacci term
   * @param subscriptionId - Paddle subscription ID
   * @param currentCycle - Current Fibonacci cycle
   * @returns Promise resolving to the updated subscription
   */
  async updateSubscriptionToNextTerm(subscriptionId: string, currentCycle: number): Promise<any> {
    try {
      // Get the subscription
      const subscription = await this.paddleClient.subscriptions.get(subscriptionId);
      
      // Calculate next billing cycle
      const nextBilling = this.billingEngine.calculateNextBilling(currentCycle);
      
      // Update the subscription with new billing information
      // The exact implementation depends on Paddle's API for updating subscriptions
      const updatedSubscription = await this.paddleClient.subscriptions.update(subscriptionId, {
        // Fields to update based on Paddle API requirements
        // Store Fibonacci data in metadata
        metadata: {
          fibonacciBillingCycle: String(nextBilling.cycle),
          termMonths: String(nextBilling.termMonths),
          baseAmount: String(nextBilling.baseAmount),
          discount: String(nextBilling.discount),
          finalAmount: String(nextBilling.finalAmount),
          savingsAmount: String(nextBilling.savingsAmount),
          effectiveMonthlyRate: String(nextBilling.effectiveMonthlyRate)
        }
      });
      
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription to next term:', error);
      throw error;
    }
  }
}

export default FibonacciPaddleIntegration; 