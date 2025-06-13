// // src/pages/TeamManagement.js
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useTeam } from '../context/TeamContext';
// import { useAuthContext } from '../context/AuthContext';
// import TeamMembersList from '../components/team/TeamMembersList';
// import TransactionHistory from '../components/team/TransactionHistory';

// const TeamManagement = () => {
//   const {
//     teamState: {
//       teams,
//       currentTeam,
//       transactions,
//       pendingTransactions,
//       completedTransactions,
//       loading,
//       error,
//       userEmail
//     },
//     setUserEmail,
//     fetchUserTeams,
//     switchTeam,
//     deleteTeam,
//     fetchTeamDetails,
//     fetchTeamTransactions,
//     approveTransaction,
//     clearError
//   } = useTeam();

//   const { user, isLoggedIn, isLoading: authLoading } = useAuthContext();
//   const [activeTab, setActiveTab] = useState('members');
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [deleteError, setDeleteError] = useState('');
//   const [initialLoad, setInitialLoad] = useState(true);
//   const [transactionLoading, setTransactionLoading] = useState(false);
//   const navigate = useNavigate();

//   // Get user email from AuthContext
//   const getCurrentUserEmail = () => {
//     return user?.email || user?.['email'] || null;
//   };

//   // Initialize user email and fetch teams on component mount
//   useEffect(() => {
//     const initializeTeamData = async () => {
//       if (authLoading) return;

//       if (!isLoggedIn || !user) {
//         console.error('User not authenticated');
//         setInitialLoad(false);
//         return;
//       }

//       const currentUserEmail = getCurrentUserEmail();
      
//       if (!currentUserEmail) {
//         console.error('No user email found in authenticated user data');
//         setInitialLoad(false);
//         return;
//       }

//       if (!userEmail || userEmail !== currentUserEmail) {
//         setUserEmail(currentUserEmail);
//       }

//       try {
//         await fetchUserTeams(currentUserEmail);
//       } catch (error) {
//         console.error('Failed to fetch teams:', error);
//       } finally {
//         setInitialLoad(false);
//       }
//     };

//     if (initialLoad) {
//       initializeTeamData();
//     }
//   }, [user, isLoggedIn, authLoading, userEmail, setUserEmail, fetchUserTeams, initialLoad]);

//   // Clear any existing errors when component mounts
//   useEffect(() => {
//     if (error) {
//       clearError();
//     }
//   }, [clearError]);

//   // Auto-select first team if no current team is selected
//   useEffect(() => {
//     if (!currentTeam && teams.length > 0 && !loading) {
//       switchTeam(teams[0].teamId);
//     }
//   }, [currentTeam, teams, switchTeam, loading]);

//   // Fetch transactions when current team changes
//   useEffect(() => {
//     const loadTransactions = async () => {
//       if (currentTeam && currentTeam.teamId) {
//         console.log('Loading transactions for team:', currentTeam.teamId);
//         setTransactionLoading(true);
//         try {
//           await fetchTeamTransactions(currentTeam.teamId);
//           console.log('Transactions loaded successfully');
//         } catch (error) {
//           console.error('Failed to load transactions:', error);
//         } finally {
//           setTransactionLoading(false);
//         }
//       }
//     };

//     loadTransactions();
//   }, [currentTeam, fetchTeamTransactions]);

//   const handleTeamSelect = async (teamId) => {
//     console.log('Selecting team:', teamId);
//     await switchTeam(teamId);
//   };

//   const navigateToCreateTeam = () => {
//     navigate('/team/create');
//   };

//   const handleDeleteTeam = async () => {
//     if (!currentTeam) return;
    
//     try {
//       setDeleteError('');
//       await deleteTeam(currentTeam.teamId);
//       setShowDeleteConfirm(false);
//     } catch (err) {
//       setDeleteError(err.message || 'Team deletion failed. All members must consent and team vault must be empty.');
//     }
//   };

//   const handleInitiateKey = async () => {
//     try {
//       const response = await fetch('https://2u7u5x01ek.execute-api.ap-south-1.amazonaws.com/test/', {
//         method: 'GET'
//       });

//       if (response.ok) {
//         const data = await response.json();
//         console.log('Key initiation response:', data);
//         alert('Key initiation successful!');
//       } else {
//         alert('Key initiation failed. Status: ' + response.status);
//       }
//     } catch (error) {
//       console.error('Error initiating key:', error);
//       alert('An error occurred while initiating the key.');
//     }
//   };

