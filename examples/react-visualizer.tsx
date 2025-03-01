/**
 * Fibonacci Billing - React Visualizer Example
 * 
 * This example demonstrates how to use the FibonacciBillingVisualizer
 * React component to display billing information to users.
 */

import React, { useState } from 'react';
import { FibonacciBillingVisualizer } from '../src';

// Example React component that uses the FibonacciBillingVisualizer
const FibonacciBillingCalculator: React.FC = () => {
  // State for the billing configuration
  const [basePrice, setBasePrice] = useState<number>(19.99);
  const [discountRate, setDiscountRate] = useState<number>(0.08);
  const [cycles, setCycles] = useState<number>(8);
  const [capTerm, setCapTerm] = useState<boolean>(true);
  const [maxTerm, setMaxTerm] = useState<number>(24);

  // Handle input changes
  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setBasePrice(value);
    }
  };

  const handleDiscountRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100; // Convert percentage to decimal
    if (!isNaN(value) && value >= 0 && value <= 1) {
      setDiscountRate(value);
    }
  };

  const handleCyclesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setCycles(value);
    }
  };

  const handleCapTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCapTerm(e.target.checked);
  };

  const handleMaxTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTerm(value);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Fibonacci Billing Calculator
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Configuration</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Base Price ($/month):
              <input
                type="number"
                value={basePrice}
                onChange={handleBasePriceChange}
                min="0.01"
                step="0.01"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Discount Rate (%):
              <input
                type="number"
                value={discountRate * 100}
                onChange={handleDiscountRateChange}
                min="0"
                max="100"
                step="1"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Number of Cycles:
              <input
                type="number"
                value={cycles}
                onChange={handleCyclesChange}
                min="1"
                max="20"
                step="1"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={capTerm}
              onChange={handleCapTermChange}
              style={{ marginRight: '8px' }}
            />
            Cap Maximum Term Length
          </label>
          
          {capTerm && (
            <div style={{ marginTop: '10px', marginLeft: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Maximum Term (months):
                <input
                  type="number"
                  value={maxTerm}
                  onChange={handleMaxTermChange}
                  min="1"
                  step="1"
                  style={{ width: '100px', padding: '8px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Fibonacci Billing Schedule</h2>
        
        {/* The Fibonacci Billing Visualizer component */}
        <FibonacciBillingVisualizer
          basePrice={basePrice}
          discountRate={discountRate}
          cycles={cycles}
          capTerm={capTerm}
          maxTerm={maxTerm}
        />
      </div>
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <p>
          Fibonacci Billing uses the Fibonacci sequence to create progressively longer billing terms,
          rewarding customer loyalty with increasing discounts while reducing churn and improving cash flow.
        </p>
      </div>
    </div>
  );
};

export default FibonacciBillingCalculator; 