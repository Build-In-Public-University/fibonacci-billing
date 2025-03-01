/**
 * Stripe integration for Fibonacci Billing
 */
import Stripe from 'stripe';
import { StripeIntegrationOptions, ProductCreationOptions, SubscriptionCreationOptions, CheckoutSessionOptions, WebhookResult } from '../../types';
/**
 * Fibonacci Billing integration with Stripe
 */
declare class FibonacciStripeIntegration {
    private stripeSecretKey;
    private webhookSecret?;
    private billingEngine;
    private stripe;
    /**
     * Creates a new Stripe integration
     * @param options - Stripe integration options
     */
    constructor(options: StripeIntegrationOptions);
    /**
     * Creates a product in Stripe
     * @param options - Product creation options
     * @returns Promise resolving to the created product
     */
    createProduct(options: ProductCreationOptions): Promise<Stripe.Product>;
    /**
     * Creates a subscription for a customer
     * @param options - Subscription creation options
     * @returns Promise resolving to the created subscription
     */
    createSubscription(options: SubscriptionCreationOptions): Promise<Stripe.Subscription>;
    /**
     * Creates a checkout session for a customer
     * @param options - Checkout session options
     * @returns Promise resolving to the created checkout session
     */
    createCheckoutSession(options: CheckoutSessionOptions): Promise<Stripe.Checkout.Session>;
    /**
     * Handles Stripe webhook events
     * @param payload - Raw webhook payload
     * @param signature - Stripe signature header
     * @returns Promise resolving to webhook processing result
     */
    handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult>;
    /**
     * Handle subscription created event
     * @param subscription - Stripe subscription object
     * @returns Webhook result
     */
    private handleSubscriptionCreated;
    /**
     * Handle subscription updated event
     * @param subscription - Stripe subscription object
     * @returns Webhook result
     */
    private handleSubscriptionUpdated;
    /**
     * Handle subscription deleted event
     * @param subscription - Stripe subscription object
     * @returns Webhook result
     */
    private handleSubscriptionDeleted;
    /**
     * Handle payment succeeded event
     * @param invoice - Stripe invoice object
     * @returns Webhook result
     */
    private handlePaymentSucceeded;
    /**
     * Handle payment failed event
     * @param invoice - Stripe invoice object
     * @returns Webhook result
     */
    private handlePaymentFailed;
    /**
     * Schedules the next payment reminder
     * @param subscriptionId - Stripe subscription ID
     * @param daysBeforeRenewal - Days before renewal to send reminder
     * @returns Promise resolving when reminder is scheduled
     */
    schedulePaymentReminder(subscriptionId: string, daysBeforeRenewal?: number): Promise<any>;
    /**
     * Updates a subscription to the next Fibonacci term
     * @param subscriptionId - Stripe subscription ID
     * @returns Promise resolving to the updated subscription
     */
    updateSubscriptionToNextTerm(subscriptionId: string): Promise<Stripe.Subscription>;
}
export default FibonacciStripeIntegration;
