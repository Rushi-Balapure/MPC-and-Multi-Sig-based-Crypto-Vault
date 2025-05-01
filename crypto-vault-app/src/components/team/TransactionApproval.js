// src/components/team/TransactionApproval.js
import React from 'react';
import { useTeam } from '../../context/TeamContext';
import { useWallet } from '../../context/WalletContext';

const TransactionApproval = ({ transaction, teamMembers }) => {
  const { approveTransaction } = useTeam();
  const { walletState } = useWallet();
  
  if (!transaction) return null;
  
  const approvalProgress = (transaction.approvals.length / transaction.requiredApprovals) * 100;
  
  // Check if current user has already approved
  const hasApproved = transaction.approvals.some(
    approver => approver.id === walletState.address
  );
  
  const handleApprove = () => {
    if (hasApproved || transaction.status === 'completed') return;
    
    approveTransaction(transaction.id, {
      id: walletState.address,
      name: 'Current User', // This would ideally come from a user profile
      timestamp: new Date().toISOString()
    });
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
            {transaction.approvals.length} of {transaction.requiredApprovals} required approvals
          </span>
          <span className="text-white">
            {Math.round(approvalProgress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${
              transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${approvalProgress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Approvers</h4>
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
      </div>
      
      {transaction.status === 'pending' && !hasApproved && (
        <button
          onClick={handleApprove}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-md"
        >
          Approve Transaction
        </button>
      )}
      
      {transaction.status === 'pending' && hasApproved && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          You have approved this transaction
        </div>
      )}
      
      {transaction.status === 'completed' && (
        <div className="bg-green-900/30 border border-green-500 text-green-400 px-4 py-3 rounded text-center">
          Transaction completed
        </div>
      )}
    </div>
  );
};

export default TransactionApproval;