// src/context/TeamContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teamState, setTeamState] = useState({
    teams: [],
    currentTeam: null,
    transactions: [],
    pendingTransactions: [],
    completedTransactions: [],
    loading: false,
    error: null
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  // Helper function to get auth token (you'll need to implement this based on your auth system)
  const getAuthToken = () => {
    // Replace this with your actual token retrieval method
    // For now, returning null until you implement session management
    return localStorage.getItem('authToken') || null;
  };

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  const fetchAllTeams = async () => {
    setTeamState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use the /user endpoint to get only teams the user is part of
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/user`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Ensure we have a teams array, even if empty
      const fetchedTeams = Array.isArray(data.teams) ? data.teams : [];
      console.log('✅ Teams fetched successfully:', fetchedTeams);

      let currentTeam = null;
      if (fetchedTeams.length > 0) {
        currentTeam = fetchedTeams[0]; // default to first team
        await fetchTeamTransactions(currentTeam.teamId);
      }

      setTeamState(prev => ({
        ...prev,
        teams: fetchedTeams,
        currentTeam,
        loading: false
      }));

      return fetchedTeams;
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch teams',
        loading: false,
        teams: [] // Ensure teams is always an array
      }));
      return [];
    }
  };

  const fetchTeamTransactions = async (teamId) => {
    if (!teamId) return [];
    
    console.log('📋 Fetching transactions for team:', teamId);

    try {
      // Replace this with actual API call when you implement transaction endpoints
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/transactions/${teamId}`);
      
      if (response.ok) {
        const data = await response.json();
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];
        
        const pending = transactions.filter(tx => tx.status === 'pending');
        const completed = transactions.filter(tx => tx.status === 'completed');

        setTeamState(prev => ({
          ...prev,
          transactions,
          pendingTransactions: pending,
          completedTransactions: completed
        }));

        return transactions;
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (error) {
      console.warn('⚠️ Transactions API not implemented yet, using mock data:', error.message);
      
      // Mock transactions for now - ensure they're always arrays
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

      setTeamState(prev => ({
        ...prev,
        transactions: mockTransactions,
        pendingTransactions: pending,
        completedTransactions: completed
      }));

      return mockTransactions;
    }
  };

  useEffect(() => {
    fetchAllTeams();
  }, []);

  const fetchTeamDetails = async (teamId) => {
    if (!teamId) return null;
    
    setTeamState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Team details fetched:', data.team);

      setTeamState(prev => ({
        ...prev,
        currentTeam: data.team,
        loading: false
      }));

      return data.team;
    } catch (error) {
      console.error('❌ Error fetching team details:', error);
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch team details',
        loading: false
      }));
      return null;
    }
  };

  const createTeam = async (teamData) => {
    if (!teamData || !teamData.members) {
      throw new Error('Invalid team data');
    }

    setTeamState(prev => ({ ...prev, loading: true, error: null }));

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
      
      setTeamState(prev => ({ ...prev, loading: false }));

      return result;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to create team',
        loading: false
      }));
      throw error;
    }
  };

  const switchTeam = async (teamId) => {
    const teams = teamState.teams || [];
    const team = teams.find(t => t.teamId === teamId);
    if (team) {
      setTeamState(prev => ({
        ...prev,
        currentTeam: team,
        transactions: [],
        pendingTransactions: [],
        completedTransactions: []
      }));
      await fetchTeamTransactions(teamId);
    }
  };

  const addTeamMember = async (teamId, memberData) => {
    if (!teamId || !memberData) return;
    
    try {
      // Make API call to add member
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
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to add team member'
      }));
      throw error;
    }
  };

  const removeTeamMember = async (teamId, memberId) => {
    if (!teamId || !memberId) return;
    
    try {
      // Make API call to remove member
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
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to remove team member'
      }));
      throw error;
    }
  };

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
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to initiate transaction'
      }));
      throw error;
    }
  };

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
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to approve transaction'
      }));
      throw error;
    }
  };

  const deleteTeam = async (teamId) => {
    if (!teamId) return false;
    
    setTeamState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      // Refresh teams list
      await fetchAllTeams();
      
      setTeamState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      setTeamState(prev => ({
        ...prev,
        error: error.message || 'Failed to delete team',
        loading: false
      }));
      throw error;
    }
  };

  const clearError = () => {
    setTeamState(prev => ({ ...prev, error: null }));
  };

  const refreshTeams = () => {
    fetchAllTeams();
  };

  return (
    <TeamContext.Provider
      value={{
        teamState,
        fetchTeamDetails,
        fetchTeamTransactions,
        fetchAllTeams,
        createTeam,
        addTeamMember,
        removeTeamMember,
        initiateTransaction,
        approveTransaction,
        switchTeam,
        deleteTeam,
        clearError,
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