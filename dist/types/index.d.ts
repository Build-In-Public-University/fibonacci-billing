/**
 * fibonacci-billing type definitions
 */
/**
 * Configuration options for Fibonacci billing
 */
export interface FibonacciBillingOptions {
    /**
     * The base price per month
     */
    basePrice: number;
    /**
     * Optional discount rate for longer periods (0-1)
     */
    discountRate?: number;
    /**
     * Whether to cap the maximum term length
     */
    capTerm?: boolean;
    /**
     * Maximum term length in months if capped
     */
    maxTerm?: number;
}
/**
 * Billing information for a specific cycle
 */
export interface BillingCycleInfo {
    /**
     * Current billing cycle (1-indexed)
     */
    cycle: number;
    /**
     * Term length in months
     */
    termMonths: number;
    /**
     * Base amount before discounts
     */
    baseAmount: number;
    /**
     * Discount percentage applied
     */
    discount: number;
    /**
     * Final amount after discounts
     */
    finalAmount: number;
    /**
     * Savings amount compared to base price
     */
    savingsAmount: number;
    /**
     * Effective monthly rate after discounts
     */
    effectiveMonthlyRate: number;
}
/**
 * Billing summary over multiple cycles
 */
export interface BillingSummary {
    /**
     * Number of billing cycles
     */
    cycles: number;
    /**
     * Total months across all cycles
     */
    totalMonths: number;
    /**
     * Total amount across all cycles after discounts
     */
    totalAmount: number;
    /**
     * Total base amount before discounts
     */
    totalBaseAmount: number;
    /**
     * Total savings across all cycles
     */
    totalSavings: number;
    /**
     * Savings percentage compared to base amount
     */
    savingsPercentage: number;
    /**
     * Effective monthly rate across all cycles
     */
    effectiveMonthlyRate: number;
}
/**
 * Base payment integration options
 */
export interface PaymentIntegrationOptions {
    /**
     * Fibonacci billing options
     */
    billingOptions: FibonacciBillingOptions;
}
/**
 * Stripe integration options
 */
export interface StripeIntegrationOptions extends PaymentIntegrationOptions {
    /**
     * Stripe secret key
     */
    stripeSecretKey: string;
    /**
     * Webhook secret for verifying events
     */
    webhookSecret?: string;
}
/**
 * Paddle integration options
 */
export interface PaddleIntegrationOptions extends PaymentIntegrationOptions {
    /**
     * Paddle API key
     */
    apiKey: string;
    /**
     * Paddle vendor ID
     */
    vendorId: string;
    /**
     * Paddle vendor auth code
     */
    vendorAuthCode: string;
    /**
     * Whether to use sandbox mode
     */
    isSandbox?: boolean;
}
/**
 * Product creation options
 */
export interface ProductCreationOptions {
    /**
     * Product name
     */
    name: string;
    /**
     * Product description
     */
    description: string;
    /**
     * Base price (optional, defaults to billing options)
     */
    basePrice?: number;
}
/**
 * Subscription creation options
 */
export interface SubscriptionCreationOptions {
    /**
     * Customer ID in the payment provider
     */
    customerId: string;
    /**
     * Product ID in the payment provider
     */
    productId: string;
    /**
     * Payment method ID (Stripe-specific)
     */
    paymentMethodId?: string;
}
/**
 * Checkout session options
 */
export interface CheckoutSessionOptions {
    /**
     * Customer ID in the payment provider
     */
    customerId: string;
    /**
     * Product ID in the payment provider
     */
    productId: string;
    /**
     * Price ID in the payment provider (for Paddle)
     */
    priceId?: string;
    /**
     * URL to redirect on success
     */
    successUrl: string;
    /**
     * URL to redirect on cancel
     */
    cancelUrl: string;
    /**
     * Webhook URL (Paddle-specific)
     */
    webhookUrl?: string;
}
/**
 * Webhook processing result
 */
export interface WebhookResult {
    /**
     * Action type
     */
    action: string;
    /**
     * Customer ID
     */
    customerId?: string;
    /**
     * Subscription ID
     */
    subscriptionId?: string;
    /**
     * Additional data
     */
    [key: string]: any;
}