//   const handleRefreshTeams = async () => {
//     const currentUserEmail = getCurrentUserEmail();
//     if (currentUserEmail) {
//       await fetchUserTeams(currentUserEmail);
//     }
//   };

//   const handleRefreshTransactions = async () => {
//     if (currentTeam && currentTeam.teamId) {
//       setTransactionLoading(true);
//       try {
//         await fetchTeamTransactions(currentTeam.teamId);
//       } catch (error) {
//         console.error('Failed to refresh transactions:', error);
//       } finally {
//         setTransactionLoading(false);
//       }
//     }
//   };

//   const handleApproveTransaction = async (transactionId) => {
//     const currentUserEmail = getCurrentUserEmail();
//     if (!currentUserEmail) {
//       alert('Unable to get user email for approval');
//       return;
//     }

//     try {
//       await approveTransaction(transactionId, currentUserEmail);
//       alert('Transaction approved successfully!');
//       // Refresh transactions after approval
//       await handleRefreshTransactions();
//     } catch (error) {
//       console.error('Failed to approve transaction:', error);
//       alert('Failed to approve transaction: ' + error.message);
//     }
//   };

//   // Show loading state while auth is loading or initial load
//   if (authLoading || initialLoad || loading) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
//         <p className="text-white">Loading team information...</p>
//       </div>
//     );
//   }

//   // Show authentication error if not logged in
//   if (!isLoggedIn || !user) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6 text-center">
//           <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
//           <p>Please log in to view your team vaults.</p>
//           <button
//             className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
//             onClick={() => navigate('/login')}
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Show error if user is authenticated but no email found
//   if (!getCurrentUserEmail()) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6 text-center">
//           <h2 className="text-xl font-bold mb-2">Email Not Found</h2>
//           <p>Unable to retrieve user email. Please try logging out and logging back in.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {/* Error Display */}
//       {error && (
//         <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
//           <div className="flex justify-between items-center">
//             <span>{error}</span>
//             <button
//               onClick={clearError}
//               className="text-red-300 hover:text-red-100"
//             >
//               ×
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Team List Section */}
//       <div className="mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center gap-4">
//             <h1 className="text-2xl font-bold text-white">Team Vaults</h1>
//             <button
//               onClick={handleRefreshTeams}
//               className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700"
//               title="Refresh teams"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
//               </svg>
//             </button>
//           </div>
//           <button
//             className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md flex items-center"
//             onClick={navigateToCreateTeam}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//             </svg>
//             Create Team Vault
//           </button>
//         </div>

//         {/* Team List */}
//         {teams && teams.length > 0 ? (
//           <div className="bg-gray-800 rounded-lg overflow-hidden">
//             <ul className="divide-y divide-gray-700">
//               {teams.map(team => (
//                 <li
//                   key={team.teamId}
//                   className={`px-4 py-3 cursor-pointer transition-colors ${
//                     currentTeam && currentTeam.teamId === team.teamId 
//                       ? 'bg-gray-700' 
//                       : 'hover:bg-gray-700/50'
//                   }`}
//                   onClick={() => handleTeamSelect(team.teamId)}
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <h3 className="text-lg font-medium text-white">{team.teamName || team.name}</h3>
//                       <p className="text-gray-400 text-sm">
//                         {team.members ? team.members.length : (team.memberCount || 0)} members
//                         {team.status && (
//                           <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
//                             team.status === 'active' ? 'bg-green-500/20 text-green-400' :
//                             team.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
//                             'bg-red-500/20 text-red-400'
//                           }`}>
//                             {team.status}
//                           </span>
//                         )}
//                       </p>
//                     </div>
//                     {currentTeam && currentTeam.teamId === team.teamId && (
//                       <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
//                         Active
//                       </span>
//                     )}
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ) : (
//           <div className="bg-gray-800 rounded-lg p-8 text-center">
//             <p className="text-gray-400 mb-6">You don't have any team vaults yet</p>
//             <button
//               className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
//               onClick={navigateToCreateTeam}
//             >
//               Create Your First Team Vault
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Team Details Section */}
//       {currentTeam && (
//         <div className="mt-8">
//           <div className="flex justify-between items-center mb-6">
//             <div>
//               <h2 className="text-xl font-bold text-white">{currentTeam.teamName || currentTeam.name} Details</h2>
//               <p className="text-gray-400">Team ID: {currentTeam.teamId}</p>
//             </div>
//             <div className="flex gap-4">
//               <button
//                 className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
//                 onClick={handleInitiateKey}
//               >
//                 Initiate Key
//               </button>
//               <button
//                 className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
//                 onClick={() => navigate('/transactions/create')}
//               >
//                 New Transaction
//               </button>
//               <button
//                 onClick={handleRefreshTransactions}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
//                 disabled={transactionLoading}
//                 title="Refresh transactions"
//               >
//                 {transactionLoading ? (
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
//                   </svg>
//                 )}
//                 Refresh
//               </button>
//             </div>
//           </div>

