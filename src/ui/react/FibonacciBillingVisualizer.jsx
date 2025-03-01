import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FibonacciBillingVisualizer = () => {
  const [basePrice, setBasePrice] = useState(20);
  const [discountRate, setDiscountRate] = useState(0.10);
  const [cycles, setCycles] = useState(8);
  const [billingData, setBillingData] = useState([]);
  
  useEffect(() => {
    // Fibonacci sequence calculation
    const fibSequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
    const generateBillingData = () => {
      const data = [];
      let totalMonths = 0;
      
      for (let i = 0; i < cycles; i++) {
        const termMonths = i < fibSequence.length ? fibSequence[i] : 
          fibSequence[fibSequence.length - 1] + fibSequence[fibSequence.length - 2];
        
        const baseAmount = basePrice * termMonths;
        const discount = Math.min(discountRate * (termMonths - 1), 0.5);
        const discountedAmount = baseAmount * (1 - discount);
        
        totalMonths += termMonths;
        
        data.push({
          cycle: i + 1,
          termMonths,
          baseAmount: parseFloat(baseAmount.toFixed(2)),
          discount: parseFloat((discount * 100).toFixed(2)),
          finalAmount: parseFloat(discountedAmount.toFixed(2)),
          savingsAmount: parseFloat((baseAmount - discountedAmount).toFixed(2)),
          effectiveMonthlyRate: parseFloat((discountedAmount / termMonths).toFixed(2)),
          month: totalMonths
        });
      }
      
      return data;
    };
    
    setBillingData(generateBillingData());
  }, [basePrice, discountRate, cycles]);
  
  const totalMonths = billingData.reduce((sum, item) => sum + item.termMonths, 0);
  const totalAmount = billingData.reduce((sum, item) => sum + item.finalAmount, 0);
  const totalBaseAmount = billingData.reduce((sum, item) => sum + item.baseAmount, 0);
  const totalSavings = billingData.reduce((sum, item) => sum + item.savingsAmount, 0);
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Fibonacci Billing Calculator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Monthly Price ($)
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Rate Per Term (%)
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={discountRate * 100}
            onChange={(e) => setDiscountRate(Number(e.target.value) / 100)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Billing Cycles
          </label>
          <input
            type="number"
            min="1"
            max="15"
            value={cycles}
            onChange={(e) => setCycles(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Duration</p>
            <p className="text-xl font-bold">{totalMonths} months</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Savings</p>
            <p className="text-xl font-bold">${totalSavings.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Savings Percentage</p>
            <p className="text-xl font-bold">{(totalSavings / totalBaseAmount * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Term Length (months)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={billingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cycle" label={{ value: 'Billing Cycle', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Months', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} months`, 'Term Length']} />
            <Bar dataKey="termMonths" fill="#8884d8" name="Term Length" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Payment Amount vs. Regular Price</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={billingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cycle" label={{ value: 'Billing Cycle', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`$${value}`, '']} />
            <Legend />
            <Bar dataKey="baseAmount" fill="#82ca9d" name="Regular Price" />
            <Bar dataKey="finalAmount" fill="#8884d8" name="Discounted Price" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4">Effective Monthly Rate</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={billingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cycle" label={{ value: 'Billing Cycle', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Rate ($/month)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`$${value}`, 'Monthly Rate']} />
            <Line type="monotone" dataKey="effectiveMonthlyRate" stroke="#ff7300" activeDot={{ r: 8 }} name="Effective Monthly Rate" />
            <Line type="monotone" dataKey="basePrice" stroke="#82ca9d" strokeDasharray="5 5" name="Base Monthly Price" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Billing Schedule</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Cycle</th>
                <th className="border p-2 text-left">Term</th>
                <th className="border p-2 text-left">Base Amount</th>
                <th className="border p-2 text-left">Discount</th>
                <th className="border p-2 text-left">Final Amount</th>
                <th className="border p-2 text-left">Savings</th>
                <th className="border p-2 text-left">Monthly Rate</th>
              </tr>
            </thead>
            <tbody>
              {billingData.map((item) => (
                <tr key={item.cycle}>
                  <td className="border p-2">{item.cycle}</td>
                  <td className="border p-2">{item.termMonths} months</td>
                  <td className="border p-2">${item.baseAmount}</td>
                  <td className="border p-2">{item.discount}%</td>
                  <td className="border p-2">${item.finalAmount}</td>
                  <td className="border p-2">${item.savingsAmount}</td>
                  <td className="border p-2">${item.effectiveMonthlyRate}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FibonacciBillingVisualizer;