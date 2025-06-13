// src/pages/TransactionHistory.js
import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import MainLayout from '../components/layout/MainLayout';

const TransactionHistory = () => {
  const { 
    user, 
    teams, 
    activeTeam, 
    selectTeam, 
    transactionHistory, 
    pendingTransactions,
    approveTransaction,
    isLoading
  } = useVault();

  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [assetFilter, setAssetFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all'); // Changed from 'personal' to 'all' to show all transactions initially
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc
  const [uniqueAssets, setUniqueAssets] = useState([]);
  const [localIsLoading, setLocalIsLoading] = useState(true);

  // Load initial data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      setLocalIsLoading(true);
      try {
        // If we have no transactions but the user is authenticated, try to load some
        if (user?.isAuthenticated && transactionHistory.length === 0 && pendingTransactions.length === 0) {
          console.log("User is authenticated, but no transactions found. Loading data...");
          
          // In a real implementation, you'd call your API service here
          // For now, we'll simulate a delay to allow context to potentially load data
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // If you have a specific function to load transaction history, call it here
          // Example: await loadTransactionHistory(user.id);
        }
      } catch (error) {
        console.error("Error loading initial transaction data:", error);
      } finally {
        setLocalIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [user]);

  // Calculate unique assets for filtering
  useEffect(() => {
    const assets = new Set();
    
    // Add from transaction history
    transactionHistory.forEach(tx => {
      if (tx.asset) assets.add(tx.asset);
    });
    
    // Add from pending transactions
    pendingTransactions.forEach(tx => {
      if (tx.asset) assets.add(tx.asset);
    });
    
    setUniqueAssets(Array.from(assets));
    
    // Debug: Log current transaction data
    console.log("Transaction history:", transactionHistory);
    console.log("Pending transactions:", pendingTransactions);
    console.log("Unique assets:", Array.from(assets));
  }, [transactionHistory, pendingTransactions]);

  // Filter and sort transactions
  const getFilteredTransactions = () => {
    // Debug: Log current filter state
    console.log("Current filters:", { filter, assetFilter, teamFilter });
    
    // Combine transactions based on filter
    let transactions = [];
    
    if (filter === 'all' || filter === 'completed') {
      transactions = [...transactions, ...transactionHistory];
    }
    
    if (filter === 'all' || filter === 'pending') {
      transactions = [...transactions, ...pendingTransactions];
    }
    
    // Apply asset filter
    if (assetFilter !== 'all') {
      transactions = transactions.filter(tx => tx.asset === assetFilter);
    }
    
    // Apply team filter
    if (teamFilter !== 'all') {
      if (teamFilter === 'personal') {
        transactions = transactions.filter(tx => !tx.teamId);
      } else {
        transactions = transactions.filter(tx => tx.teamId === teamFilter);
      }
    }
    
    // Apply sorting
    const sortedTransactions = transactions.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      
      switch (sortBy) {
        case 'date-asc':
          return dateA - dateB;
        case 'date-desc':
          return dateB - dateA;
        case 'amount-asc':
          return parseFloat(a.amount) - parseFloat(b.amount);
        case 'amount-desc':
          return parseFloat(b.amount) - parseFloat(a.amount);
        default:
          return dateB - dateA;
      }
    });
    
    // Debug: Log filtered transactions
    console.log("Filtered transactions:", sortedTransactions);
    
    return sortedTransactions;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'SEND':
        return '↑';
      case 'RECEIVE':
        return '↓';
      case 'BUY':
        return '+';
      case 'SELL':
        return '-';
      case 'DEPOSIT':
        return '→';
      case 'WITHDRAW':
        return '←';
      default:
        return '•';
    }
  };

  const handleApproveTransaction = (txId) => {
    approveTransaction(txId);
  };

  // Handle team selection
  const handleTeamChange = async (value) => {
    setTeamFilter(value);
    
    // If a specific team is selected, also select it in the context to load its transactions
    if (value !== 'all' && value !== 'personal') {
      const team = teams.find(t => t.id === value);
      if (team && (!activeTeam || activeTeam.id !== value)) {
        await selectTeam(value);
      }
    }
  };

  const filteredTransactions = getFilteredTransactions();

  // Debug: Check if we're showing data
  const hasNoData = filteredTransactions.length === 0 && !isLoading && !localIsLoading;

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Transaction History</h1>
            <p className="mt-2 text-sm text-gray-700">
              A complete history of all your personal and team transactions.
            </p>
          </div>
        </div>
        
        {/* Debug Information - Remove in production */}
        {hasNoData && (
          <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded">
            <h3 className="font-medium">Debug Information:</h3>
            <p>User authenticated: {user?.isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Transaction history count: {transactionHistory.length}</p>
            <p>Pending transactions count: {pendingTransactions.length}</p>
            <p>Active team: {activeTeam ? activeTeam.name : 'None'}</p>
            <p>Team count: {teams.length}</p>
          </div>
        )}
        
        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="filter"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="pending">Pending Approval</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="assetFilter" className="block text-sm font-medium text-gray-700">Asset</label>
            <select
              id="assetFilter"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
            >
              <option value="all">All Assets</option>
              {uniqueAssets.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="teamFilter" className="block text-sm font-medium text-gray-700">Account</label>
            <select
              id="teamFilter"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={teamFilter}
              onChange={(e) => handleTeamChange(e.target.value)}
            >
              <option value="all">All Accounts</option>
              <option value="personal">Personal</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              id="sortBy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>
        
        {/* Transaction List */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Asset</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Account</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {isLoading || localIsLoading ? (
                      <tr>
                        <td colSpan="7" className="py-4 text-center text-sm text-gray-500">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <span className="mr-2 text-lg">
                                {getTransactionTypeIcon(transaction.type)}
                              </span>
                              <span className="font-medium text-gray-900">{transaction.type}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.asset}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.amount}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(transaction.status)}`}>
                              {transaction.status}
                              {transaction.status === 'PENDING_APPROVAL' && transaction.approvalsReceived && transaction.approvalsNeeded && (
                                <span className="ml-1">
                                  ({transaction.approvalsReceived}/{transaction.approvalsNeeded})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(transaction.timestamp || transaction.createdAt).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {transaction.teamId ?
                              (Array.isArray(teams) && teams.find(t => t.id === transaction.teamId)?.name) || 'Team'
                              : 'Personal'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {transaction.status === 'PENDING_APPROVAL' && (
                              <button
                                onClick={() => handleApproveTransaction(transaction.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              className="ml-4 text-indigo-600 hover:text-indigo-900"
                              onClick={() => {
                                // Navigate to transaction details page
                                // Implementation depends on your routing setup
                                console.log("View transaction details for:", transaction.id);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-4 text-center text-sm text-gray-500">
                          No transactions found matching your filters. Try changing your filter settings or creating a transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TransactionHistory;