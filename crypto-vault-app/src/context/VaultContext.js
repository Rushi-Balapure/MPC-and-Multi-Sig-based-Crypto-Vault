// src/context/VaultContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserAssets, fetchTeamAssets } from '../services/api'; // Assuming these exist
import { useAuthContext } from './AuthContext'; // Import AuthContext

// Create a context for the Vault
const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const { token, user: authUser, isLoggedIn } = useAuthContext(); // Use AuthContext

  // Personal assets owned by the user
  const [personalAssets, setPersonalAssets] = useState([]);
  
  // Teams the user is a part of (with more detailed structure)
  const [teams, setTeams] = useState([]);
  
  // Currently selected team for operations
  const [activeTeam, setActiveTeam] = useState(null);
  
  // Current team's assets if a team is selected
  const [teamAssets, setTeamAssets] = useState([]);
  
  // Pending team invitations
  const [pendingInvitations, setPendingInvitations] = useState([]);
  
  // Transaction history
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  // Pending transactions that need approval from team members
  const [pendingTransactions, setPendingTransactions] = useState([]);

  // Loading states for async operations
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add approval tracking state
  const [memberApprovals, setMemberApprovals] = useState({});

  // Effect to load user data when authenticated
  useEffect(() => {
    if (isLoggedIn && authUser) {
      loadUserData(authUser.id);
    } else {
      // Clear vault data when logged out
      resetVaultData();
    }
  }, [isLoggedIn, authUser]);

  // Load user data including assets, teams, and invitations
  const loadUserData = async (userId) => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPersonalAssets(userId),
        loadUserTeams(userId),
        loadPendingInvitations(authUser.email)
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset vault data on logout
  const resetVaultData = () => {
    setTeams([]);
    setPersonalAssets([]);
    setActiveTeam(null);
    setTeamAssets([]);
    setPendingInvitations([]);
    setTransactionHistory([]);
    setPendingTransactions([]);
  };

  // Load personal assets
  const loadPersonalAssets = async (userId) => {
    try {
      const assets = await fetchUserAssets(userId);
      setPersonalAssets(assets);
    } catch (err) {
      setError('Failed to load personal assets');
    }
  };

  // Load teams the user belongs to
  const loadUserTeams = async (userId) => {
    // API call to fetch teams would happen here
    // Mock data for now
    const mockTeams = [
      { id: 'team1', name: 'Finance Team', memberCount: 3, createdBy: userId },
      { id: 'team2', name: 'Investment Group', memberCount: 5, createdBy: 'otherUser' }
    ];
    setTeams(mockTeams);
  };

  // Load pending team invitations
  const loadPendingInvitations = async (email) => {
    // API call to fetch invitations would happen here
    // Mock data for now
    const mockInvitations = [
      { id: 'inv1', teamId: 'team3', teamName: 'New Project', invitedBy: 'user456' }
    ];
    setPendingInvitations(mockInvitations);
  };

  // Create a new team
  const createTeam = async (teamData) => {
    setIsLoading(true);
    try {
      // API call to create team would happen here
      // teamData would include name, members, etc.
      
      // Mock response
      const newTeam = {
        id: `team-${Date.now()}`,
        name: teamData.name,
        memberCount: teamData.members.length,
        createdBy: authUser.id,
        members: teamData.members,
        createdAt: new Date().toISOString()
      };
      
      setTeams(prevTeams => [...prevTeams, newTeam]);
      setActiveTeam(newTeam);
      setError(null);
      return newTeam;
    } catch (err) {
      setError(err.message || 'Failed to create team');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Select a team to view/manage
  const selectTeam = async (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setActiveTeam(team);
      await loadTeamAssets(teamId);
      await loadTeamTransactions(teamId);
    }
  };

  // Load assets for a specific team
  const loadTeamAssets = async (teamId) => {
    try {
      const assets = await fetchTeamAssets(teamId);
      setTeamAssets(assets);
    } catch (err) {
      setError('Failed to load team assets');
    }
  };

  // Load transaction history for a team
  const loadTeamTransactions = async (teamId) => {
    // API call would happen here
    // Mock data for now
    const mockTransactions = [
      { id: 'tx1', type: 'SEND', amount: '0.5', asset: 'ETH', status: 'COMPLETED', timestamp: '2023-05-10T10:30:00Z' },
      { id: 'tx2', type: 'RECEIVE', amount: '1200', asset: 'USDC', status: 'COMPLETED', timestamp: '2023-05-08T14:22:00Z' }
    ];
    setTransactionHistory(mockTransactions);
    
    const mockPending = [
      { id: 'ptx1', type: 'SEND', amount: '2.3', asset: 'ETH', status: 'PENDING_APPROVAL', approvalsNeeded: 2, approvalsReceived: 1 }
    ];
    setPendingTransactions(mockPending);
  };

  // Respond to a team invitation
  const respondToInvitation = async (invitationId, accept) => {
    setIsLoading(true);
    try {
      // API call to accept/reject invitation would happen here
      
      if (accept) {
        // Mock accepting an invitation
        const invitation = pendingInvitations.find(inv => inv.id === invitationId);
        const newTeam = {
          id: invitation.teamId,
          name: invitation.teamName,
          memberCount: 2, // example
          createdBy: invitation.invitedBy
        };
        setTeams(prevTeams => [...prevTeams, newTeam]);
      }
      
      // Remove invitation from pending list
      setPendingInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== invitationId)
      );
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to process invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new transaction that requires team approval
  const createTeamTransaction = async (transactionData) => {
    setIsLoading(true);
    try {
      // API call to create transaction would happen here
      // transactionData would include type, amount, asset, etc.
      
      // Mock response
      const newTransaction = {
        id: `tx-${Date.now()}`,
        type: transactionData.type,
        amount: transactionData.amount,
        asset: transactionData.asset,
        status: 'PENDING_APPROVAL',
        approvalsNeeded: activeTeam.memberCount, // All members need to approve
        approvalsReceived: 1, // Creator automatically approves
        createdBy: authUser.id,
        createdAt: new Date().toISOString()
      };
      
      setPendingTransactions(prev => [...prev, newTransaction]);
      setError(null);
      return newTransaction;
    } catch (err) {
      setError(err.message || 'Failed to create transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Approve a pending transaction
  const approveTransaction = async (transactionId) => {
    setIsLoading(true);
    try {
      // API call to approve transaction would happen here
      
      // Update the transaction in the list
      setPendingTransactions(prev => 
        prev.map(tx => {
          if (tx.id === transactionId) {
            const updatedTx = {
              ...tx,
              approvalsReceived: tx.approvalsReceived + 1
            };
            
            // If all approvals received, move to history
            if (updatedTx.approvalsReceived >= updatedTx.approvalsNeeded) {
              updatedTx.status = 'COMPLETED';
              setTransactionHistory(prev => [...prev, updatedTx]);
              return null; // Remove from pending
            }
            
            return updatedTx;
          }
          return tx;
        }).filter(Boolean) // Remove null items
      );
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to approve transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Add member to team
  const addTeamMember = async (teamId, memberEmail) => {
    setIsLoading(true);
    try {
      // API call to backend to initiate member addition process
      // This would trigger key resharding and email invitations in your backend
      
      // Mock successful response
      const teamToUpdate = teams.find(team => team.id === teamId);
      if (!teamToUpdate) throw new Error("Team not found");
      
      // Update the team locally with increased member count
      const updatedTeam = {
        ...teamToUpdate,
        memberCount: teamToUpdate.memberCount + 1,
        // In a real implementation, you might add pending member info here
      };
      
      // Update teams state
      setTeams(prevTeams => 
        prevTeams.map(team => team.id === teamId ? updatedTeam : team)
      );
      
      // If this is the active team, update that too
      if (activeTeam && activeTeam.id === teamId) {
        setActiveTeam(updatedTeam);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add team member');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member from team (requires consensus)
  const removeTeamMember = async (teamId, memberId) => {
    setIsLoading(true);
    try {
      // In a real implementation:
      // 1. This would initiate a vote or approval process among team members
      // 2. Backend would handle key resharding after approval
      // 3. Removed member would lose access to team assets
      
      // For now, mock the API call and successful removal
      const teamToUpdate = teams.find(team => team.id === teamId);
      if (!teamToUpdate) throw new Error("Team not found");
      
      // Update the team with decreased member count
      const updatedTeam = {
        ...teamToUpdate,
        memberCount: Math.max(1, teamToUpdate.memberCount - 1), // Ensure at least 1 member
      };
      
      // Update teams state
      setTeams(prevTeams => 
        prevTeams.map(team => team.id === teamId ? updatedTeam : team)
      );
      
      // If this is the active team, update that too
      if (activeTeam && activeTeam.id === teamId) {
        setActiveTeam(updatedTeam);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to remove team member');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Buy crypto asset
  const buyAsset = async (asset, amount, teamId = null) => {
    setIsLoading(true);
    try {
      // Determine if this is a personal or team purchase
      const isTeamPurchase = !!teamId;
      
      if (isTeamPurchase) {
        // For team purchases, we need to create a transaction that requires approval
        const transactionData = {
          type: 'BUY',
          asset,
          amount,
          teamId
        };
        
        // This creates a pending transaction that needs team approval
        return await createTeamTransaction(transactionData);
      } else {
        // Personal purchase can be executed immediately
        // API call to execute purchase would happen here
        
        // Mock response - add the asset to personal assets
        const existingAsset = personalAssets.find(a => a.symbol === asset);
        
        if (existingAsset) {
          // Update existing asset
          setPersonalAssets(prevAssets => 
            prevAssets.map(a => a.symbol === asset 
              ? { ...a, amount: parseFloat(a.amount) + parseFloat(amount) } 
              : a
            )
          );
        } else {
          // Add new asset
          setPersonalAssets(prevAssets => [
            ...prevAssets, 
            { 
              symbol: asset, 
              amount: parseFloat(amount),
              value: parseFloat(amount) * 1000, // Mock value, would be real price in production
              lastUpdated: new Date().toISOString()
            }
          ]);
        }
        
        // Add to transaction history
        const newTransaction = {
          id: `tx-${Date.now()}`,
          type: 'BUY',
          amount,
          asset,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        };
        
        setTransactionHistory(prev => [...prev, newTransaction]);
        setError(null);
        return newTransaction;
      }
    } catch (err) {
      setError(err.message || 'Failed to buy asset');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Sell crypto asset
  const sellAsset = async (asset, amount, teamId = null) => {
    setIsLoading(true);
    try {
      // Determine if this is a personal or team sale
      const isTeamSale = !!teamId;
      
      if (isTeamSale) {
        // For team sales, we need to create a transaction that requires approval
        const transactionData = {
          type: 'SELL',
          asset,
          amount,
          teamId
        };
        
        // This creates a pending transaction that needs team approval
        return await createTeamTransaction(transactionData);
      } else {
        // Personal sale can be executed immediately
        // API call to execute sale would happen here
        
        // Find the asset in personal assets
        const existingAsset = personalAssets.find(a => a.symbol === asset);
        
        // Check if user has enough of the asset
        if (!existingAsset || parseFloat(existingAsset.amount) < parseFloat(amount)) {
          throw new Error("Insufficient balance");
        }
        
        // Update personal assets
        setPersonalAssets(prevAssets => 
          prevAssets.map(a => {
            if (a.symbol === asset) {
              const newAmount = parseFloat(a.amount) - parseFloat(amount);
              // Remove asset completely if balance is zero
              if (newAmount <= 0) return null;
              // Otherwise update amount
              return { ...a, amount: newAmount };
            }
            return a;
          }).filter(Boolean) // Remove null items (zero balance assets)
        );
        
        // Add to transaction history
        const newTransaction = {
          id: `tx-${Date.now()}`,
          type: 'SELL',
          amount,
          asset,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        };
        
        setTransactionHistory(prev => [...prev, newTransaction]);
        setError(null);
        return newTransaction;
      }
    } catch (err) {
      setError(err.message || 'Failed to sell asset');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete team (requires unanimous consent)
  const deleteTeam = async (teamId) => {
    setIsLoading(true);
    try {
      // In a real implementation:
      // 1. This would create a deletion proposal
      // 2. All team members would need to approve
      // 3. Assets would need to be distributed or transferred
      
      // For now, mock the API call and successful deletion
      
      // Remove the team from state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      
      // If this was the active team, reset active team
      if (activeTeam && activeTeam.id === teamId) {
        setActiveTeam(null);
        setTeamAssets([]);
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete team');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer assets between personal account and team vault
  const transferAssets = async (fromType, toType, asset, amount, teamId) => {
    setIsLoading(true);
    try {
      // fromType and toType can be 'personal' or 'team'
      // If toType is 'team', this requires team approval
      
      if (toType === 'team') {
        // Create a team transaction for approval
        const transactionData = {
          type: 'DEPOSIT',
          asset,
          amount,
          teamId,
          fromPersonal: true
        };
        
        return await createTeamTransaction(transactionData);
      } else if (fromType === 'team') {
        // Withdrawing from team to personal requires approval
        const transactionData = {
          type: 'WITHDRAW',
          asset,
          amount,
          teamId,
          toPersonal: true
        };
        
        return await createTeamTransaction(transactionData);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to transfer assets');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberApproval = async (teamId, memberId, shardValue) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate inputs
      if (!teamId || !memberId || !shardValue) {
        throw new Error('Missing required approval parameters');
      }

      const response = await fetch('https://2zfmmwd269.execute-api.ap-south-1.amazonaws.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          shard_id: memberId,
          shard_value: shardValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve member');
      }

      const result = await response.json();

      // Update approval state
      setMemberApprovals(prev => ({
        ...prev,
        [memberId]: {
          approved: true,
          timestamp: new Date().toISOString(),
          teamId
        }
      }));

      // Update team member status if needed
      const updatedTeams = teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            members: team.members.map(member => {
              if (member.id === memberId) {
                return {
                  ...member,
                  approved: true,
                  approvalTimestamp: new Date().toISOString()
                };
              }
              return member;
            })
          };
        }
        return team;
      });

      setTeams(updatedTeams);
      
      // If this was for the active team, update it
      if (activeTeam && activeTeam.id === teamId) {
        setActiveTeam(updatedTeams.find(t => t.id === teamId));
      }

      return result;
    } catch (error) {
      setError(error.message || 'Failed to process approval');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VaultContext.Provider value={{ 
      isAuthenticated: isLoggedIn, // Map from AuthContext
      isLoading,
      error,
      teams,
      activeTeam,
      personalAssets,
      teamAssets,
      pendingInvitations,
      transactionHistory,
      pendingTransactions,
      createTeam,
      selectTeam,
      respondToInvitation,
      createTeamTransaction,
      approveTransaction,
      addTeamMember,
      removeTeamMember,
      buyAsset,
      sellAsset,
      deleteTeam,
      transferAssets,
      memberApprovals,
      handleMemberApproval,
    }}>
      {children}
    </VaultContext.Provider>
  );
};

// Hook to use the Vault context
export const useVault = () => useContext(VaultContext);

export default VaultContext;