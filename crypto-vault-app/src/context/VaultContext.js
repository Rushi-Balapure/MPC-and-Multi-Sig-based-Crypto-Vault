// src/context/VaultContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { useTeam } from './TeamContext';

// Create a context for the Vault
const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const { token, user: authUser, isLoggedIn, checkAndRefreshSession } = useAuthContext();
  
  // Get team data from TeamContext to avoid duplication
  const { 
    teamState, 
    fetchAllTeams, 
    createTeam: createTeamInContext,
    switchTeam,
    addTeamMember: addTeamMemberInContext,
    removeTeamMember: removeTeamMemberInContext,
    deleteTeam: deleteTeamInContext,
    fetchTeamDetails,
    initiateTransaction,
    approveTransaction,
    clearError: clearTeamError,
    refreshTeams
  } = useTeam();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  // Personal assets owned by the user - initialize as empty array
  const [personalAssets, setPersonalAssets] = useState([]);
  
  // Current team's assets if a team is selected - initialize as empty array
  const [teamAssets, setTeamAssets] = useState([]);
  
  // Pending team invitations - initialize as empty array
  const [pendingInvitations, setPendingInvitations] = useState([]);
  
  // Transaction history - initialize as empty array
  const [transactionHistory, setTransactionHistory] = useState([]);

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
      resetVaultData();
    }
  }, [isLoggedIn, authUser]);

  // Effect to handle session expiry
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Check and refresh session when tab becomes visible
        const isValid = await checkAndRefreshSession();
        if (!isValid) {
          resetVaultData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndRefreshSession]);

  // Load user data including assets, teams, and invitations
  const loadUserData = async (userId) => {
    if (!token) {
      setError('No valid authentication token');
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([
        loadPersonalAssets(userId),
        loadPendingInvitations(authUser?.email || '')
      ]);
      
      // Refresh teams data from TeamContext
      await fetchAllTeams();
      
      setError(null);
    } catch (err) {
      console.error('❌ Error loading user data:', err);
      setError('Failed to load user data');
      // If error is due to invalid token, try to refresh session
      if (err.message.includes('token') || err.message.includes('unauthorized')) {
        const isValid = await checkAndRefreshSession();
        if (isValid) {
          // Retry loading data after successful refresh
          await loadUserData(userId);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset vault data on logout or session expiry
  const resetVaultData = () => {
    setPersonalAssets([]);
    setTeamAssets([]);
    setPendingInvitations([]);
    setTransactionHistory([]);
    setMemberApprovals({});
    setError(null);
  };

  // Load personal assets with authentication
  const loadPersonalAssets = async (userId) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/assets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalAssets(Array.isArray(data.assets) ? data.assets : []);
      } else {
        // Fallback to mock data if endpoint doesn't exist yet
        console.log('⚠️ Personal assets endpoint not ready, using mock data');
        setPersonalAssets([
          { symbol: 'BTC', amount: 0.025, value: 750, lastUpdated: new Date().toISOString() },
          { symbol: 'ETH', amount: 1.5, value: 2400, lastUpdated: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('❌ Error loading personal assets:', err);
      setError('Failed to load personal assets');
      setPersonalAssets([]); // Ensure it's always an array
    }
  };

  // Load pending invitations with authentication
  const loadPendingInvitations = async (email) => {
    if (!email) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/invitations/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(Array.isArray(data.invitations) ? data.invitations : []);
      } else {
        // Fallback to mock data if endpoint doesn't exist yet
        console.log('⚠️ Invitations endpoint not ready, using mock data');
        setPendingInvitations([
          { id: 'inv1', teamId: 'team3', teamName: 'New Project', invitedBy: 'user456' }
        ]);
      }
    } catch (err) {
      console.error('❌ Error loading invitations:', err);
      setError('Failed to load invitations');
      setPendingInvitations([]); // Ensure it's always an array
      throw err;
    }
  };

  // Use TeamContext's createTeam function
  const createTeam = async (teamData) => {
    try {
      const result = await createTeamInContext(teamData);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create team');
      return null;
    }
  };

  // Select a team to view/manage (use TeamContext's switchTeam)
  const selectTeam = async (teamId) => {
    try {
      await switchTeam(teamId);
      await loadTeamAssets(teamId);
    } catch (err) {
      setError('Failed to select team');
    }
  };

  // Load assets for a specific team
  const loadTeamAssets = async (teamId) => {
    if (!teamId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/assets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamAssets(Array.isArray(data.assets) ? data.assets : []);
      } else {
        // Fallback to mock data if endpoint doesn't exist yet
        console.log('⚠️ Team assets endpoint not ready, using mock data');
        setTeamAssets([
          { symbol: 'ETH', amount: 5.0, value: 8000, lastUpdated: new Date().toISOString() },
          { symbol: 'USDC', amount: 10000, value: 10000, lastUpdated: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('❌ Error loading team assets:', err);
      setError('Failed to load team assets');
      setTeamAssets([]); // Ensure it's always an array
    }
  };

  // Respond to a team invitation
  const respondToInvitation = async (invitationId, accept) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accept })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (accept) {
          // Refresh teams list to include newly joined team
          await fetchAllTeams();
        }
        
        // Remove invitation from pending list
        setPendingInvitations(prevInvitations => 
          (prevInvitations || []).filter(inv => inv.id !== invitationId)
        );
        
        setError(null);
        return data;
      } else {
        throw new Error('Failed to process invitation');
      }
    } catch (err) {
      console.error('❌ Error responding to invitation:', err);
      setError(err.message || 'Failed to process invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new transaction that requires team approval
  const createTeamTransaction = async (transactionData) => {
    if (!isLoggedIn || !authUser) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...transactionData,
          teamId: teamState?.currentTeam?.teamId,
          createdBy: authUser.id
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      
      const newTransaction = await response.json();
      setError(null);
      return newTransaction;
    } catch (err) {
      setError(err.message || 'Failed to create transaction');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Buy crypto asset
  const buyAsset = async (asset, amount, teamId = null) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset,
          amount: parseFloat(amount),
          teamId,
          userId: authUser?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh appropriate assets
        if (teamId) {
          await loadTeamAssets(teamId);
        } else {
          await loadPersonalAssets(authUser?.id);
        }
        
        // Add to transaction history
        const newTransaction = {
          id: data.transactionId || `tx-${Date.now()}`,
          type: 'BUY',
          amount,
          asset,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          teamId
        };
        
        setTransactionHistory(prev => [...(prev || []), newTransaction]);
        setError(null);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to buy asset');
      }
    } catch (err) {
      console.error('❌ Error buying asset:', err);
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
      const response = await fetch(`${API_BASE_URL}/api/assets/sell`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset,
          amount: parseFloat(amount),
          teamId,
          userId: authUser?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh appropriate assets
        if (teamId) {
          await loadTeamAssets(teamId);
        } else {
          await loadPersonalAssets(authUser?.id);
        }
        
        // Add to transaction history
        const newTransaction = {
          id: data.transactionId || `tx-${Date.now()}`,
          type: 'SELL',
          amount,
          asset,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          teamId
        };
        
        setTransactionHistory(prev => [...(prev || []), newTransaction]);
        setError(null);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sell asset');
      }
    } catch (err) {
      console.error('❌ Error selling asset:', err);
      setError(err.message || 'Failed to sell asset');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer assets between personal account and team vault
  const transferAssets = async (fromType, toType, asset, amount, teamId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromType, // 'personal' or 'team'
          toType,   // 'personal' or 'team'
          asset,
          amount: parseFloat(amount),
          teamId,
          userId: authUser?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh both personal and team assets
        await loadPersonalAssets(authUser?.id);
        if (teamId) {
          await loadTeamAssets(teamId);
        }
        
        // Add to transaction history
        const newTransaction = {
          id: data.transactionId || `tx-${Date.now()}`,
          type: 'TRANSFER',
          amount,
          asset,
          status: data.requiresApproval ? 'PENDING_APPROVAL' : 'COMPLETED',
          timestamp: new Date().toISOString(),
          fromType,
          toType,
          teamId
        };
        
        setTransactionHistory(prev => [...(prev || []), newTransaction]);
        setError(null);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer assets');
      }
    } catch (err) {
      console.error('❌ Error transferring assets:', err);
      setError(err.message || 'Failed to transfer assets');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
    if (clearTeamError) clearTeamError(); // Also clear team errors
  };

  // Refresh all data
  const refreshData = async () => {
    if (isLoggedIn && authUser) {
      await loadUserData(authUser.id);
      if (refreshTeams) await refreshTeams();
    }
  };

  return (
    <VaultContext.Provider value={{ 
      // Authentication state
      isAuthenticated: isLoggedIn,
      user: authUser,
      
      // Loading and error states
      isLoading: isLoading || (teamState?.loading || false),
      error: error || teamState?.error || null,
      
      // Team data (from TeamContext) - with safe defaults
      teams: teamState?.teams || [],
      activeTeam: teamState?.currentTeam || null,
      pendingTeamTransactions: teamState?.pendingTransactions || [],
      completedTeamTransactions: teamState?.completedTransactions || [],
      
      // Asset data - guaranteed to be arrays
      personalAssets: personalAssets || [],
      teamAssets: teamAssets || [],
      
      // Invitations - guaranteed to be array
      pendingInvitations: pendingInvitations || [],
      
      // Transaction history - guaranteed to be array
      transactionHistory: transactionHistory || [],
      
      // Team operations
      createTeam,
      selectTeam,
      addTeamMember: addTeamMemberInContext,
      removeTeamMember: removeTeamMemberInContext,
      deleteTeam: deleteTeamInContext,
      fetchTeamDetails,
      initiateTransaction,
      approveTransaction,
      
      // Invitation operations
      respondToInvitation,
      
      // Asset operations
      buyAsset,
      sellAsset,
      transferAssets,
      
      // Transaction operations
      createTeamTransaction,
      
      // Utility functions
      clearError,
      refreshData,
      refreshTeams,
      
      // Additional state
      memberApprovals
    }}>
      {children}
    </VaultContext.Provider>
  );
};

// Hook to use the Vault context
export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};

export default VaultContext;