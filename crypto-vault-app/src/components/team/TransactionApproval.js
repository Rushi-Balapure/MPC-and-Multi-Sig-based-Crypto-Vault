// src/components/team/TransactionApproval.js
import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import ShardUploadModal from './ShardUploadModal';

const TransactionApproval = ({ transaction, teamMembers }) => {
  const { approveTransaction, user } = useVault();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  if (!transaction) return null;

  // Calculate approval progress based on transaction data
  const approvalProgress = (transaction.approvalsReceived / transaction.approvalsNeeded) * 100;

  // Check if current user has already approved
  // Note: The structure may need to be adjusted based on how you store approvals in your actual implementation
  const hasApproved = transaction.approvals ?
    transaction.approvals.some(approver => approver.id === (user?.id || '')) :
    false;

  const handleApprove = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }
    if (hasApproved || transaction.status === 'COMPLETED') return;
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
      setError('');
      const response = await fetch('https://2zfmmwd269.execute-api.ap-south-1.amazonaws.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: transaction.teamId,
          shard_id: user.id,
          shard_value: shardValue
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit shard');
      }

      // After successful shard submission, approve the transaction
      const approverData = {
        id: user?.id,
        email: user?.email,
        timestamp: new Date().toISOString()
      };

      await approveTransaction(transaction.id, approverData);
      setIsModalOpen(false);
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error submitting shard:', error);
      setError(error.message || 'Failed to submit shard. Please try again.');
    }
  };

  const getApproverName = (approverId) => {
    const member = teamMembers.find(m => m.id === approverId);
    return member ? member.name : 'Unknown Member';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Approval Status</h3>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">
            {transaction.approvalsReceived} of {transaction.approvalsNeeded} required approvals
          </span>
          <span className="text-white">
            {Math.round(approvalProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              transaction.status === 'COMPLETED' 
                ? 'bg-green-500' 
                : transaction.status === 'PARTIAL_COMPLETE'
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${approvalProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Approvers</h4>
        {transaction.approvals && transaction.approvals.length > 0 ? (
          <div className="space-y-2">
            {transaction.approvals.map((approver) => (
              <div key={approver.id} className="flex items-center bg-gray-700 p-3 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-white">{getApproverName(approver.id)}</p>
                  <p className="text-gray-400 text-sm">
                    {approver.timestamp ? new Date(approver.timestamp).toLocaleString() : 'No timestamp'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No approvals yet</p>
        )}
      </div>

      {transaction.status === 'PENDING_APPROVAL' && !hasApproved && (
        <button
          onClick={handleApprove}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-md"
        >
          Approve Transaction
        </button>
      )}

      {transaction.status === 'PARTIAL_COMPLETE' && !hasApproved && (
        <button
          onClick={handleApprove}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md"
        >
          Submit Additional Shard
        </button>
      )}

      {(transaction.status === 'PENDING_APPROVAL' || transaction.status === 'PARTIAL_COMPLETE') && hasApproved && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          You have approved this transaction
        </div>
      )}

      {transaction.status === 'COMPLETED' && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          Transaction completed
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded text-center">
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

export default TransactionApproval;