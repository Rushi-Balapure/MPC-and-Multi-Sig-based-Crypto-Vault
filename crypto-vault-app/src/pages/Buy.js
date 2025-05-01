// src/pages/Buy.js
import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import Button from '../components/common/Button';
import { formatAmount } from '../utils/helpers';

const Buy = () => {
  const { 
    teams, 
    activeTeam, 
    teamAssets, 
    selectTeam, 
    buyAsset, 
    isLoading 
  } = useVault();
  
  const [formData, setFormData] = useState({
    teamId: '',
    currency: '',
    amount: '',
    paymentMethod: 'bank',
    paymentDetails: ''
  });
  
  const [step, setStep] = useState(1);
  const [estimatedCrypto, setEstimatedCrypto] = useState('0.00');
  
  // Set default team when teams are loaded
  useEffect(() => {
    if (teams && teams.length > 0 && !formData.teamId) {
      setFormData(prev => ({ ...prev, teamId: teams[0].id }));
      // Select the team to load its assets
      selectTeam(teams[0].id);
    }
  }, [teams, formData.teamId, selectTeam]);
  
  // Set default currency when team assets are loaded
  useEffect(() => {
    if (teamAssets && teamAssets.length > 0 && !formData.currency) {
      setFormData(prev => ({ ...prev, currency: teamAssets[0].symbol }));
    } else if (!formData.currency) {
      // Default to ETH if no team assets
      setFormData(prev => ({ ...prev, currency: 'ETH' }));
    }
  }, [teamAssets, formData.currency]);
  
  // Update estimated crypto amount when fiat amount changes
  useEffect(() => {
    // Simple exchange rate estimation (in a real app, this would fetch from an API)
    const exchangeRates = {
      BTC: 55000,
      ETH: 3000,
      // Add more rates as needed
    };
    
    const rate = exchangeRates[formData.currency] || 1;
    const amount = parseFloat(formData.amount) || 0;
    setEstimatedCrypto((amount / rate).toFixed(8));
  }, [formData.currency, formData.amount]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'teamId' && value !== formData.teamId) {
      // When team changes, select it to load its assets
      selectTeam(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Move to confirmation step
    setStep(2);
  };
  
  const executeBuyOrder = async () => {
    try {
      // Call the buyAsset function from context
      // This will create a team transaction requiring approval
      const result = await buyAsset(
        formData.currency, 
        estimatedCrypto, // We buy the crypto amount, not the USD amount
        formData.teamId
      );
      
      if (result) {
        alert("Buy order created successfully. Team approval required.");
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create buy order:", error);
    }
  };
  
  const resetForm = () => {
    setFormData({
      teamId: teams && teams.length > 0 ? teams[0].id : '',
      currency: teamAssets && teamAssets.length > 0 ? teamAssets[0].symbol : 'ETH',
      amount: '',
      paymentMethod: 'bank',
      paymentDetails: ''
    });
    setStep(1);
  };
  
  // Get the selected currency's name
  const getSelectedCurrencyName = () => {
    if (!teamAssets || teamAssets.length === 0) {
      // Default currency names if no team assets loaded
      if (formData.currency === 'BTC') return 'Bitcoin';
      if (formData.currency === 'ETH') return 'Ethereum';
      return formData.currency;
    }
    const asset = teamAssets.find(asset => asset.symbol === formData.currency);
    return asset ? asset.name || asset.symbol : formData.currency;
  };
  
  // Calculate buy fee (simplified example)
  const calculateFee = () => {
    // Simple placeholder calculation - in real world this would be more complex
    return parseFloat(formData.amount || 0) * 0.01; // 1% fee
  };
  
  // Get current team info
  const getCurrentTeam = () => {
    return teams.find(team => team.id === formData.teamId);
  };
  
  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold text-white mb-6">Buy Crypto</h1>
      
      {step === 1 ? (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-white mb-2">Select Team Vault</label>
            <select 
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              required
            >
              {teams && teams.length > 0 ? (
                teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.memberCount} members)
                  </option>
                ))
              ) : (
                <option value="">No teams available</option>
              )}
            </select>
            {activeTeam && (
              <p className="text-gray-400 mt-1 text-sm">
                Team requires approval from all members for transactions
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Select Currency</label>
            <select 
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BTC">Bitcoin (BTC)</option>
              {/* Can add more currencies here */}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">USD Amount to Spend</label>
            <input 
              type="number"
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
              placeholder="0.00"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="10"
              required
            />
            <div className="flex justify-between mt-1">
              <button 
                type="button" 
                className="text-yellow-500 text-sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: "100" }))}
              >
                $100
              </button>
              <button 
                type="button" 
                className="text-yellow-500 text-sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: "500" }))}
              >
                $500
              </button>
              <button 
                type="button" 
                className="text-yellow-500 text-sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: "1000" }))}
              >
                $1,000
              </button>
              <button 
                type="button" 
                className="text-yellow-500 text-sm"
                onClick={() => setFormData(prev => ({ ...prev, amount: "5000" }))}
              >
                $5,000
              </button>
            </div>
            
            <p className="text-gray-400 mt-1 text-sm">
              Minimum purchase: $10
            </p>
            
            {/* Show estimated crypto amount */}
            {parseFloat(formData.amount) > 0 && (
              <div className="mt-2 text-green-400 text-sm">
                Estimated amount: {estimatedCrypto} {formData.currency}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Payment Method</label>
            <select 
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
            >
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="card">Credit/Debit Card</option>
              <option value="crypto">Another Crypto</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-2">Payment Details</label>
            <textarea 
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md"
              placeholder={
                formData.paymentMethod === 'crypto' 
                  ? "Enter source wallet address" 
                  : "Enter your payment details"
              }
              name="paymentDetails"
              value={formData.paymentDetails}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
          
          <Button variant="primary" fullWidth type="submit">
            Continue
          </Button>
          
          <div className="mt-4 text-yellow-500 text-sm">
            <p>⚠️ Note: Buying into a multi-party vault requires approval from all team members.</p>
          </div>
        </form>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg text-white mb-4">Buy Order Confirmation</h2>
          
          <div className="bg-gray-700 p-4 rounded-md mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Team:</span>
              <span className="text-white">
                {getCurrentTeam()?.name || 'Unknown Team'}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Currency:</span>
              <span className="text-white">
                {getSelectedCurrencyName()} ({formData.currency})
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">USD Amount:</span>
              <span className="text-white">${formData.amount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Fee:</span>
              <span className="text-white">${calculateFee().toFixed(2)} (1%)</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Total Cost:</span>
              <span className="text-white">${(parseFloat(formData.amount || 0) + calculateFee()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Crypto Amount:</span>
              <span className="text-white">{estimatedCrypto} {formData.currency}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Payment Method:</span>
              <span className="text-white">{formData.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Details:</span>
              <span className="text-white text-right break-all w-2/3">
                {formData.paymentDetails}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-white mb-2">Approval Process</h3>
            <p className="text-gray-400">
              This transaction will require approval from all team members. 
              After submission, each member will receive a notification to review and approve the transaction.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={executeBuyOrder}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buy;