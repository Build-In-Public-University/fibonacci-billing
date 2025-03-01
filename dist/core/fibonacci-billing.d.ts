/**
 * fibonacci-billing
 * A Node.js package that implements Fibonacci sequence-based subscription billing
 *
 * @license MIT
 */
import { FibonacciBillingOptions, BillingCycleInfo, BillingSummary } from '../types';
declare class FibonacciBilling {
    private basePrice;
    private discountRate;
    private capTerm;
    private maxTerm;
    private sequence;
    /**
     * Creates a new Fibonacci billing plan
     * @param options - Configuration options
     */
    constructor(options?: Partial<FibonacciBillingOptions>);
    /**
     * Gets the next billing term in months
     * @param currentCycle - The current billing cycle (0-indexed)
     * @returns The next billing term in months
     */
    getNextTerm(currentCycle: number): number;
    /**
     * Calculates the price for the next billing cycle
     * @param currentCycle - The current billing cycle (0-indexed)
     * @returns Billing information for next cycle
     */
    calculateNextBilling(currentCycle: number): BillingCycleInfo;
    /**
     * Generates a billing schedule for multiple cycles
     * @param cycles - Number of cycles to generate
     * @returns Array of billing information for each cycle
     */
    generateBillingSchedule(cycles?: number): BillingCycleInfo[];
    /**
     * Provides a summary of total costs over specified number of cycles
     * @param cycles - Number of cycles to summarize
     * @returns Summary of total costs and savings
     */
    getBillingSummary(cycles?: number): BillingSummary;
}
export default FibonacciBilling;
