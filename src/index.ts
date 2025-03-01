/**
 * fibonacci-billing
 * A flexible Node.js package that implements Fibonacci sequence-based subscription billing.
 * 
 * @license MIT
 */

// Core exports
export { default as FibonacciBilling } from './core/fibonacci-billing';

// Integrations
export { default as FibonacciStripeIntegration } from './integrations/stripe';
export { default as FibonacciPaddleIntegration } from './integrations/paddle';

// UI Components
export { default as FibonacciBillingVisualizer } from './ui/react';

// Types
export * from './types'; 