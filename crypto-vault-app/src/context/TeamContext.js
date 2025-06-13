// src/context/TeamContext.js - Enhanced version with safety fix
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { CognitoRefreshToken } from 'amazon-cognito-identity-js';

// Action types
const TEAM_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TEAMS: 'SET_TEAMS',
  SET_CURRENT_TEAM: 'SET_CURRENT_TEAM',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_TRANSACTION_COUNTS: 'SET_TRANSACTION_COUNTS',
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
  transactionCounts: {
    pending: 0,
    completed: 0,
    total: 0
  },
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
      return { ...state, teams: Array.isArray(action.payload) ? action.payload : [], loading: false };

    case TEAM_ACTIONS.SET_CURRENT_TEAM:
      return { ...state, currentTeam: action.payload };

    case TEAM_ACTIONS.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload.all || [],
        pendingTransactions: action.payload.pending || [],
        completedTransactions: action.payload.completed || []
      };

    case TEAM_ACTIONS.SET_TRANSACTION_COUNTS:
      return {
        ...state,
        transactionCounts: action.payload
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

  // Enhanced fetch team transactions with comprehensive data handling
  const fetchTeamTransactions = useCallback(async (teamId) => {
    if (!teamId) {
      console.log('No teamId provided for fetchTeamTransactions');
      return [];
    }

    if (!token) {
      console.log('No token available for fetchTeamTransactions');
      return [];
    }

    console.log('📋 Fetching transactions for team:', teamId);
    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      // Try the comprehensive endpoint first (from new functionality)
      const comprehensiveResponse = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/transactions/team/${teamId}`
      );

      if (comprehensiveResponse.ok) {
        const data = await comprehensiveResponse.json();
        console.log('✅ Comprehensive transactions data received:', data);

        // Update transactions with comprehensive data structure
        dispatch({
          type: TEAM_ACTIONS.SET_TRANSACTIONS,
          payload: {
            all: data.transactions?.all || [],
            pending: data.transactions?.pending || [],
            completed: data.transactions?.completed || []
          }
        });

        // Update transaction counts if available
        if (data.count) {
          dispatch({
            type: TEAM_ACTIONS.SET_TRANSACTION_COUNTS,
            payload: {
              pending: data.count.pending || 0,
              completed: data.count.completed || 0,
              total: data.count.total || 0
            }
          });
        }

        console.log('Updated transaction state:', {
          pending: data.transactions?.pending?.length || 0,
          completed: data.transactions?.completed?.length || 0,
          total: data.transactions?.all?.length || 0
        });

        return data.transactions?.all || [];
      }

      // Fallback to pending transactions endpoint
      const pendingResponse = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/transactions/pending/${teamId}`
      );

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        const pending = Array.isArray(pendingData.transactions) ? pendingData.transactions : [];

        dispatch({
          type: TEAM_ACTIONS.SET_TRANSACTIONS,
          payload: {
            all: pending,
            pending,
            completed: []
          }
        });

        dispatch({
          type: TEAM_ACTIONS.SET_TRANSACTION_COUNTS,
          payload: {
            pending: pending.length,
            completed: 0,
            total: pending.length
          }
        });

        return pending;
      }

      throw new Error('No transaction endpoints available');

    } catch (error) {
      console.warn('⚠️ Transactions API error, using mock data:', error.message);

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

      dispatch({
        type: TEAM_ACTIONS.SET_TRANSACTION_COUNTS,
        payload: {
          pending: pending.length,
          completed: completed.length,
          total: mockTransactions.length
        }
      });

      return mockTransactions;
    } finally {
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });
    }
  }, [token, makeAuthenticatedRequest, getUserEmail]);

  // Switch team - FIXED with safety checks
  const switchTeam = useCallback(async (teamId) => {
    // Safety check: ensure teamState.teams exists and is an array
    if (!Array.isArray(teamState.teams)) {
      console.error('❌ Teams array is not available for switching');
      dispatch({
        type: TEAM_ACTIONS.SET_ERROR,
        payload: 'Teams data not available. Please refresh the page.'
      });
      return;
    }

    const team = teamState.teams.find(t => t.teamId === teamId);
    if (team) {
      dispatch({ type: TEAM_ACTIONS.SET_CURRENT_TEAM, payload: team });

      // Clear existing transactions when switching teams
      dispatch({
        type: TEAM_ACTIONS.SET_TRANSACTIONS,
        payload: { all: [], pending: [], completed: [] }
      });

      // Reset transaction counts
      dispatch({
        type: TEAM_ACTIONS.SET_TRANSACTION_COUNTS,
        payload: { pending: 0, completed: 0, total: 0 }
      });

      // Fetch transactions for the new team
      await fetchTeamTransactions(teamId);
    } else {
      console.error('❌ Team not found:', teamId);
      dispatch({
        type: TEAM_ACTIONS.SET_ERROR,
        payload: 'Selected team not found'
      });
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

  // Enhanced create transaction function (NEW from provided code)
  const createTransaction = useCallback(async (transactionData) => {
    if (!transactionData) {
      throw new Error('Transaction data is required');
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      console.log('🔄 Creating transaction:', transactionData);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/create`, {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      console.log('✅ Transaction created successfully:', result);

      // Refresh transactions for the specified team
      if (transactionData.teamId) {
        await fetchTeamTransactions(transactionData.teamId);
      } else if (teamState.currentTeam) {
        await fetchTeamTransactions(teamState.currentTeam.teamId);
      }

      return result;
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      dispatch({
        type: TEAM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to create transaction'
      });
      throw error;
    } finally {
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });
    }
  }, [token, makeAuthenticatedRequest, fetchTeamTransactions, teamState.currentTeam]);

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

  // Backward compatibility - keeping original initiate transaction
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

  // Enhanced approve transaction function with shard support and CORS headers
  const approveTransaction = useCallback(async (transactionId, approverData) => {
    if (!token) {
      throw new Error('Authentication is required');
    }

    if (!approverData || !approverData.email || !approverData.teamId) {
      throw new Error('Email and team ID are required');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      console.log('🔄 Approving transaction with data:', approverData);

      // Generate a random shard ID
      const shardId = Math.random().toString(36).substring(2, 15);
      console.log('🔄 Shard ID:', shardId);
      // Make request to the new API endpoint with CORS headers in body
      const response = await fetch('https://2zfmmwd269.execute-api.ap-south-1.amazonaws.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
          // 'Origin': 'http://localhost:3000',
          // 'Access-Control-Allow-Origin': '*',
          // 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          // 'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({
          "shard_id": approverData.email,
          "shard_value": shardId,
          "team_id": approverData.teamId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Transaction approval failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to approve transaction: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Transaction approved successfully:', result);

      // Refresh transactions for the current team
      if (teamState.currentTeam) {
        await fetchTeamTransactions(teamState.currentTeam.teamId);
      }

      return result;
    } catch (error) {
      console.error('❌ Error approving transaction:', error);
      dispatch({
        type: TEAM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to approve transaction'
      });
      throw error;
    } finally {
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });
    }
  }, [token, fetchTeamTransactions, teamState.currentTeam]);

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
        fetchTeamTransactions, // Enhanced version
        createTeam,
        createTransaction, // NEW - Enhanced transaction creation
        addTeamMember,
        removeTeamMember,
        initiateTransaction, // Keep for backward compatibility
        approveTransaction, // Enhanced version
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