// src/components/team/TeamMembersList.js
import React, { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import AddMemberForm from './AddMemberForm';

const TeamMembersList = ({ members, quorum, teamId, onApprove, approvalStatus }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [shardValues, setShardValues] = useState({});
  const { removeTeamMember } = useTeam();

  const handleRemoveMember = (memberId) => {
    if (members.length <= quorum) {
      alert("Cannot remove member. The number of team members cannot be less than the required quorum.");
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeTeamMember(teamId, memberId);
    }
  };

  const handleShardValueChange = (memberId, value) => {
    setShardValues(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const handleApprove = async (memberId) => {
    const shardValue = shardValues[memberId];
    if (!shardValue) {
      alert('Please enter a shard value');
      return;
    }

    try {
      await onApprove(memberId, shardValue);
      // Clear the shard value after successful approval
      setShardValues(prev => ({
        ...prev,
        [memberId]: ''
      }));
    } catch (error) {
      // Error will be handled by the VaultContext
      console.error('Approval failed:', error);
    }
  };

  const getMemberApprovalStatus = (memberId) => {
    const status = approvalStatus[memberId];
    if (!status) return { approved: false, timestamp: null };
    return status;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Team Members</h2>
        <button
          className="text-yellow-500 hover:text-yellow-400"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-700 rounded-md">
          <AddMemberForm 
            teamId={teamId} 
            onComplete={() => setShowAddForm(false)} 
          />
        </div>
      )}

      <div className="space-y-4">
        {members.length > 0 ? (
          members.map((member) => {
            const memberStatus = getMemberApprovalStatus(member.id);
            return (
              <div key={member.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium">{member.name}</h3>
                    <p className="text-gray-400 text-sm">{member.email}</p>
                    <span className="inline-block bg-gray-600 text-xs text-gray-300 px-2 py-1 rounded mt-1">
                      {member.role}
                    </span>
                    {memberStatus.approved && (
                      <span className="inline-block bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded ml-2">
                        Approved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {member.role !== 'admin' && (
                      <button
                        className="text-red-400 hover:text-red-300 ml-4"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Approval Section */}
                {!memberStatus.approved && (
                  <div className="mt-4 border-t border-gray-600 pt-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        placeholder="Enter shard value"
                        value={shardValues[member.id] || ''}
                        onChange={(e) => handleShardValueChange(member.id, e.target.value)}
                        className="bg-gray-800 text-white px-3 py-2 rounded-md flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <button
                        onClick={() => handleApprove(member.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )}

                {memberStatus.timestamp && (
                  <p className="text-gray-400 text-sm mt-2">
                    Approved at: {new Date(memberStatus.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-400">No team members found.</p>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-gray-700 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">Approval Requirement</h3>
            <p className="text-gray-400 text-sm">
              {quorum} of {members.length} team members must approve each transaction
            </p>
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
            {quorum} Signers Required
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersList;