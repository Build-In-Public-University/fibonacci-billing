import React from 'react';
interface FibonacciBillingVisualizerProps {
    /**
     * Base price per month
     */
    basePrice?: number;
    /**
     * Discount rate per term (0-1)
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
    /**
     * Number of cycles to display
     */
    cycles?: number;
}
/**
 * Component for visualizing Fibonacci billing schedules
 */
declare const FibonacciBillingVisualizer: React.FC<FibonacciBillingVisualizerProps>;
export default FibonacciBillingVisualizer;
