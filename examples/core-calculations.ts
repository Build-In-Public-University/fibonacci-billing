/**
 * Core Fibonacci Billing Calculations Example
 * 
 * This example demonstrates the basic functionalities of the Fibonacci Billing core engine.
 */

import { FibonacciBilling } from '../src';
import { BillingCycleInfo, BillingSummary } from '../src/types';

// Create a new billing engine with custom options
const billingEngine = new FibonacciBilling({
  basePrice: 19.99,           // $19.99 per month base price
  discountRate: 0.08,         // 8% discount per term length
  capTerm: true,              // Cap the maximum term
  maxTerm: 24                 // Maximum term length of 24 months
});

// Calculate billing for a new customer (cycle 0)
const firstBilling = billingEngine.calculateNextBilling(0);
console.log('First billing cycle:');
console.log(`- Term length: ${firstBilling.termMonths} month(s)`);
console.log(`- Amount: $${firstBilling.finalAmount.toFixed(2)}`);
console.log(`- Monthly rate: $${firstBilling.effectiveMonthlyRate.toFixed(2)}/month`);
console.log(`- Discount: ${(firstBilling.discount * 100).toFixed(2)}%`);
console.log('');

// Calculate billing for a renewing customer (cycle 1)
const secondBilling = billingEngine.calculateNextBilling(1);
console.log('Second billing cycle:');
console.log(`- Term length: ${secondBilling.termMonths} month(s)`);
console.log(`- Amount: $${secondBilling.finalAmount.toFixed(2)}`);
console.log(`- Monthly rate: $${secondBilling.effectiveMonthlyRate.toFixed(2)}/month`);
console.log(`- Discount: ${(secondBilling.discount * 100).toFixed(2)}%`);
console.log(`- Savings: $${secondBilling.savingsAmount.toFixed(2)}`);
console.log('');

// Generate a multi-cycle billing schedule
const cycles = 8;
console.log(`Generating billing schedule for ${cycles} cycles:`);
const schedule = billingEngine.generateBillingSchedule(cycles);

// Print the schedule in a table format
console.log('Cycle | Term | Amount ($) | Monthly Rate ($) | Discount (%) | Savings ($)');
console.log('------------------------------------------------------------------');
schedule.forEach((billing: BillingCycleInfo) => {
  console.log(
    `  ${billing.cycle}   | ${String(billing.termMonths).padEnd(4)} | ${billing.finalAmount.toFixed(2).padEnd(10)} | ` +
    `${billing.effectiveMonthlyRate.toFixed(2).padEnd(14)} | ${(billing.discount * 100).toFixed(2).padEnd(11)} | ` +
    `${billing.savingsAmount.toFixed(2)}`
  );
});
console.log('');

// Get a billing summary
const summary: BillingSummary = billingEngine.getBillingSummary(cycles);
console.log('Billing Summary:');
console.log(`- Total cycles: ${summary.cycles}`);
console.log(`- Total months: ${summary.totalMonths}`);
console.log(`- Total amount: $${summary.totalAmount.toFixed(2)}`);
console.log(`- Total base amount: $${summary.totalBaseAmount.toFixed(2)}`);
console.log(`- Total savings: $${summary.totalSavings.toFixed(2)} (${(summary.savingsPercentage * 100).toFixed(2)}%)`);
console.log(`- Overall effective monthly rate: $${summary.effectiveMonthlyRate.toFixed(2)}/month`);

// Calculate how many cycles needed to reach a 25% discount
let currentCycle = 0;
let currentDiscount = 0;
while (currentDiscount < 0.25) {
  currentCycle++;
  const billing = billingEngine.calculateNextBilling(currentCycle);
  currentDiscount = billing.discount;
}

console.log(`\nIt takes ${currentCycle} cycles to reach a 25% or greater discount.`); 