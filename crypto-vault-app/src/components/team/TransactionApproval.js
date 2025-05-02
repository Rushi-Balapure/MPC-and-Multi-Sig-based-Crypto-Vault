// src/components/team/TransactionApproval.js
import React from 'react';
import { useVault } from '../../context/VaultContext';

const TransactionApproval = ({ transaction, teamMembers }) => {
  const { approveTransaction, user } = useVault();
  
  if (!transaction) return null;
  
  // Calculate approval progress based on transaction data
  const approvalProgress = (transaction.approvalsReceived / transaction.approvalsNeeded) * 100;
  
  // Check if current user has already approved
  // Note: The structure may need to be adjusted based on how you store approvals in your actual implementation
  const hasApproved = transaction.approvals ? 
    transaction.approvals.some(approver => approver.id === user.id) : 
    false;
  
  const handleApprove = async () => {
    if (hasApproved || transaction.status === 'COMPLETED') return;
    
    // Use the VaultContext's approveTransaction method
    await approveTransaction(transaction.id);
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
              transaction.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'
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
      
      {transaction.status === 'PENDING_APPROVAL' && hasApproved && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          You have approved this transaction
        </div>
      )}
      
      {transaction.status === 'COMPLETED' && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          Transaction completed
        </div>
      )}
    </div>
  );
};

export default TransactionApproval;