// src/pages/UserProfile.js
import React, { useEffect, useState } from 'react';
import { useVault } from '../context/VaultContext';
import TokenCard from '../components/dashboard/TokenCard';

const UserProfile = () => {
  const { 
    user, 
    teams, 
    personalAssets, 
    transactionHistory,
    isLoading 
  } = useVault();
  
  const [totalValue, setTotalValue] = useState(0);

  // Calculate total portfolio value when personal assets change
  useEffect(() => {
    // Calculate total value of personal assets
    const personalTotal = (personalAssets || []).reduce((sum, asset) => sum + (asset.value || 0), 0);
    
    // Set total value
    setTotalValue(personalTotal);
  }, [personalAssets]);

  // Format currency value to USD
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value);
  };

  // Function to get color based on asset performance (mock data)
  const getAssetTrend = (asset) => {
    const randomTrend = Math.random();
    if (randomTrend > 0.6) return { color: "text-green-500", arrow: "↑", change: "+" + (Math.random() * 5 + 1).toFixed(2) + "%" };
    if (randomTrend > 0.3) return { color: "text-yellow-500", arrow: "→", change: (Math.random() * 1).toFixed(2) + "%" };
    return { color: "text-red-500", arrow: "↓", change: "-" + (Math.random() * 5 + 1).toFixed(2) + "%" };
  };

  // Calculate recent transaction count (last 7 days)
  const getRecentTransactionCount = () => {
    if (!transactionHistory || transactionHistory.length === 0) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return transactionHistory.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= oneWeekAgo;
    }).length;
  };

  // Debug logging - remove this after fixing
  console.log('UserProfile Debug:', { 
    isLoading, 
    user, 
    teams, 
    personalAssets, 
    transactionHistory 
  });

  // Show loading state only when explicitly loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        <p className="ml-4 text-gray-400">Loading user data...</p>
      </div>
    );
  }

  // If not loading but user is null/undefined, show error state
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <p className="text-gray-400 mb-4">Unable to load user data</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {/* User Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-white mr-6 shadow-lg">
              <span className="text-2xl font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.name || "User Profile"}</h1>
              <p className="text-gray-400">{user?.email || "No email provided"}</p>
              <p className="text-gray-400 text-sm mt-1">User ID: {user?.id || '—'}</p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
            <div className="bg-gray-900 px-4 py-2 rounded-md">
              <span className="text-gray-400 text-sm">Account Status</span>
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                <span className="text-white">Active</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Recent Transactions: {getRecentTransactionCount()}
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Portfolio Summary</h2>
          <div className="bg-gray-900 rounded-lg p-6 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Total Balance</span>
              <span className="text-xl font-bold text-white">{formatCurrency(totalValue)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400 mb-1">Personal Assets</h3>
                <p className="text-lg font-semibold text-white">{personalAssets?.length || 0} assets</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400 mb-1">Team Vaults</h3>
                <p className="text-lg font-semibold text-white">{teams?.length || 0} teams</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-sm text-gray-400 mb-1">Security Level</h3>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-white mr-2">Advanced</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-400">Risk Level: Moderate</span>
              <span className="text-yellow-500">70%</span>
            </div>
          </div>
        </div>

        {/* Personal Assets */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Your Personal Assets</h2>
          {personalAssets && personalAssets.length > 0 ? (
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                      <th className="pb-3 pr-4">Asset</th>
                      <th className="pb-3 pr-4">Balance</th>
                      <th className="pb-3 pr-4">Value</th>
                      <th className="pb-3">24h Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalAssets.map((asset, index) => {
                      const trend = getAssetTrend(asset);
                      return (
                        <tr key={asset.symbol} className={`${index !== personalAssets.length - 1 ? 'border-b border-gray-800' : ''}`}>
                          <td className="py-4 pr-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-700 rounded-full mr-3 flex items-center justify-center text-xs font-bold">
                                {asset.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <div className="text-white font-medium">{asset.symbol}</div>
                                <div className="text-gray-500 text-xs">{asset.name || asset.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-white">
                            {asset.amount} {asset.symbol}
                          </td>
                          <td className="py-4 pr-4 text-white">
                            {formatCurrency(asset.value || 0)}
                          </td>
                          <td className={`py-4 ${trend.color}`}>
                            {trend.arrow} {trend.change}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {personalAssets.length > 0 && (
                <div className="flex justify-end mt-4">
                  <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md transition">
                    Manage Assets
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No personal assets in your portfolio yet</p>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition">
                Buy Crypto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;