// src/components/team/TransactionHistory.js
import React, { useState, useEffect } from 'react';
import { useTeam } from '../../context/TeamContext';
import { useAuthContext } from '../../context/AuthContext';

const TransactionHistory = ({
  transactions = [],
  teamId = null,
  status = 'pending',
  onApprove = () => {},
  currentUserEmail = '',
  teams = []
}) => {
  const { user } = useAuthContext();
  const { approveTransaction } = useTeam();
  const [filter, setFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [uniqueAssets, setUniqueAssets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const assets = new Set();
    if (Array.isArray(transactions)) {
      transactions.forEach(tx => {
        if (tx?.asset) assets.add(tx.asset);
      });
    }
    setUniqueAssets(Array.from(assets));
  }, [transactions]);

  const handleApprove = async (transaction) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError('');
      const approverData = {
        email: user.email || user['custom:email'],
        teamId: transaction.teamId,
        transactionId: transaction.transactionId
      };

      console.log('Approving transaction with data:', approverData);
      await approveTransaction(transaction.transactionId, approverData);
      
      // Call the parent's onApprove callback if provided
      if (typeof onApprove === 'function') {
        onApprove(transaction.transactionId);
      }
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      setError(error.message || 'Failed to approve transaction');
    }
  };

  const getTeamName = (teamId) => {
    const team = Array.isArray(teams) ? teams.find(t => t?.teamId === teamId) : null;
    return team?.teamName || 'Unknown Team';
  };

  const getFilteredTransactions = () => {
    let txs = Array.isArray(transactions) ? [...transactions] : [];

    if (assetFilter !== 'all') {
      txs = txs.filter(tx => tx?.asset === assetFilter);
    }

    txs.sort((a, b) => {
      const dateA = new Date(a?.timestamp || a?.createdAt || 0);
      const dateB = new Date(b?.timestamp || b?.createdAt || 0);

      switch (sortBy) {
        case 'date-asc': return dateA - dateB;
        case 'date-desc': return dateB - dateA;
        case 'amount-asc': return parseFloat(a?.amount || 0) - parseFloat(b?.amount || 0);
        case 'amount-desc': return parseFloat(b?.amount || 0) - parseFloat(a?.amount || 0);
        default: return dateB - dateA;
      }
    });

    return txs;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PARTIAL_COMPLETE': return 'bg-blue-100 text-blue-800';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'SEND': return '↑';
      case 'RECEIVE': return '↓';
      case 'BUY': return '+';
      case 'SELL': return '-';
      case 'DEPOSIT': return '→';
      case 'WITHDRAW': return '←';
      default: return '•';
    }
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div>
      <div className="flex gap-4 flex-wrap mb-4">
        <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} className="border p-2 rounded">
          <option value="all">All Assets</option>
          {uniqueAssets.map(asset => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border p-2 rounded">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Amount High to Low</option>
          <option value="amount-asc">Amount Low to High</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {filteredTransactions.map(tx => (
        <div key={tx.id} className="p-4 border rounded shadow-sm flex justify-between items-center mb-4">
          <div>
            <div className="font-medium">{getTransactionTypeIcon(tx.type)} {tx.asset}</div>
            <div className="text-sm text-gray-600">Amount: {tx.amount}</div>
            <div className="text-sm text-gray-500">{new Date(tx.timestamp || tx.createdAt).toLocaleString()}</div>
            <div className="text-sm text-gray-700">Team: {getTeamName(tx.teamId)}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded ${getStatusBadgeClass(tx.status)}`}>
              {tx.status === 'PARTIAL_COMPLETE' ? 'Partially Complete' : tx.status}
            </div>
            {(tx.status === 'PENDING_APPROVAL' || tx.status === 'PARTIAL_COMPLETE') && (
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleApprove(tx)}
              >
                Approve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
