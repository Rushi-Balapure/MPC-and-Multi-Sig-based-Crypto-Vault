// src/context/TeamContext.js
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuthContext } from './AuthContext';

// Action types
const TEAM_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TEAMS: 'SET_TEAMS',
  SET_CURRENT_TEAM: 'SET_CURRENT_TEAM',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_USER_EMAIL: 'SET_USER_EMAIL',
  RESET_STATE: 'RESET_STATE'
};

// Initial state
const initialState = {
  teams: [],
  currentTeam: null,
  transactions: [],
  pendingTransactions: [],
  completedTransactions: [],
  userEmail: null,
  loading: false,
  error: null
};

// Reducer for better state management
const teamReducer = (state, action) => {
  switch (action.type) {
    case TEAM_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case TEAM_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case TEAM_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case TEAM_ACTIONS.SET_TEAMS:
      return { ...state, teams: action.payload, loading: false };
    
    case TEAM_ACTIONS.SET_CURRENT_TEAM:
      return { ...state, currentTeam: action.payload };
    
    case TEAM_ACTIONS.SET_TRANSACTIONS:
      return { 
        ...state, 
        transactions: action.payload.all || [],
        pendingTransactions: action.payload.pending || [],
        completedTransactions: action.payload.completed || []
      };
    
    case TEAM_ACTIONS.SET_USER_EMAIL:
      return { ...state, userEmail: action.payload };
    
    case TEAM_ACTIONS.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teamState, dispatch] = useReducer(teamReducer, initialState);
  const { token, user, isLoggedIn } = useAuthContext();

  const API_BASE_URL = 'http://localhost:5001';

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }, [token]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: TEAM_ACTIONS.CLEAR_ERROR });
  }, []);

  // Set user email
  const setUserEmail = useCallback((email) => {
    dispatch({ type: TEAM_ACTIONS.SET_USER_EMAIL, payload: email });
  }, []);

  // Get user email - prioritize context state, then AuthContext
  const getUserEmail = useCallback(() => {
    return teamState.userEmail || user?.email || user?.['custom:email'] || null;
  }, [teamState.userEmail, user]);

  // Fetch teams for a user
  const fetchUserTeams = useCallback(async (userEmail = null) => {
    const emailToUse = userEmail || getUserEmail();
    
    if (!emailToUse) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'User email is required to fetch teams' });
      return [];
    }

    if (!token) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'Authentication required' });
      return [];
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      console.log('🔄 Fetching teams for user:', emailToUse);
      
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/teams/user/${encodeURIComponent(emailToUse)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch teams: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedTeams = Array.isArray(data.teams) ? data.teams : [];
      
      console.log('✅ Teams fetched successfully:', fetchedTeams);

      dispatch({ type: TEAM_ACTIONS.SET_TEAMS, payload: fetchedTeams });

      // Set current team if none selected and teams exist
      if (!teamState.currentTeam && fetchedTeams.length > 0) {
        const firstTeam = fetchedTeams[0];
        dispatch({ type: TEAM_ACTIONS.SET_CURRENT_TEAM, payload: firstTeam });
        // Fetch transactions for the first team
        await fetchTeamTransactions(firstTeam.teamId);
      }

      return fetchedTeams;
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch teams' 
      });
      return [];
    }
  }, [getUserEmail, token, makeAuthenticatedRequest, teamState.currentTeam]);

  // Backward compatibility
  const fetchAllTeams = useCallback(async () => {
    return fetchUserTeams();
  }, [fetchUserTeams]);

  // Fetch specific team details
  const fetchTeamDetails = useCallback(async (teamId) => {
    const userEmail = getUserEmail();
    
    if (!teamId) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'Team ID is required' });
      return null;
    }

    if (!token) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'Authentication required' });
      return null;
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      const url = userEmail 
        ? `${API_BASE_URL}/api/teams/details/${teamId}?userEmail=${encodeURIComponent(userEmail)}`
        : `${API_BASE_URL}/api/teams/details/${teamId}`;
        
      const response = await makeAuthenticatedRequest(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch team details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Team details fetched:', data.team);

      dispatch({ type: TEAM_ACTIONS.SET_CURRENT_TEAM, payload: data.team });
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });

      return data.team;
    } catch (error) {
      console.error('❌ Error fetching team details:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to fetch team details' 
      });
      return null;
    }
  }, [getUserEmail, token, makeAuthenticatedRequest]);

  // Fetch team transactions
  const fetchTeamTransactions = useCallback(async (teamId) => {
    if (!teamId || !token) return [];
    
    console.log('📋 Fetching transactions for team:', teamId);

    try {
      // Fetch pending transactions from backend
      const pendingResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/pending/${teamId}`);
      let pending = [];
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        pending = Array.isArray(pendingData.transactions) ? pendingData.transactions : [];
      }

      // Optionally, fetch all/completed transactions from another endpoint if needed
      // For now, just set pending and leave all/completed as empty or mock
      dispatch({ 
        type: TEAM_ACTIONS.SET_TRANSACTIONS, 
        payload: { 
          all: pending, // You can merge with completed if you fetch them
          pending, 
          completed: [] // Fill with completed if you fetch them
        } 
      });

      return pending;
    } catch (error) {
      console.warn('⚠️ Transactions API not implemented yet, using mock data:', error.message);
      
      // Mock transactions for development
      const mockTransactions = [
        {
          id: `tx-${teamId}-1`,
          teamId,
          amount: 0.5,
          currency: 'ETH',
          recipient: '0x742d35Cc6436C0532925a3b8D2439C6B7a4b7320',
          initiatedBy: { id: 'user1', email: getUserEmail() },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          approvals: [{ id: 'user1', email: getUserEmail() }],
          requiredApprovals: 2
        }
      ];

      const pending = mockTransactions.filter(tx => tx.status === 'pending');
      const completed = mockTransactions.filter(tx => tx.status === 'completed');

      dispatch({ 
        type: TEAM_ACTIONS.SET_TRANSACTIONS, 
        payload: { 
          all: mockTransactions, 
          pending, 
          completed 
        } 
      });

      return mockTransactions;
    }
  }, [token, makeAuthenticatedRequest, getUserEmail]);

  // Switch team
  const switchTeam = useCallback(async (teamId) => {
    const team = teamState.teams.find(t => t.teamId === teamId);
    if (team) {
      dispatch({ type: TEAM_ACTIONS.SET_CURRENT_TEAM, payload: team });
      
      // Clear existing transactions when switching teams
      dispatch({ 
        type: TEAM_ACTIONS.SET_TRANSACTIONS, 
        payload: { all: [], pending: [], completed: [] } 
      });
      
      // Fetch transactions for the new team
      await fetchTeamTransactions(teamId);
    }
  }, [teamState.teams, fetchTeamTransactions]);

  // Create team - FIXED to match backend expectations exactly
  const createTeam = useCallback(async (teamData) => {
    console.log('🔄 TeamContext: Creating team with data:', teamData);

    // Validate input data
    if (!teamData) {
      throw new Error('Team data is required');
    }

    const teamName = teamData.name || teamData.teamName;
    if (!teamName || !teamName.trim()) {
      throw new Error('Team name is required');
    }

    if (!Array.isArray(teamData.members) || teamData.members.length === 0) {
      throw new Error('Members array is required and must not be empty');
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    // Validate each member
    for (let i = 0; i < teamData.members.length; i++) {
      const member = teamData.members[i];
      if (!member.email || !member.email.trim()) {
        throw new Error(`Member ${i + 1} must have an email address`);
      }
      if (!member.role) {
        throw new Error(`Member ${i + 1} must have a role`);
      }
    }

    // Ensure there's a creator
    const hasCreator = teamData.members.some(member => member.role === 'creator');
    if (!hasCreator) {
      throw new Error('Team must have a creator');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      // Prepare payload exactly as backend expects
      const createPayload = {
        teamName: teamName.trim(),
        members: teamData.members.map(member => ({
          email: member.email.trim(),
          role: member.role
        }))
      };

      console.log('📤 TeamContext: Sending create team request:', createPayload);

      const createResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/create`, {
        method: 'POST',
        body: JSON.stringify(createPayload)
      });

      // Handle response
      let responseData;
      try {
        responseData = await createResponse.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!createResponse.ok) {
        console.error('❌ Create team failed:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          data: responseData
        });
        throw new Error(responseData.error || `Server error: ${createResponse.statusText}`);
      }

      console.log('✅ TeamContext: Team created successfully:', responseData);
      
      // Refresh teams list to get the latest data
      await fetchUserTeams();
      
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });

      return responseData;
      
    } catch (error) {
      console.error('❌ TeamContext: Error creating team:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to create team' 
      });
      throw error;
    }
  }, [token, makeAuthenticatedRequest, fetchUserTeams]);

  // Add team member
  const addTeamMember = useCallback(async (teamId, memberData) => {
    if (!teamId || !memberData || !token) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add team member');
      }

      // Refresh teams data
      await fetchUserTeams();
    } catch (error) {
      console.error('❌ Error adding team member:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to add team member' 
      });
      throw error;
    }
  }, [token, makeAuthenticatedRequest, fetchUserTeams]);

  // Remove team member
  const removeTeamMember = useCallback(async (teamId, memberId) => {
    if (!teamId || !memberId || !token) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove team member');
      }

      // Refresh teams data
      await fetchUserTeams();
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to remove team member' 
      });
      throw error;
    }
  }, [token, makeAuthenticatedRequest, fetchUserTeams]);

  // Delete team
  const deleteTeam = useCallback(async (teamId) => {
    const userEmail = getUserEmail();
    
    if (!teamId || !userEmail || !token) {
      throw new Error('Team ID, user email, and authentication are required');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userEmail: userEmail })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete team');
      }

      // Refresh teams list after deletion
      await fetchUserTeams();

      // Clear current team if it was deleted
      if (teamState.currentTeam && teamState.currentTeam.teamId === teamId) {
        dispatch({ type: TEAM_ACTIONS.SET_CURRENT_TEAM, payload: null });
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      throw error;
    } finally {
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });
    }
  }, [getUserEmail, token, makeAuthenticatedRequest, fetchUserTeams, teamState.currentTeam]);

  // Initiate transaction
  const initiateTransaction = useCallback(async (transactionData) => {
    if (!transactionData || !teamState.currentTeam || !token) return null;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/initiate`, {
        method: 'POST',
        body: JSON.stringify({
          ...transactionData,
          teamId: teamState.currentTeam.teamId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initiate transaction');
      }

      const result = await response.json();
      
      // Refresh transactions
      await fetchTeamTransactions(teamState.currentTeam.teamId);
      
      return result;
    } catch (error) {
      console.error('❌ Error initiating transaction:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to initiate transaction' 
      });
      throw error;
    }
  }, [teamState.currentTeam, token, makeAuthenticatedRequest, fetchTeamTransactions]);

  // Approve transaction
  const approveTransaction = useCallback(async (transactionId, approverData) => {
    if (!transactionId || !approverData || !token) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/${transactionId}/approve`, {
        method: 'POST',
        body: JSON.stringify(approverData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve transaction');
      }

      // Refresh transactions
      if (teamState.currentTeam) {
        await fetchTeamTransactions(teamState.currentTeam.teamId);
      }
    } catch (error) {
      console.error('❌ Error approving transaction:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to approve transaction' 
      });
      throw error;
    }
  }, [token, makeAuthenticatedRequest, fetchTeamTransactions, teamState.currentTeam]);

  // Reset state - useful for logout
  const resetState = useCallback(() => {
    dispatch({ type: TEAM_ACTIONS.RESET_STATE });
  }, []);

  // Refresh teams
  const refreshTeams = useCallback(() => {
    if (isLoggedIn && token) {
      fetchUserTeams();
    }
  }, [isLoggedIn, token, fetchUserTeams]);

  // Auto-set user email when user is available
  useEffect(() => {
    const email = user?.email || user?.['custom:email'];
    if (email && email !== teamState.userEmail) {
      setUserEmail(email);
    }
  }, [user, teamState.userEmail, setUserEmail]);

  // Auto-fetch teams when user is logged in
  useEffect(() => {
    if (isLoggedIn && token && user && teamState.teams.length === 0 && !teamState.loading) {
      console.log('🔄 Auto-fetching teams for authenticated user');
      fetchUserTeams();
    }
  }, [isLoggedIn, token, user, teamState.teams.length, teamState.loading, fetchUserTeams]);

  // Reset state when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      console.log('🔄 User logged out, resetting team state');
      resetState();
    }
  }, [isLoggedIn, resetState]);

  return (
    <TeamContext.Provider
      value={{
        teamState,
        clearError,
        fetchAllTeams, // Keep for backward compatibility
        fetchUserTeams, // New preferred method
        fetchTeamDetails,
        fetchTeamTransactions,
        createTeam,
        addTeamMember,
        removeTeamMember,
        initiateTransaction,
        approveTransaction,
        switchTeam,
        deleteTeam,
        resetState,
        refreshTeams,
        getUserEmail,
        setUserEmail
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export default TeamProvider;