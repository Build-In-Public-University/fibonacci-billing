"use strict";
/**
 * fibonacci-billing
 * A Node.js package that implements Fibonacci sequence-based subscription billing
 *
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
class FibonacciBilling {
    /**
     * Creates a new Fibonacci billing plan
     * @param options - Configuration options
     */
    constructor(options = {}) {
        this.basePrice = options.basePrice || 10;
        this.discountRate = options.discountRate || 0.05;
        this.capTerm = options.capTerm || false;
        this.maxTerm = options.maxTerm || 0;
        this.sequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    }
    /**
     * Gets the next billing term in months
     * @param currentCycle - The current billing cycle (0-indexed)
     * @returns The next billing term in months
     */
    getNextTerm(currentCycle) {
        if (currentCycle < 0) {
            return this.sequence[0];
        }
        if (currentCycle >= this.sequence.length) {
            // Calculate next Fibonacci number if beyond pre-calculated sequence
            const nextFib = this.sequence[this.sequence.length - 1] +
                this.sequence[this.sequence.length - 2];
            this.sequence.push(nextFib);
        }
        let nextTerm = this.sequence[Math.min(currentCycle, this.sequence.length - 1)];
        // Apply cap if enabled
        if (this.capTerm && this.maxTerm > 0) {
            nextTerm = Math.min(nextTerm, this.maxTerm);
        }
        return nextTerm;
    }
    /**
     * Calculates the price for the next billing cycle
     * @param currentCycle - The current billing cycle (0-indexed)
     * @returns Billing information for next cycle
     */
    calculateNextBilling(currentCycle) {
        const termMonths = this.getNextTerm(currentCycle);
        const baseAmount = this.basePrice * termMonths;
        // Apply progressive discount based on term length
        const discount = Math.min(this.discountRate * (termMonths - 1), 0.5);
        const discountedAmount = baseAmount * (1 - discount);
        return {
            cycle: currentCycle + 1,
            termMonths: termMonths,
            baseAmount: parseFloat(baseAmount.toFixed(2)),
            discount: parseFloat((discount * 100).toFixed(2)),
            finalAmount: parseFloat(discountedAmount.toFixed(2)),
            savingsAmount: parseFloat((baseAmount - discountedAmount).toFixed(2)),
            effectiveMonthlyRate: parseFloat((discountedAmount / termMonths).toFixed(2))
        };
    }
    /**
     * Generates a billing schedule for multiple cycles
     * @param cycles - Number of cycles to generate
     * @returns Array of billing information for each cycle
     */
    generateBillingSchedule(cycles = 10) {
        const schedule = [];
        for (let i = 0; i < cycles; i++) {
            schedule.push(this.calculateNextBilling(i));
        }
        return schedule;
    }
    /**
     * Provides a summary of total costs over specified number of cycles
     * @param cycles - Number of cycles to summarize
     * @returns Summary of total costs and savings
     */
    getBillingSummary(cycles = 10) {
        const schedule = this.generateBillingSchedule(cycles);
        const totalMonths = schedule.reduce((sum, item) => sum + item.termMonths, 0);
        const totalAmount = schedule.reduce((sum, item) => sum + item.finalAmount, 0);
        const totalBaseAmount = schedule.reduce((sum, item) => sum + item.baseAmount, 0);
        const totalSavings = schedule.reduce((sum, item) => sum + item.savingsAmount, 0);
        return {
            cycles: cycles,
            totalMonths: totalMonths,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            totalBaseAmount: parseFloat(totalBaseAmount.toFixed(2)),
            totalSavings: parseFloat(totalSavings.toFixed(2)),
            savingsPercentage: parseFloat(((totalSavings / totalBaseAmount) * 100).toFixed(2)),
            effectiveMonthlyRate: parseFloat((totalAmount / totalMonths).toFixed(2))
        };
    }
}
exports.default = FibonacciBilling;
//# sourceMappingURL=fibonacci-billing.js.map