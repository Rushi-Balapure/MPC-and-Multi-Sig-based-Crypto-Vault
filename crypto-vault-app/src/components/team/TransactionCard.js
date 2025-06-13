// src/components/team/TransactionCard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../../context/VaultContext';
import ShardUploadModal from './ShardUploadModal';

const TransactionCard = ({ transaction, teamMembers, showApproveButton = false }) => {
  const { approveTransaction, user } = useVault();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Format date from transaction timestamp
  const formattedDate = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 
                       (transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'Unknown date');
  
  // Calculate approval progress
  const approvalProgress = (transaction.approvalsReceived / transaction.approvalsNeeded) * 100;
  
  // Find initiator name
  // Adapt this based on how transaction initiator is stored in your implementation
  const initiator = transaction.createdBy ? 
    teamMembers.find(member => member.id === transaction.createdBy) : null;
  const initiatorName = initiator ? initiator.name : 'Unknown';
  
  // Check if current user has already approved
  // This may need adjustment based on how you track approvals
  const hasApproved = transaction.approvals ? 
    transaction.approvals.some(approver => approver.id === (user?.id || '')) : 
    false;  // Fallback if approvals array isn't available
  
  const handleApprove = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }
    if (hasApproved) return;
    setError('');
    setIsModalOpen(true);
  };

  const handleShardSubmit = async (shardValue) => {
    if (!user?.id) {
      setError('User not authenticated');
      setIsModalOpen(false);
      return;
    }

    try {
      // After successful shard submission, approve the transaction
      await approveTransaction(transaction.id);
      setIsModalOpen(false);
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error submitting shard:', error);
      setError(error.message || 'Failed to submit shard. Please try again.');
    }
  };
  
  const viewDetails = () => {
    navigate(`/transaction/${transaction.id}`);
  };

  // Convert transaction status from VaultContext format to display format
  const statusDisplay = transaction.status === 'COMPLETED' ? 'Completed' : 'Pending';
  const isPending = transaction.status === 'PENDING_APPROVAL';

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-medium">
              {transaction.amount} {transaction.asset}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-300 truncate max-w-xs">
              {transaction.recipient || 'Internal transaction'}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Initiated by {initiatorName} • {formattedDate}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-block px-2 py-1 rounded text-xs ${
            transaction.status === 'COMPLETED' 
              ? 'bg-green-900/40 text-green-400' 
              : 'bg-yellow-900/40 text-yellow-400'
          }`}>
            {statusDisplay}
          </span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">
            {transaction.approvalsReceived} of {transaction.approvalsNeeded} approvals
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
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={viewDetails}
          className="text-gray-300 hover:text-white text-sm"
        >
          View Details
        </button>
        
        {showApproveButton && isPending && !hasApproved && (
          <button
            onClick={handleApprove}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Approve
          </button>
        )}
        
        {showApproveButton && isPending && hasApproved && (
          <span className="text-green-400 text-sm">Approved</span>
        )}
      </div>

      {error && (
        <div className="mt-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <ShardUploadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError('');
        }}
        onSubmit={handleShardSubmit}
      />
    </div>
  );
};

export default TransactionCard;