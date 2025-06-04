// src/pages/TeamManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import TeamMembersList from '../components/team/TeamMembersList';
import TransactionHistory from '../components/team/TransactionHistory';

const TeamManagement = () => {
  const {
    activeTeam,
    pendingTransactions,
    transactionHistory,
    selectTeam,
    teams,
    deleteTeam,
    isLoading,
    handleMemberApproval,
    memberApprovals
  } = useVault();

  const [activeTab, setActiveTab] = useState('members');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If no active team but teams exist, select the first one
    if (!activeTeam && teams.length > 0) {
      selectTeam(teams[0].id);
    }
  }, [activeTeam, teams, selectTeam]);

  const handleTeamSelect = (teamId) => {
    selectTeam(teamId);
  };

  const handleApproval = async (memberId, shardValue) => {
    if (!activeTeam) {
      console.error('No active team selected');
      return;
    }

    try {
      await handleMemberApproval(activeTeam.id, memberId, shardValue);
    } catch (error) {
      console.error('Approval failed:', error);
      // Error will be handled by the VaultContext and displayed in the UI
    }
  };

  const navigateToCreateTeam = () => {
    // Navigate to your CreateTeam component - update this path to match your actual routing
    navigate('/team/create'); // Update this path to match your routing configuration
  };

  const handleDeleteTeam = async () => {
    try {
      const result = await deleteTeam(activeTeam.id);
      if (result) {
        setShowDeleteConfirm(false);
        // Will automatically select another team from the useEffect
      } else {
        setDeleteError('Team deletion failed. All members must consent and team vault must be empty.');
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete team');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-white">Loading team information...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Team List Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Team Vaults</h1>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md flex items-center"
            onClick={navigateToCreateTeam}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Team Vault
          </button>
        </div>

        {/* Team List */}
        {teams.length > 0 ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-700">
              {teams.map(team => (
                <li
                  key={team.id}
                  className={`px-4 py-3 cursor-pointer ${activeTeam && activeTeam.id === team.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">{team.name}</h3>
                      <p className="text-gray-400 text-sm">{team.memberCount || 0} members</p>
                    </div>
                    {activeTeam && activeTeam.id === team.id && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-6">You don't have any team vaults yet</p>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
              onClick={navigateToCreateTeam}
            >
              Create Your First Team Vault
            </button>
          </div>
        )}
      </div>

      {/* Team Details Section */}
      {activeTeam && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{activeTeam.name} Details</h2>
              <p className="text-gray-400">Team ID: {activeTeam.id}</p>
            </div>
            <div className="flex gap-4">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                onClick={async () => {
                  try {
                    const response = await fetch('https://2u7u5x01ek.execute-api.ap-south-1.amazonaws.com/test/', {
                      method: 'GET'
                    });

                    if (response.ok) {
                      const data = await response.json();
                      console.log('API Response:', data);
                      alert('GET request successful!');
                    } else {
                      alert('GET request failed. Status: ' + response.status);
                    }
                  } catch (error) {
                    console.error('Error fetching data:', error);
                    alert('An error occurred while making the request.');
                  }
                }}
              >
                Initiate Key
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                onClick={() => navigate('/create-transaction')}
              >
                New Transaction
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-700">
              <button
                className={`py-3 px-6 focus:outline-none ${activeTab === 'members' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                onClick={() => setActiveTab('members')}
              >
                Members ({activeTeam.memberCount || 0})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none ${activeTab === 'pending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Transactions ({pendingTransactions.length})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none ${activeTab === 'completed' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                onClick={() => setActiveTab('completed')}
              >
                Completed Transactions ({transactionHistory.length})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none ml-auto text-red-400 hover:bg-red-900/30 hover:text-red-300`}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Team
              </button>
            </div>
            <div className="p-6">
              {activeTab === 'members' && (
                <TeamMembersList
                  teamId={activeTeam.id}
                  members={activeTeam.members || []}
                  memberCount={activeTeam.memberCount || 0}
                  createdBy={activeTeam.createdBy}
                  onApprove={handleApproval}
                  approvalStatus={memberApprovals}
                />
              )}

              {activeTab === 'pending' && (
                <TransactionHistory
                  transactions={pendingTransactions}
                  teamId={activeTeam.id}
                  status="pending"
                />
              )}

              {activeTab === 'completed' && (
                <TransactionHistory
                  transactions={transactionHistory}
                  teamId={activeTeam.id}
                  status="completed"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Team?</h3>
            <p className="text-gray-400 mb-6">
              This action cannot be undone. All team members must approve this action.
            </p>
            {deleteError && (
              <p className="text-red-400 mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-400 hover:text-white"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={handleDeleteTeam}
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;