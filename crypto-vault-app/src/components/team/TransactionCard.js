// src/components/team/TransactionCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext';
import { useWallet } from '../../context/WalletContext';

const TransactionCard = ({ transaction, teamMembers, showApproveButton = false }) => {
  const { approveTransaction } = useTeam();
  const { walletState } = useWallet();
  const navigate = useNavigate();
  
  const formattedDate = new Date(transaction.createdAt).toLocaleString();
  const approvalProgress = (transaction.approvals.length / transaction.requiredApprovals) * 100;
  
  // Find initiator name
  const initiator = teamMembers.find(member => member.id === transaction.initiatedBy.id);
  const initiatorName = initiator ? initiator.name : 'Unknown';
  
  // Check if current user has already approved
  const hasApproved = transaction.approvals.some(
    approver => approver.id === walletState.address
  );
  
  const handleApprove = () => {
    if (hasApproved) return;
    
    approveTransaction(transaction.id, {
      id: walletState.address,
      name: 'Current User', // This would ideally come from a user profile
      timestamp: new Date().toISOString()
    });
  };
  
  const viewDetails = () => {
    navigate(`/transaction/${transaction.id}`);
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-medium">
              {transaction.amount} {transaction.currency}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-300 truncate max-w-xs">
              {transaction.recipient}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Initiated by {initiatorName} • {formattedDate}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-block px-2 py-1 rounded text-xs ${
            transaction.status === 'completed' 
              ? 'bg-green-900/40 text-green-400' 
              : 'bg-yellow-900/40 text-yellow-400'
          }`}>
            {transaction.status === 'completed' ? 'Completed' : 'Pending'}
          </span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">
            {transaction.approvals.length} of {transaction.requiredApprovals} approvals
          </span>
          <span className="text-white">
            {Math.round(approvalProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full" 
            style={{ width: `${approvalProgress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={viewDetails}
          className="text-gray-300 hover:text-white text-sm"
        >
          View Details
        </button>
        
        {showApproveButton && transaction.status === 'pending' && !hasApproved && (
          <button
            onClick={handleApprove}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Approve
          </button>
        )}
        
        {showApproveButton && transaction.status === 'pending' && hasApproved && (
          <span className="text-green-400 text-sm">Approved</span>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;