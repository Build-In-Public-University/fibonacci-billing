/**
 * Stripe integration for Fibonacci Billing
 */

import Stripe from 'stripe';
import FibonacciBilling from '../../core/fibonacci-billing';
import {
  StripeIntegrationOptions,
  ProductCreationOptions,
  SubscriptionCreationOptions,
  CheckoutSessionOptions,
  WebhookResult
} from '../../types';

/**
 * Fibonacci Billing integration with Stripe
 */
class FibonacciStripeIntegration {
  private stripeSecretKey: string;
  private webhookSecret?: string;
  private billingEngine: FibonacciBilling;
  private stripe: Stripe;

  /**
   * Creates a new Stripe integration
   * @param options - Stripe integration options
   */
  constructor(options: StripeIntegrationOptions) {
    this.stripeSecretKey = options.stripeSecretKey;
    this.webhookSecret = options.webhookSecret;
    this.billingEngine = new FibonacciBilling(options.billingOptions);
    
    // Initialize Stripe SDK
    this.stripe = new Stripe(this.stripeSecretKey, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion, // Use latest API version
    });
  }

  /**
   * Creates a product in Stripe
   * @param options - Product creation options
   * @returns Promise resolving to the created product
   */
  async createProduct(options: ProductCreationOptions): Promise<Stripe.Product> {
    const basePrice = options.basePrice || this.billingEngine.calculateNextBilling(0).baseAmount;
    
    // Create product in Stripe
    const product = await this.stripe.products.create({
      name: options.name,
      description: options.description,
      metadata: {
        basePrice: basePrice.toString(),
        fibonacciBilling: 'true'
      },
      active: true
    });
    
    // Create a price for the product
    await this.stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(basePrice * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      metadata: {
        fibonacciBillingInitial: 'true'
      }
    });

    return product;
  }

  /**
   * Creates a subscription for a customer
   * @param options - Subscription creation options
   * @returns Promise resolving to the created subscription
   */
  async createSubscription(options: SubscriptionCreationOptions): Promise<Stripe.Subscription> {
    // Get next billing cycle information
    const nextBilling = this.billingEngine.calculateNextBilling(0);
    
    // Get product to get default price
    const product = await this.stripe.products.retrieve(options.productId);
    
    // Get the price ID
    const prices = await this.stripe.prices.list({
      product: options.productId,
      limit: 1,
      active: true
    });
    
    if (!prices.data.length) {
      throw new Error('No prices found for this product');
    }
    
    // Create a new price for the Fibonacci term if needed
    let priceId = prices.data[0].id;
    
    // If this is not the first cycle, create a custom price for the term
    if (nextBilling.cycle > 1) {
      const newPrice = await this.stripe.prices.create({
        product: options.productId,
        unit_amount: Math.round(nextBilling.finalAmount * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: nextBilling.termMonths
        },
        metadata: {
          fibonacciBillingCycle: nextBilling.cycle.toString(),
          termMonths: nextBilling.termMonths.toString(),
          discount: nextBilling.discount.toString(),
          effectiveMonthlyRate: nextBilling.effectiveMonthlyRate.toString()
        }
      });
      
      priceId = newPrice.id;
    }
    
    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: options.customerId,
      items: [
        {
          price: priceId
        }
      ],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        fibonacciBillingCycle: nextBilling.cycle.toString(),
        termMonths: nextBilling.termMonths.toString(),
        baseAmount: nextBilling.baseAmount.toString(),
        discount: nextBilling.discount.toString(),
        finalAmount: nextBilling.finalAmount.toString(),
        savingsAmount: nextBilling.savingsAmount.toString(),
        effectiveMonthlyRate: nextBilling.effectiveMonthlyRate.toString()
      }
    });
    
    // If payment method is provided, attach it to the subscription
    if (options.paymentMethodId) {
      await this.stripe.paymentMethods.attach(options.paymentMethodId, {
        customer: options.customerId
      });
      
      // Set as default payment method
      await this.stripe.customers.update(options.customerId, {
        invoice_settings: {
          default_payment_method: options.paymentMethodId
        }
      });
    }

    return subscription;
  }

  /**
   * Creates a checkout session for a customer
   * @param options - Checkout session options
   * @returns Promise resolving to the created checkout session
   */
  async createCheckoutSession(options: CheckoutSessionOptions): Promise<Stripe.Checkout.Session> {
    // Get the price ID for the product
    const prices = await this.stripe.prices.list({
      product: options.productId,
      limit: 1,
      active: true
    });
    
    if (!prices.data.length) {
      throw new Error('No prices found for this product');
    }
    
    // Create a checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer: options.customerId,
      metadata: {
        fibonacciBilling: 'true'
      }
    });

    return session;
  }

  /**
   * Handles Stripe webhook events
   * @param payload - Raw webhook payload
   * @param signature - Stripe signature header
   * @returns Promise resolving to webhook processing result
   */
  async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret is required to handle webhooks');
    }
    
    try {
      // Verify the event
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      
      // Process based on event type
      switch (event.type) {
        case 'customer.subscription.created':
          return this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          
        case 'customer.subscription.updated':
          return this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          
        case 'customer.subscription.deleted':
          return this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          
        case 'invoice.payment_succeeded':
          return this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          
        case 'invoice.payment_failed':
          return this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          
        default:
          return {
            action: 'ignored',
            eventType: event.type
          };
      }
    } catch (err) {
      const error = err as Error;
      return {
        action: 'error',
        error: error.message
      };
    }
  }

  /**
   * Handle subscription created event
   * @param subscription - Stripe subscription object
   * @returns Webhook result
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<WebhookResult> {
    return {
      action: 'subscription_created',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      subscription
    };
  }

  /**
   * Handle subscription updated event
   * @param subscription - Stripe subscription object
   * @returns Webhook result
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<WebhookResult> {
    return {
      action: 'subscription_updated',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      subscription
    };
  }

  /**
   * Handle subscription deleted event
   * @param subscription - Stripe subscription object
   * @returns Webhook result
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<WebhookResult> {
    return {
      action: 'subscription_ended',
      customerId: subscription.customer as string,
      subscriptionId: subscription.id,
      subscription
    };
  }

  /**
   * Handle payment succeeded event
   * @param invoice - Stripe invoice object
   * @returns Webhook result
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<WebhookResult> {
    if (!invoice.subscription) {
      return {
        action: 'payment_succeeded_non_subscription',
        customerId: invoice.customer as string,
        invoiceId: invoice.id,
        invoice
      };
    }
    
    // Get the subscription
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Check if this is a Fibonacci billing subscription
    if (!subscription.metadata?.fibonacciBillingCycle) {
      return {
        action: 'payment_succeeded_non_fibonacci',
        customerId: invoice.customer as string,
        subscriptionId: subscription.id,
        invoiceId: invoice.id
      };
    }
    
    const currentCycle = parseInt(subscription.metadata.fibonacciBillingCycle, 10);
    
    // Schedule the next payment reminder if subscription is active
    if (subscription.status === 'active') {
      await this.schedulePaymentReminder(subscription.id);
    }
    
    return {
      action: 'payment_succeeded',
      customerId: invoice.customer as string,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      currentCycle,
      subscription
    };
  }

  /**
   * Handle payment failed event
   * @param invoice - Stripe invoice object
   * @returns Webhook result
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<WebhookResult> {
    if (!invoice.subscription) {
      return {
        action: 'payment_failed_non_subscription',
        customerId: invoice.customer as string,
        invoiceId: invoice.id,
        invoice
      };
    }
    
    return {
      action: 'payment_failed',
      customerId: invoice.customer as string,
      subscriptionId: invoice.subscription as string,
      invoiceId: invoice.id,
      invoice
    };
  }

  /**
   * Schedules the next payment reminder
   * @param subscriptionId - Stripe subscription ID
   * @param daysBeforeRenewal - Days before renewal to send reminder
   * @returns Promise resolving when reminder is scheduled
   */
  async schedulePaymentReminder(subscriptionId: string, daysBeforeRenewal = 7): Promise<any> {
    // Get the subscription
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    // Check if this is a Fibonacci billing subscription
    if (!subscription.metadata?.fibonacciBillingCycle) {
      throw new Error('Not a Fibonacci billing subscription');
    }
    
    const currentCycle = parseInt(subscription.metadata.fibonacciBillingCycle, 10);
    const currentTermEnd = subscription.current_period_end * 1000; // Convert to milliseconds
    const reminderDate = new Date(currentTermEnd - (daysBeforeRenewal * 24 * 60 * 60 * 1000));
    
    // Calculate next billing cycle
    const nextBilling = this.billingEngine.calculateNextBilling(currentCycle);
    
    // In a real implementation, you would use a scheduling service or database
    // to store the reminder and trigger it at the appropriate time
    
    return {
      scheduled: true,
      subscriptionId,
      customerId: subscription.customer as string,
      reminderDate,
      currentCycle,
      nextCycle: nextBilling.cycle,
      nextTermMonths: nextBilling.termMonths,
      nextAmount: nextBilling.finalAmount
    };
  }

  /**
   * Updates a subscription to the next Fibonacci term
   * @param subscriptionId - Stripe subscription ID
   * @returns Promise resolving to the updated subscription
   */
  async updateSubscriptionToNextTerm(subscriptionId: string): Promise<Stripe.Subscription> {
    // Get the subscription
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    // Check if this is a Fibonacci billing subscription
    if (!subscription.metadata?.fibonacciBillingCycle) {
      throw new Error('Not a Fibonacci billing subscription');
    }
    
    const currentCycle = parseInt(subscription.metadata.fibonacciBillingCycle, 10);
    
    // Calculate next billing cycle
    const nextBilling = this.billingEngine.calculateNextBilling(currentCycle);
    
    // Get the product ID
    const currentItem = subscription.items.data[0];
    const productId = currentItem.price.product as string;
    
    // Create a new price for the next term
    const newPrice = await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(nextBilling.finalAmount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: nextBilling.termMonths
      },
      metadata: {
        fibonacciBillingCycle: nextBilling.cycle.toString(),
        termMonths: nextBilling.termMonths.toString(),
        discount: nextBilling.discount.toString(),
        effectiveMonthlyRate: nextBilling.effectiveMonthlyRate.toString()
      }
    });
    
    // Update the subscription with the new price
    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPrice.id
        }
      ],
      proration_behavior: 'none',
      metadata: {
        fibonacciBillingCycle: nextBilling.cycle.toString(),
        termMonths: nextBilling.termMonths.toString(),
        baseAmount: nextBilling.baseAmount.toString(),
        discount: nextBilling.discount.toString(),
        finalAmount: nextBilling.finalAmount.toString(),
        savingsAmount: nextBilling.savingsAmount.toString(),
        effectiveMonthlyRate: nextBilling.effectiveMonthlyRate.toString()
      }
    });
    
    return updatedSubscription;
  }
}

export default FibonacciStripeIntegration; 