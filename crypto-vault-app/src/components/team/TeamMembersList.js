// src/components/team/TeamMembersList.js
import React, { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import AddMemberForm from './AddMemberForm';

const TeamMembersList = ({ members, quorum, teamId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
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
          members.map((member) => (
            <div key={member.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">{member.name}</h3>
                <p className="text-gray-400 text-sm">{member.email}</p>
                <span className="inline-block bg-gray-600 text-xs text-gray-300 px-2 py-1 rounded mt-1">
                  {member.role}
                </span>
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
          ))
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