//           <div className="bg-gray-800 rounded-lg overflow-hidden">
//             <div className="flex border-b border-gray-700">
//               <button
//                 className={`py-3 px-6 focus:outline-none transition-colors ${
//                   activeTab === 'members' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
//                 }`}
//                 onClick={() => setActiveTab('members')}
//               >
//                 Members ({currentTeam.members ? currentTeam.members.length : (currentTeam.memberCount || 0)})
//               </button>
//               <button
//                 className={`py-3 px-6 focus:outline-none transition-colors ${
//                   activeTab === 'pending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
//                 }`}
//                 onClick={() => setActiveTab('pending')}
//               >
//                 Pending Transactions ({pendingTransactions ? pendingTransactions.length : 0})
//               </button>
//               <button
//                 className={`py-3 px-6 focus:outline-none transition-colors ${
//                   activeTab === 'completed' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
//                 }`}
//                 onClick={() => setActiveTab('completed')}
//               >
//                 Completed Transactions ({completedTransactions ? completedTransactions.length : 0})
//               </button>
//               <button
//                 className={`py-3 px-6 focus:outline-none ml-auto text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors`}
//                 onClick={() => setShowDeleteConfirm(true)}
//               >
//                 Delete Team
//               </button>
//             </div>
            
//             <div className="p-6">
//               {activeTab === 'members' && (
//                 <TeamMembersList
//                   teamId={currentTeam.teamId}
//                   members={currentTeam.members || []}
//                   memberCount={currentTeam.members ? currentTeam.members.length : (currentTeam.memberCount || 0)}
//                   createdBy={currentTeam.createdBy}
//                 />
//               )}

