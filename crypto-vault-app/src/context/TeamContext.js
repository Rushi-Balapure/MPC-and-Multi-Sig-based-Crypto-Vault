//src/context/TeamContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getTeamDetails, getTeamTransactions } from '../services/teamApi';

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

  useEffect(() => {
    // Check if team data was previously saved
    const savedTeamData = localStorage.getItem('teamData');
    if (savedTeamData) {
      try {
        const parsedTeamData = JSON.parse(savedTeamData);
        setTeamState(prev => ({
          ...prev,
          teams: parsedTeamData.teams || [],
          currentTeam: parsedTeamData.currentTeam || null,
        }));
        
        // If there's a current team, fetch its transactions
        if (parsedTeamData.currentTeam) {
          fetchTeamTransactions(parsedTeamData.currentTeam.id);
        }
      } catch (error) {
        console.error("Failed to parse saved team data", error);
      }
    }
  }, []);

  const fetchTeamDetails = async (teamId) => {
    setTeamState(prev => ({ ...prev, loading: true }));
    try {
      const teamDetails = await getTeamDetails(teamId);
      
      setTeamState(prev => ({
        ...prev,
        currentTeam: teamDetails,
        loading: false
      }));
      
      // Save to localStorage
      localStorage.setItem('teamData', JSON.stringify({
        ...JSON.parse(localStorage.getItem('teamData') || '{}'),
        currentTeam: teamDetails
      }));
      
      return teamDetails;
    } catch (error) {
      setTeamState(prev => ({
        ...prev,
        error: "Failed to fetch team details",
        loading: false
      }));
      return null;
    }
  };

  const fetchTeamTransactions = async (teamId) => {
    setTeamState(prev => ({ ...prev, loading: true }));
    try {
      const transactions = await getTeamTransactions(teamId);
      
      // Separate pending and completed transactions
      const pending = transactions.filter(tx => tx.status === 'pending');
      const completed = transactions.filter(tx => tx.status === 'completed');
      
      setTeamState(prev => ({
        ...prev,
        transactions,
        pendingTransactions: pending,
        completedTransactions: completed,
        loading: false
      }));
      
      return transactions;
    } catch (error) {
      setTeamState(prev => ({
        ...prev,
        error: "Failed to fetch team transactions",
        loading: false
      }));
      return [];
    }
  };

  const createTeam = async (teamData) => {
    // This would call your backend API to create the team and distribute key shards
    setTeamState(prev => ({ ...prev, loading: true }));
    
    try {
      // In a real implementation, this would be an API call to your Lambda function
      // that takes the team members' emails and distributes key shards
      console.log("Sending to backend API:", {
        name: teamData.name,
        quorum: teamData.quorum,
        creator: teamData.creator,
        members: teamData.members
      });
      
      // Simulate API call to backend
      // In a real app, you'd make a fetch/axios call to your AWS Lambda here
      // const response = await fetch('/api/teams', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(teamData)
      // });
      // const data = await response.json();
      
      // For now, just create a mockup team as if the backend responded
      const mockTeamResponse = {
        id: `team-${Date.now()}`,
        name: teamData.name,
        createdAt: new Date().toISOString(),
        creator: teamData.creator,
        members: [
          teamData.creator,
          ...teamData.members.map((member, index) => ({
            id: `member-${Date.now()}-${index}`,
            email: member.email,
            role: member.role
          }))
        ],
        quorum: teamData.quorum,
        totalMembers: 1 + teamData.members.length
      };
      
      const newTeam = mockTeamResponse;
      
      setTeamState(prev => ({
        ...prev,
        teams: [...prev.teams, newTeam],
        currentTeam: newTeam,
        loading: false
      }));
      
      // Save to localStorage
      const savedTeamData = JSON.parse(localStorage.getItem('teamData') || '{}');
      localStorage.setItem('teamData', JSON.stringify({
        ...savedTeamData,
        teams: [...(savedTeamData.teams || []), newTeam],
        currentTeam: newTeam
      }));
      
      return newTeam;
    } catch (error) {
      console.error("Failed to create team:", error);
      setTeamState(prev => ({
        ...prev,
        error: "Failed to create team: " + (error.message || "Unknown error"),
        loading: false
      }));
      throw error;
    }
  };

  const addTeamMember = (teamId, memberData) => {
    setTeamState(prev => {
      const updatedTeams = prev.teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            members: [...team.members, memberData],
            totalMembers: team.totalMembers + 1
          };
        }
        return team;
      });
      
      let updatedCurrentTeam = prev.currentTeam;
      if (prev.currentTeam && prev.currentTeam.id === teamId) {
        updatedCurrentTeam = {
          ...prev.currentTeam,
          members: [...prev.currentTeam.members, memberData],
          totalMembers: prev.currentTeam.totalMembers + 1
        };
      }
      
      // Save to localStorage
      const savedTeamData = JSON.parse(localStorage.getItem('teamData') || '{}');
      localStorage.setItem('teamData', JSON.stringify({
        ...savedTeamData,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      }));
      
      return {
        ...prev,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      };
    });
  };

  const removeTeamMember = (teamId, memberId) => {
    setTeamState(prev => {
      const updatedTeams = prev.teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            members: team.members.filter(member => member.id !== memberId),
            totalMembers: team.totalMembers - 1
          };
        }
        return team;
      });
      
      let updatedCurrentTeam = prev.currentTeam;
      if (prev.currentTeam && prev.currentTeam.id === teamId) {
        updatedCurrentTeam = {
          ...prev.currentTeam,
          members: prev.currentTeam.members.filter(member => member.id !== memberId),
          totalMembers: prev.currentTeam.totalMembers - 1
        };
      }
      
      // Save to localStorage
      const savedTeamData = JSON.parse(localStorage.getItem('teamData') || '{}');
      localStorage.setItem('teamData', JSON.stringify({
        ...savedTeamData,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      }));
      
      return {
        ...prev,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      };
    });
  };

  const initiateTransaction = (transactionData) => {
    const newTransaction = {
      id: `tx-${Date.now()}`,
      teamId: teamState.currentTeam.id,
      amount: transactionData.amount,
      currency: transactionData.currency,
      recipient: transactionData.recipient,
      initiatedBy: transactionData.initiatedBy,
      createdAt: new Date().toISOString(),
      status: 'pending',
      approvals: [transactionData.initiatedBy],
      requiredApprovals: teamState.currentTeam.quorum
    };
    
    setTeamState(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
      pendingTransactions: [newTransaction, ...prev.pendingTransactions]
    }));
    
    // In a real app, you would call an API to save this transaction
    return newTransaction;
  };

  const approveTransaction = (transactionId, approverData) => {
    setTeamState(prev => {
      const updatedTransactions = prev.transactions.map(tx => {
        if (tx.id === transactionId) {
          // Check if this approver hasn't already approved
          if (!tx.approvals.some(approver => approver.id === approverData.id)) {
            const updatedApprovals = [...tx.approvals, approverData];
            const isCompleted = updatedApprovals.length >= tx.requiredApprovals;
            
            return {
              ...tx,
              approvals: updatedApprovals,
              status: isCompleted ? 'completed' : 'pending'
            };
          }
        }
        return tx;
      });
      
      // Recategorize pending and completed
      const pending = updatedTransactions.filter(tx => tx.status === 'pending');
      const completed = updatedTransactions.filter(tx => tx.status === 'completed');
      
      return {
        ...prev,
        transactions: updatedTransactions,
        pendingTransactions: pending,
        completedTransactions: completed
      };
    });
  };
  
  const switchTeam = (teamId) => {
    const team = teamState.teams.find(t => t.id === teamId);
    if (team) {
      setTeamState(prev => ({
        ...prev,
        currentTeam: team
      }));
      
      // Save to localStorage
      localStorage.setItem('teamData', JSON.stringify({
        ...JSON.parse(localStorage.getItem('teamData') || '{}'),
        currentTeam: team
      }));
      
      // Fetch transactions for the new team
      fetchTeamTransactions(teamId);
    }
  };

  const deleteTeam = async (teamId) => {
    // In a real app, this would require verification from all team members
    setTeamState(prev => ({ ...prev, loading: true }));
    
    try {
      // Mock API call to delete team
      // await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      
      // Remove team from state
      const updatedTeams = teamState.teams.filter(team => team.id !== teamId);
      let updatedCurrentTeam = teamState.currentTeam;
      
      // If we're deleting the current team, set current to null or the first available team
      if (teamState.currentTeam && teamState.currentTeam.id === teamId) {
        updatedCurrentTeam = updatedTeams.length > 0 ? updatedTeams[0] : null;
      }
      
      setTeamState(prev => ({
        ...prev,
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam,
        loading: false
      }));
      
      // Update localStorage
      localStorage.setItem('teamData', JSON.stringify({
        teams: updatedTeams,
        currentTeam: updatedCurrentTeam
      }));
      
      return true;
    } catch (error) {
      setTeamState(prev => ({
        ...prev,
        error: "Failed to delete team",
        loading: false
      }));
      throw error;
    }
  };

  return (
    <TeamContext.Provider value={{
      teamState,
      fetchTeamDetails,
      fetchTeamTransactions,
      createTeam,
      addTeamMember,
      removeTeamMember,
      initiateTransaction,
      approveTransaction,
      switchTeam,
      deleteTeam
    }}>
      {children}
    </TeamContext.Provider>
  );
};

// Custom hook to use the team context
export const useTeam = () => useContext(TeamContext);

export default TeamProvider;