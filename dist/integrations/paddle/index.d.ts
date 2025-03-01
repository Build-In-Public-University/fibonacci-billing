/**
 * Paddle integration for Fibonacci Billing
 */
import { PaddleIntegrationOptions, ProductCreationOptions, CheckoutSessionOptions, WebhookResult } from '../../types';
/**
 * Fibonacci Billing integration with Paddle
 */
declare class FibonacciPaddleIntegration {
    private apiKey;
    private vendorId;
    private vendorAuthCode;
    private isSandbox;
    private billingEngine;
    private paddleClient;
    /**
     * Creates a new Paddle integration
     * @param options - Paddle integration options
     */
    constructor(options: PaddleIntegrationOptions);
    /**
     * Creates a product in Paddle
     * @param options - Product creation options
     * @returns Promise resolving to the created product
     */
    createProduct(options: ProductCreationOptions): Promise<any>;
    /**
     * Generates a checkout URL for a product
     * @param options - Checkout session options
     * @returns Promise resolving to the checkout URL
     */
    generateCheckoutUrl(options: CheckoutSessionOptions): Promise<string>;
    /**
     * Handles Paddle webhook events
     * @param payload - Webhook payload
     * @returns Promise resolving to webhook processing result
     */
    handleWebhook(payload: any): Promise<WebhookResult>;
    /**
     * Handle subscription created event
     * @param payload - Webhook payload
     * @returns Webhook result
     */
    private handleSubscriptionCreated;
    /**
     * Handle subscription updated event
     * @param payload - Webhook payload
     * @returns Webhook result
     */
    private handleSubscriptionUpdated;
    /**
     * Handle subscription canceled event
     * @param payload - Webhook payload
     * @returns Webhook result
     */
    private handleSubscriptionCanceled;
    /**
     * Handle payment succeeded event
     * @param payload - Webhook payload
     * @returns Webhook result
     */
    private handlePaymentSucceeded;
    /**
     * Handle payment failed event
     * @param payload - Webhook payload
     * @returns Webhook result
     */
    private handlePaymentFailed;
    /**
     * Helper to extract IDs from webhook payloads
     * @param payload - Webhook payload
     * @param type - ID type to extract
     * @returns The extracted ID or undefined
     */
    private extractId;
    /**
     * Schedules the next payment reminder
     * @param subscription - Paddle subscription object
     * @param nextBilling - Next billing information
     * @returns Promise resolving when reminder is scheduled
     */
    scheduleNextPaymentReminder(subscription: any, nextBilling: any): Promise<any>;
    /**
     * Updates a subscription to the next Fibonacci term
     * @param subscriptionId - Paddle subscription ID
     * @param currentCycle - Current Fibonacci cycle
     * @returns Promise resolving to the updated subscription
     */
    updateSubscriptionToNextTerm(subscriptionId: string, currentCycle: number): Promise<any>;
}
export default FibonacciPaddleIntegration;
