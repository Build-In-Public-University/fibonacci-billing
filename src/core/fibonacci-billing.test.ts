import FibonacciBilling from './fibonacci-billing';

describe('FibonacciBilling', () => {
  describe('constructor', () => {
    it('should initialize with default values', () => {
      const billing = new FibonacciBilling();
      expect(billing['basePrice']).toBe(10);
      expect(billing['discountRate']).toBe(0.05);
      expect(billing['capTerm']).toBe(false);
      expect(billing['maxTerm']).toBe(0);
    });

    it('should initialize with provided values', () => {
      const billing = new FibonacciBilling({
        basePrice: 20,
        discountRate: 0.1,
        capTerm: true,
        maxTerm: 12
      });
      expect(billing['basePrice']).toBe(20);
      expect(billing['discountRate']).toBe(0.1);
      expect(billing['capTerm']).toBe(true);
      expect(billing['maxTerm']).toBe(12);
    });
  });

  describe('getNextTerm', () => {
    it('should return the first term for cycle 0', () => {
      const billing = new FibonacciBilling();
      expect(billing.getNextTerm(0)).toBe(1);
    });

    it('should return the correct Fibonacci term for each cycle', () => {
      const billing = new FibonacciBilling();
      expect(billing.getNextTerm(1)).toBe(2);
      expect(billing.getNextTerm(2)).toBe(3);
      expect(billing.getNextTerm(3)).toBe(5);
      expect(billing.getNextTerm(4)).toBe(8);
      expect(billing.getNextTerm(5)).toBe(13);
    });

    it('should cap the term if capTerm is true', () => {
      const billing = new FibonacciBilling({
        capTerm: true,
        maxTerm: 6
      });
      expect(billing.getNextTerm(0)).toBe(1);
      expect(billing.getNextTerm(4)).toBe(6); // Would be 8, but capped at 6
      expect(billing.getNextTerm(5)).toBe(6); // Would be 13, but capped at 6
    });
  });

  describe('calculateNextBilling', () => {
    it('should calculate correct billing for first cycle', () => {
      const billing = new FibonacciBilling({
        basePrice: 20,
        discountRate: 0.05
      });
      
      const result = billing.calculateNextBilling(0);
      
      expect(result.cycle).toBe(1);
      expect(result.termMonths).toBe(1);
      expect(result.baseAmount).toBe(20);
      expect(result.discount).toBe(0);
      expect(result.finalAmount).toBe(20);
      expect(result.savingsAmount).toBe(0);
      expect(result.effectiveMonthlyRate).toBe(20);
    });

    it('should apply discount for longer terms', () => {
      const billing = new FibonacciBilling({
        basePrice: 20,
        discountRate: 0.05
      });
      
      const result = billing.calculateNextBilling(3); // 4th cycle, term = 5 months
      
      expect(result.cycle).toBe(4);
      expect(result.termMonths).toBe(5);
      expect(result.baseAmount).toBe(100); // 5 months * $20
      expect(result.discount).toBe(20); // 5-1 = 4, 4 * 0.05 = 0.2 = 20%
      expect(result.finalAmount).toBe(80); // $100 - 20%
      expect(result.savingsAmount).toBe(20); // $100 - $80
      expect(result.effectiveMonthlyRate).toBe(16); // $80 / 5 months
    });
  });

  describe('generateBillingSchedule', () => {
    it('should generate a schedule for the specified number of cycles', () => {
      const billing = new FibonacciBilling();
      const schedule = billing.generateBillingSchedule(3);
      
      expect(schedule.length).toBe(3);
      expect(schedule[0].cycle).toBe(1);
      expect(schedule[1].cycle).toBe(2);
      expect(schedule[2].cycle).toBe(3);
    });
  });

  describe('getBillingSummary', () => {
    it('should calculate correct summary for multiple cycles', () => {
      const billing = new FibonacciBilling({
        basePrice: 10,
        discountRate: 0.05
      });
      
      const summary = billing.getBillingSummary(3);
      
      expect(summary.cycles).toBe(3);
      expect(summary.totalMonths).toBe(6); // 1 + 2 + 3 = 6
      expect(summary.totalAmount).toBe(56.5); // 10 + 19 + 27.5 = 56.5
      expect(summary.totalBaseAmount).toBe(60); // 10 + 20 + 30 = 60
      expect(summary.totalSavings).toBe(3.5); // 60 - 56.5 = 3.5
      expect(summary.savingsPercentage).toBe(5.83); // (3.5 / 60) * 100 = 5.83%
      expect(summary.effectiveMonthlyRate).toBe(9.42); // 56.5 / 6 = 9.42
    });
  });
}); 