//               {activeTab === 'pending' && (
//                 <div>
//                   {transactionLoading ? (
//                     <div className="flex items-center justify-center py-8">
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
//                       <span className="text-gray-400">Loading transactions...</span>
//                     </div>
//                   ) : pendingTransactions && pendingTransactions.length > 0 ? (
//                     <TransactionHistory
//                       transactions={pendingTransactions}
//                       teamId={currentTeam.teamId}
//                       status="pending"
//                       onApprove={handleApproveTransaction}
//                       currentUserEmail={getCurrentUserEmail()}
//                       teams={teams}
//                     />
//                   ) : (
//                     <div className="text-center py-8">
//                       <p className="text-gray-400 mb-4">No pending transactions</p>
//                       <button
//                         className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
//                         onClick={() => navigate('/transactions/create')}
//                       >
//                         Create New Transaction
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {activeTab === 'completed' && (
//                 <div>
//                   {transactionLoading ? (
//                     <div className="flex items-center justify-center py-8">
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
//                       <span className="text-gray-400">Loading transactions...</span>
//                     </div>
//                   ) : completedTransactions && completedTransactions.length > 0 ? (
//                     <TransactionHistory
//                       transactions={completedTransactions}
//                       teamId={currentTeam.teamId}
//                       status="completed"
//                       currentUserEmail={getCurrentUserEmail()}
//                     />
//                   ) : (
//                     <div className="text-center py-8">
//                       <p className="text-gray-400">No completed transactions</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Team Confirmation Modal */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
//             <h3 className="text-xl font-bold text-white mb-4">Delete Team?</h3>
//             <p className="text-gray-400 mb-6">
//               This action cannot be undone. All team members must approve this action.
//             </p>
//             {deleteError && (
//               <p className="text-red-400 mb-4">{deleteError}</p>
//             )}
//             <div className="flex justify-end gap-4">
//               <button
//                 className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
//                 onClick={() => {
//                   setShowDeleteConfirm(false);
//                   setDeleteError('');
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 onClick={handleDeleteTeam}
//                 disabled={loading}
//               >
//                 {loading ? 'Deleting...' : 'Delete Team'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeamManagement;

// src/pages/TeamManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useAuthContext } from '../context/AuthContext';
import TeamMembersList from '../components/team/TeamMembersList';
import TransactionHistory from '../components/team/TransactionHistory';

const TeamManagement = () => {
  const {
    teamState: {
      teams,
      currentTeam,
      transactions,
      pendingTransactions,
      completedTransactions,
      loading,
      error,
      userEmail
    },
    setUserEmail,
    fetchUserTeams,
    switchTeam,
    deleteTeam,
    fetchTeamDetails,
    fetchTeamTransactions,
    approveTransaction,
    clearError
  } = useTeam();

  const { user, isLoggedIn, isLoading: authLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('members');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [teamBalance, setTeamBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const navigate = useNavigate();

  // Get user email from AuthContext
  const getCurrentUserEmail = () => {
    return user?.email || user?.['email'] || null;
  };

  // Fetch team balance
  const fetchTeamBalance = async (teamId) => {
    if (!teamId) return;
    
    setBalanceLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`https://your-api-endpoint.com/api/teams/${teamId}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any required headers (e.g., authorization)
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamBalance(data.balance || 0);
      } else {
        console.error('Failed to fetch team balance:', response.status);
        setTeamBalance(0);
      }
    } catch (error) {
      console.error('Error fetching team balance:', error);
      setTeamBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Initialize user email and fetch teams on component mount
  useEffect(() => {
    const initializeTeamData = async () => {
      if (authLoading) return;

      if (!isLoggedIn || !user) {
        console.error('User not authenticated');
        setInitialLoad(false);
        return;
      }

      const currentUserEmail = getCurrentUserEmail();
      
      if (!currentUserEmail) {
        console.error('No user email found in authenticated user data');
        setInitialLoad(false);
        return;
      }

      if (!userEmail || userEmail !== currentUserEmail) {
        setUserEmail(currentUserEmail);
      }

      try {
        await fetchUserTeams(currentUserEmail);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    if (initialLoad) {
      initializeTeamData();
    }
  }, [user, isLoggedIn, authLoading, userEmail, setUserEmail, fetchUserTeams, initialLoad]);

  // Clear any existing errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [clearError]);

  // Auto-select first team if no current team is selected
  useEffect(() => {
    if (!currentTeam && teams.length > 0 && !loading) {
      switchTeam(teams[0].teamId);
    }
  }, [currentTeam, teams, switchTeam, loading]);

  // Fetch transactions and balance when current team changes
  useEffect(() => {
    const loadTeamData = async () => {
      if (currentTeam && currentTeam.teamId) {
        console.log('Loading data for team:', currentTeam.teamId);
        setTransactionLoading(true);
        
        try {
          // Load transactions and balance concurrently
          await Promise.all([
            fetchTeamTransactions(currentTeam.teamId),
            fetchTeamBalance(currentTeam.teamId)
          ]);
          console.log('Team data loaded successfully');
        } catch (error) {
          console.error('Failed to load team data:', error);
        } finally {
          setTransactionLoading(false);
        }
      }
    };

    loadTeamData();
  }, [currentTeam, fetchTeamTransactions]);

  const handleTeamSelect = async (teamId) => {
    console.log('Selecting team:', teamId);
    await switchTeam(teamId);
  };

  const navigateToCreateTeam = () => {
    navigate('/team/create');
  };

  const handleDeleteTeam = async () => {
    if (!currentTeam) return;
    
    try {
      setDeleteError('');
      await deleteTeam(currentTeam.teamId);
      setShowDeleteConfirm(false);
    } catch (err) {
      setDeleteError(err.message || 'Team deletion failed. All members must consent and team vault must be empty.');
    }
  };

  const handleInitiateKey = async () => {
    try {
      const response = await fetch('https://2u7u5x01ek.execute-api.ap-south-1.amazonaws.com/test/', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Key initiation response:', data);
        alert('Key initiation successful!');
      } else {
        alert('Key initiation failed. Status: ' + response.status);
      }
    } catch (error) {
      console.error('Error initiating key:', error);
      alert('An error occurred while initiating the key.');
    }
  };

  const handleRefreshTeams = async () => {
    const currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail) {
      await fetchUserTeams(currentUserEmail);
    }
  };

  const handleRefreshTransactions = async () => {
    if (currentTeam && currentTeam.teamId) {
      setTransactionLoading(true);
      try {
        await Promise.all([
          fetchTeamTransactions(currentTeam.teamId),
          fetchTeamBalance(currentTeam.teamId)
        ]);
      } catch (error) {
        console.error('Failed to refresh team data:', error);
      } finally {
        setTransactionLoading(false);
      }
    }
  };

  const handleApproveTransaction = async (transactionId) => {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
      alert('Unable to get user email for approval');
      return;
    }

    try {
      await approveTransaction(transactionId, currentUserEmail);
      alert('Transaction approved successfully!');
      // Refresh transactions and balance after approval
      await handleRefreshTransactions();
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      alert('Failed to approve transaction: ' + error.message);
    }
  };

  // Format balance for display
  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return '0.00';
    return parseFloat(balance).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  // Show loading state while auth is loading or initial load
  if (authLoading || initialLoad || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-white">Loading team information...</p>
      </div>
    );
  }

  // Show authentication error if not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p>Please log in to view your team vaults.</p>
          <button
            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error if user is authenticated but no email found
  if (!getCurrentUserEmail()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">Email Not Found</h2>
          <p>Unable to retrieve user email. Please try logging out and logging back in.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Team List Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Team Vaults</h1>
            <button
              onClick={handleRefreshTeams}
              className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700"
              title="Refresh teams"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
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
        {teams && teams.length > 0 ? (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-700">
              {teams.map(team => (
                <li
                  key={team.teamId}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    currentTeam && currentTeam.teamId === team.teamId 
                      ? 'bg-gray-700' 
                      : 'hover:bg-gray-700/50'
                  }`}
                  onClick={() => handleTeamSelect(team.teamId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">{team.teamName || team.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {team.members ? team.members.length : (team.memberCount || 0)} members
                        {team.status && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            team.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            team.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {team.status}
                          </span>
                        )}
                      </p>
                    </div>
                    {currentTeam && currentTeam.teamId === team.teamId && (
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
      {currentTeam && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-xl font-bold text-white">{currentTeam.teamName || currentTeam.name} Details</h2>
                <p className="text-gray-400">Team ID: {currentTeam.teamId}</p>
              </div>
              
              {/* Team Balance Display - Styled like a button */}
              <div className="bg-gray-600 text-white px-4 py-2 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {balanceLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  `${formatBalance(teamBalance)} ETH`
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                onClick={handleInitiateKey}
              >
                Initiate Key
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                onClick={() => navigate('/transactions/create')}
              >
                New Transaction
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-700">
              <button
                className={`py-3 px-6 focus:outline-none transition-colors ${
                  activeTab === 'members' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setActiveTab('members')}
              >
                Members ({currentTeam.members ? currentTeam.members.length : (currentTeam.memberCount || 0)})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none transition-colors ${
                  activeTab === 'pending' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending Transactions ({pendingTransactions ? pendingTransactions.length : 0})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none transition-colors ${
                  activeTab === 'completed' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setActiveTab('completed')}
              >
                Completed Transactions ({completedTransactions ? completedTransactions.length : 0})
              </button>
              <button
                className={`py-3 px-6 focus:outline-none ml-auto text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors`}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Team
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'members' && (
                <TeamMembersList
                  teamId={currentTeam.teamId}
                  members={currentTeam.members || []}
                  memberCount={currentTeam.members ? currentTeam.members.length : (currentTeam.memberCount || 0)}
                  createdBy={currentTeam.createdBy}
                />
              )}

              {activeTab === 'pending' && (
                <div>
                  {transactionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
                      <span className="text-gray-400">Loading transactions...</span>
                    </div>
                  ) : pendingTransactions && pendingTransactions.length > 0 ? (
                    <TransactionHistory
                      transactions={pendingTransactions}
                      teamId={currentTeam.teamId}
                      status="pending"
                      onApprove={handleApproveTransaction}
                      currentUserEmail={getCurrentUserEmail()}
                      teams={teams}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No pending transactions</p>
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
                        onClick={() => navigate('/transactions/create')}
                      >
                        Create New Transaction
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'completed' && (
                <div>
                  {transactionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
                      <span className="text-gray-400">Loading transactions...</span>
                    </div>
                  ) : completedTransactions && completedTransactions.length > 0 ? (
                    <TransactionHistory
                      transactions={completedTransactions}
                      teamId={currentTeam.teamId}
                      status="completed"
                      currentUserEmail={getCurrentUserEmail()}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No completed transactions</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteTeam}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;