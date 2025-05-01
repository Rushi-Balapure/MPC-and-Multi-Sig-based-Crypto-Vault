// src/pages/TransactionDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import TransactionApproval from '../components/team/TransactionApproval';

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { teamState } = useTeam();
  const [transaction, setTransaction] = useState(null);
  
  useEffect(() => {
    if (teamState.transactions.length > 0) {
      const found = teamState.transactions.find(tx => tx.id === id);
      setTransaction(found || null);
    }
  }, [id, teamState.transactions]);
  
  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Transaction Not Found</h2>
          <p className="text-gray-400 mb-6">The transaction you're looking for doesn't exist or has been removed</p>
          <button 
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
            onClick={() => navigate('/team')}
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }
  
  const formattedDate = new Date(transaction.createdAt).toLocaleString();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          className="text-gray-400 hover:text-white flex items-center"
          onClick={() => navigate('/team')}
        >
          ← Back to Team
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-white">Transaction Details</h1>
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                transaction.status === 'completed' 
                  ? 'bg-green-900/40 text-green-400' 
                  : 'bg-yellow-900/40 text-yellow-400'
              }`}>
                {transaction.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-400 text-sm">Amount</h3>
                <p className="text-white text-xl font-medium">
                  {transaction.amount} {transaction.currency}
                </p>
              </div>
              
              <div>
                <h3 className="text-gray-400 text-sm">Recipient</h3>
                <p className="text-white break-all">{transaction.recipient}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Created By</h3>
                  <p className="text-white">{transaction.initiatedBy.name || transaction.initiatedBy.id}</p>
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm">Created On</h3>
                  <p className="text-white">{formattedDate}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Transaction ID</h3>
                  <p className="text-white text-sm break-all">{transaction.id}</p>
                </div>
                
                <div>
                  <h3 className="text-gray-400 text-sm">Team ID</h3>
                  <p className="text-white text-sm break-all">{transaction.teamId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <TransactionApproval 
            transaction={transaction}
            teamMembers={teamState.currentTeam?.members || []}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;