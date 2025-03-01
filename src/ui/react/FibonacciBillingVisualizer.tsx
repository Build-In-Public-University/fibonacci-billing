import React, { useState, useEffect } from 'react';
import FibonacciBilling from '../../core/fibonacci-billing';
import { BillingCycleInfo, BillingSummary } from '../../types';

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

// CSS styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
  },
  billingSummary: {
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
  },
  summaryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '5px',
  },
  value: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#334155',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '20px',
  },
  cell: {
    padding: '12px 15px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e2e8f0',
  },
  headerCell: {
    padding: '12px 15px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontWeight: 600,
    color: '#475569',
  },
  row: {
    // Empty object for base row style
  },
  rowHover: {
    backgroundColor: '#f1f5f9',
  }
};

/**
 * Component for visualizing Fibonacci billing schedules
 */
const FibonacciBillingVisualizer: React.FC<FibonacciBillingVisualizerProps> = ({
  basePrice = 19.99,
  discountRate = 0.08,
  capTerm = false,
  maxTerm = 0,
  cycles = 8
}) => {
  const [schedule, setSchedule] = useState<BillingCycleInfo[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  useEffect(() => {
    const billing = new FibonacciBilling({
      basePrice,
      discountRate,
      capTerm,
      maxTerm
    });

    setSchedule(billing.generateBillingSchedule(cycles));
    setSummary(billing.getBillingSummary(cycles));
  }, [basePrice, discountRate, capTerm, maxTerm, cycles]);

  if (schedule.length === 0 || !summary) {
    return <div>Loading billing information...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.billingSummary}>
        <h3>Billing Summary</h3>
        <div style={styles.summaryStats}>
          <div style={styles.stat}>
            <span style={styles.label}>Total Months:</span>
            <span style={styles.value}>{summary.totalMonths}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.label}>Total Amount:</span>
            <span style={styles.value}>${summary.totalAmount.toFixed(2)}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.label}>Total Savings:</span>
            <span style={styles.value}>${summary.totalSavings.toFixed(2)} ({summary.savingsPercentage}%)</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.label}>Effective Monthly Rate:</span>
            <span style={styles.value}>${summary.effectiveMonthlyRate.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3>Billing Schedule</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Cycle</th>
              <th style={styles.headerCell}>Term (Months)</th>
              <th style={styles.headerCell}>Base Amount</th>
              <th style={styles.headerCell}>Discount</th>
              <th style={styles.headerCell}>Final Amount</th>
              <th style={styles.headerCell}>Savings</th>
              <th style={styles.headerCell}>Monthly Rate</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((cycle) => (
              <tr 
                key={cycle.cycle} 
                style={{}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <td style={styles.cell}>{cycle.cycle}</td>
                <td style={styles.cell}>{cycle.termMonths}</td>
                <td style={styles.cell}>${cycle.baseAmount.toFixed(2)}</td>
                <td style={styles.cell}>{cycle.discount}%</td>
                <td style={styles.cell}>${cycle.finalAmount.toFixed(2)}</td>
                <td style={styles.cell}>${cycle.savingsAmount.toFixed(2)}</td>
                <td style={styles.cell}>${cycle.effectiveMonthlyRate.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FibonacciBillingVisualizer; 