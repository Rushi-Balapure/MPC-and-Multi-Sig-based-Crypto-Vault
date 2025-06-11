// src/components/team/TransactionHistory.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionCard from './TransactionCard';

const TransactionHistory = ({ transactions, teamMembers, status }) => {
  const navigate = useNavigate();
  
  const createNewTransaction = () => {
    navigate('/transactions/create');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          {status === 'pending' ? 'Pending Transactions' : 'Completed Transactions'}
        </h2>
        {status === 'pending' && (
          <button
            onClick={createNewTransaction}
            className="text-yellow-500 hover:text-yellow-400"
          >
            + New Transaction
          </button>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map(transaction => (
            <TransactionCard 
              key={transaction.id}
              transaction={transaction}
              teamMembers={teamMembers}
              showApproveButton={status === 'pending'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            {status === 'pending' 
              ? 'No pending transactions' 
              : 'No completed transactions yet'}
          </p>
          {status === 'pending' && (
            <button
              onClick={createNewTransaction}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
            >
              Create New Transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;