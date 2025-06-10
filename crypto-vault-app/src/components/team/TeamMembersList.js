// src/components/team/TeamMembersList.js
import React, { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
// TODO: Re-enable when MPC member management is implemented
// import AddMemberForm from './AddMemberForm';

const TeamMembersList = ({ 
  members = [], 
  memberCount, 
  teamId, 
  createdBy,
  quorum // This might come from team settings, defaulting to all members for MPC
}) => {
  // TODO: Re-enable when MPC member management is implemented
  const [showAddForm, setShowAddForm] = useState(false);
  const { removeTeamMember, teamState } = useTeam();
  
  // Feature flags for future functionality
  const ENABLE_ADD_MEMBERS = false; // Set to true when MPC member addition is implemented
  const ENABLE_REMOVE_MEMBERS = false; // Set to true when MPC member removal is implemented
  
  // Calculate quorum - for MPC system, typically all members need to approve
  // You can adjust this logic based on your business requirements
  const requiredSigners = quorum || members.length;
  
  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!ENABLE_REMOVE_MEMBERS) {
      alert("Member removal is temporarily disabled. This feature will be available once MPC key redistribution is implemented for enhanced security.");
      return;
    }

    // Future implementation for MPC-compatible member removal
    // This will require:
    // 1. Consensus from existing members
    // 2. Key shard redistribution
    // 3. Smart contract updates
    
    // Prevent removing if it would break the minimum team size
    if (members.length <= 2) {
      alert("Cannot remove member. Team must have at least 2 members.");
      return;
    }
    
    // Prevent removing if it would break quorum requirements
    if (members.length - 1 < requiredSigners) {
      alert(`Cannot remove member. The number of team members cannot be less than the required quorum of ${requiredSigners}.`);
      return;
    }
    
    const memberToRemove = members.find(m => m.email === memberEmail || m.id === memberId);
    const memberName = memberToRemove ? (memberToRemove.name || memberToRemove.email) : 'this member';
    
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team? This will require consensus from all other members and key redistribution.`)) {
      try {
        await removeTeamMember(teamId, memberId);
      } catch (error) {
        alert('Failed to remove team member: ' + error.message);
      }
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
        {ENABLE_ADD_MEMBERS && (
          <button
            className="text-yellow-500 hover:text-yellow-400 disabled:opacity-50"
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={teamState.loading}
          >
            {showAddForm ? 'Cancel' : '+ Add Member'}
          </button>
        )}
        {!ENABLE_ADD_MEMBERS && (
          <span className="text-gray-500 text-sm italic">
            Add Member (Coming Soon)
          </span>
        )}
      </div>

      {ENABLE_ADD_MEMBERS && showAddForm && (
        <div className="mb-6 p-4 bg-gray-700 rounded-md">
          {/* TODO: Re-enable when MPC member management is implemented */}
          {/* <AddMemberForm 
            teamId={teamId} 
            onComplete={() => setShowAddForm(false)} 
          /> */}
          <div className="text-center py-4">
            <p className="text-gray-400">MPC-compatible member addition coming soon...</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {members && members.length > 0 ? (
          members.map((member, index) => {
            // Handle different member data structures
            const memberEmail = member.email || member.memberEmail;
            const memberName = member.name || member.memberName || memberEmail?.split('@')[0];
            const memberRole = member.role || (member.email === createdBy ? 'creator' : 'member');
            const memberId = member.id || member.memberId || memberEmail;
            
            return (
              <div key={memberId || index} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium">{memberName}</h3>
                  <p className="text-gray-400 text-sm">{memberEmail}</p>
                  <div className="flex items-center mt-2">
                    <span className="inline-block bg-gray-600 text-xs text-gray-300 px-2 py-1 rounded">
                      {memberRole}
                    </span>
                    {memberRole === 'creator' && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded ml-2">
                        Team Creator
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {ENABLE_REMOVE_MEMBERS && memberRole !== 'creator' && (
                    <button
                      className="text-red-400 hover:text-red-300 ml-4 disabled:opacity-50"
                      onClick={() => handleRemoveMember(memberId, memberEmail)}
                      disabled={teamState.loading}
                    >
                      Remove
                    </button>
                  )}
                  {!ENABLE_REMOVE_MEMBERS && memberRole !== 'creator' && (
                    <span className="text-gray-500 text-sm italic ml-4">
                      MPC Protected
                    </span>
                  )}
                  {memberRole === 'creator' && (
                    <span className="text-gray-500 text-sm italic ml-4">
                      Team Creator
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No team members found.</p>
            <p className="text-gray-500 text-sm mt-2">
              Team members will appear here once they accept their invitations.
            </p>
          </div>
        )}
      </div>
      
      {/* MPC Approval Requirements Info */}
      <div className="mt-6 p-4 bg-gray-700 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">MPC Security Model</h3>
            <p className="text-gray-400 text-sm">
              All {members.length} team members must approve each transaction using their key shards
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Multi-Party Computation ensures no single member can initiate transactions alone
            </p>
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
            {members.length} of {members.length} Required
          </div>
        </div>
      </div>

      {/* MPC Security Notice */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-300">MPC Vault Security</h4>
            <div className="mt-1 text-sm text-blue-200">
              Member management features are being developed with enhanced MPC security. 
              Future updates will support secure member addition/removal with consensus-based key redistribution.
            </div>
          </div>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-md p-3">
          <div className="text-gray-400 text-sm">Total Members</div>
          <div className="text-white text-lg font-medium">{members.length}</div>
        </div>
        <div className="bg-gray-700 rounded-md p-3">
          <div className="text-gray-400 text-sm">Security Level</div>
          <div className="text-green-400 text-lg font-medium">MPC Protected</div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembersList;