/**
 * Basic usage example for Fibonacci Billing
 */

const { FibonacciBilling } = require('../dist');

// Create a new billing plan
const billing = new FibonacciBilling({
  basePrice: 19.99, // $19.99 per month base price
  discountRate: 0.08, // 8% discount per term length
});

// Calculate next billing for a new customer (cycle 0)
const nextBilling = billing.calculateNextBilling(0);
console.log(`Next billing: ${nextBilling.termMonths} months for $${nextBilling.finalAmount}`);

// Generate a billing schedule for 5 cycles
console.log('\nBilling Schedule:');
const schedule = billing.generateBillingSchedule(5);
schedule.forEach(cycle => {
  console.log(`Cycle ${cycle.cycle}: ${cycle.termMonths} months for $${cycle.finalAmount} (${cycle.discount}% discount, $${cycle.effectiveMonthlyRate}/month)`);
});

// Get a billing summary
console.log('\nBilling Summary:');
const summary = billing.getBillingSummary(5);
console.log(`Total months: ${summary.totalMonths}`);
console.log(`Total amount: $${summary.totalAmount}`);
console.log(`Total savings: $${summary.totalSavings} (${summary.savingsPercentage}%)`);
console.log(`Effective monthly rate: $${summary.effectiveMonthlyRate}`); 