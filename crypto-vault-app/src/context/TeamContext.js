// src/context/TeamContext.js
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

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
  loading: false,
  error: null,
  userEmail: null
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

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  // Helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || null;
  };

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Set user email - call this when user authenticates
  const setUserEmail = useCallback((email) => {
    dispatch({ type: TEAM_ACTIONS.SET_USER_EMAIL, payload: email });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: TEAM_ACTIONS.CLEAR_ERROR });
  }, []);

  // Fetch all teams for the current user - optimized version
  const fetchAllTeams = useCallback(async (userEmail = null) => {
    const emailToUse = userEmail || teamState.userEmail;
    
    if (!emailToUse) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'User email is required to fetch teams' });
      return [];
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      // Use the optimized endpoint that fetches only user's teams
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/teams/user?email=${encodeURIComponent(emailToUse)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
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
  }, [teamState.userEmail, teamState.currentTeam]);

  // Fetch specific team details
  const fetchTeamDetails = useCallback(async (teamId, userEmail = null) => {
    const emailToUse = userEmail || teamState.userEmail;
    
    if (!teamId) {
      dispatch({ type: TEAM_ACTIONS.SET_ERROR, payload: 'Team ID is required' });
      return null;
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      const url = emailToUse 
        ? `${API_BASE_URL}/api/teams/${teamId}?userEmail=${encodeURIComponent(emailToUse)}`
        : `${API_BASE_URL}/api/teams/${teamId}`;
        
      const response = await makeAuthenticatedRequest(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team details: ${response.statusText}`);
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
  }, [teamState.userEmail]);

  // Fetch team transactions
  const fetchTeamTransactions = useCallback(async (teamId) => {
    if (!teamId) return [];
    
    console.log('📋 Fetching transactions for team:', teamId);

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/${teamId}`);
      
      if (response.ok) {
        const data = await response.json();
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];
        
        const pending = transactions.filter(tx => tx.status === 'pending');
        const completed = transactions.filter(tx => tx.status === 'completed');

        dispatch({ 
          type: TEAM_ACTIONS.SET_TRANSACTIONS, 
          payload: { 
            all: transactions, 
            pending, 
            completed 
          } 
        });

        return transactions;
      } else {
        throw new Error('Failed to fetch transactions');
      }
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
          initiatedBy: { id: 'user1', email: 'user@example.com' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          approvals: [{ id: 'user1', email: 'user@example.com' }],
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
  }, []);

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

  // Create team
  const createTeam = async (teamData) => {
    if (!teamData || !teamData.members) {
      throw new Error('Invalid team data');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      const emailList = Array.isArray(teamData.members) ? teamData.members.map(m => m.email) : [];
      
      // Verify emails first
      const verifyResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/api/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ emails: emailList })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify emails');
      }

      // Create team
      const createResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/create`, {
        method: 'POST',
        body: JSON.stringify({
          teamName: teamData.name || teamData.teamName,
          members: teamData.members
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const result = await createResponse.json();
      
      // Refresh teams list to get the latest data
      await fetchAllTeams();
      
      dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: false });

      return result;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to create team' 
      });
      throw error;
    }
  };

  // Add team member
  const addTeamMember = async (teamId, memberData) => {
    if (!teamId || !memberData) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        throw new Error('Failed to add team member');
      }

      // Refresh teams data
      await fetchAllTeams();
    } catch (error) {
      console.error('❌ Error adding team member:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to add team member' 
      });
      throw error;
    }
  };

  // Remove team member
  const removeTeamMember = async (teamId, memberId) => {
    if (!teamId || !memberId) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove team member');
      }

      // Refresh teams data
      await fetchAllTeams();
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      dispatch({ 
        type: TEAM_ACTIONS.SET_ERROR, 
        payload: error.message || 'Failed to remove team member' 
      });
      throw error;
    }
  };

  // Delete team
  const deleteTeam = useCallback(async (teamId) => {
    if (!teamId || !teamState.userEmail) {
      throw new Error('Team ID and user email are required');
    }

    dispatch({ type: TEAM_ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userEmail: teamState.userEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      // Refresh teams list after deletion
      await fetchAllTeams();

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
  }, [teamState.userEmail, teamState.currentTeam, fetchAllTeams]);

  // Initiate transaction
  const initiateTransaction = async (transactionData) => {
    if (!transactionData || !teamState.currentTeam) return null;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/initiate`, {
        method: 'POST',
        body: JSON.stringify({
          ...transactionData,
          teamId: teamState.currentTeam.teamId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate transaction');
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
  };

  // Approve transaction
  const approveTransaction = async (transactionId, approverData) => {
    if (!transactionId || !approverData) return;
    
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/${transactionId}/approve`, {
        method: 'POST',
        body: JSON.stringify(approverData)
      });

      if (!response.ok) {
        throw new Error('Failed to approve transaction');
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
  };

  // Reset state - useful for logout
  const resetState = useCallback(() => {
    dispatch({ type: TEAM_ACTIONS.RESET_STATE });
  }, []);

  // Refresh teams
  const refreshTeams = () => {
    fetchAllTeams();
  };

  // Auto-fetch teams when user email is set
  useEffect(() => {
    if (teamState.userEmail && teamState.teams.length === 0) {
      fetchAllTeams();
    }
  }, [teamState.userEmail, fetchAllTeams, teamState.teams.length]);

  return (
    <TeamContext.Provider
      value={{
        teamState,
        setUserEmail,
        clearError,
        fetchAllTeams,
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
        refreshTeams
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