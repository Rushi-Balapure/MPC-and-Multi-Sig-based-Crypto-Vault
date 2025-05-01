// src/pages/CreateTransaction.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useWallet } from '../context/WalletContext';

const CreateTransaction = () => {
  const { teamState, initiateTransaction } = useTeam();
  const { walletState } = useWallet();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'ETH',
    recipient: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!formData.recipient.trim()) {
      setError('Recipient address is required');
      return;
    }
    
    if (!teamState.currentTeam) {
      setError('No active team selected');
      return;
    }
    
    if (!walletState.isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    try {
      // Create transaction
      const newTransaction = initiateTransaction({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        recipient: formData.recipient.trim(),
        initiatedBy: {
          id: walletState.address,
          name: 'Current User' // This would ideally come from a user profile
        }
      });
      
      navigate('/team');
    } catch (err) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Available currencies
  const currencies = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI'];

  // Redirect if no team is selected
  if (!teamState.currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-white mb-4">No Team Selected</h2>
        <p className="text-gray-400 mb-6">You need to create or join a team first</p>
        <button 
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
          onClick={() => navigate('/create-team')}
        >
          Create Team
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold text-white mb-6">Create New Transaction</h1>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="mb-4 p-3 bg-gray-700/70 rounded-md">
          <p className="text-gray-300 text-sm">
            Team: <span className="text-white">{teamState.currentTeam.name}</span>
          </p>
          <p className="text-gray-300 text-sm">
            Required Approvals: <span className="text-white">{teamState.currentTeam.quorum}</span>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-between">
              <label htmlFor="amount" className="block text-white mb-2">Amount</label>
              <span className="text-gray-400 text-sm">
                Available: {walletState.balance} {formData.currency}
              </span>
            </div>
            <div className="flex">
              <input
                type="number"
                step="0.000001"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-l-md py-2 px-4 focus:outline-none focus:border-yellow-500"
                placeholder="0.00"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="bg-gray-600 text-white border border-gray-600 rounded-r-md py-2 px-4 focus:outline-none focus:border-yellow-500"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="recipient" className="block text-white mb-2">Recipient Address</label>
            <input
              type="text"
              id="recipient"
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:border-yellow-500"
              placeholder="0x..."
            />
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/team')}
          className="text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateTransaction;