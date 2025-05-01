// src/services/teamApi.js
// This is a mock API service. In a real app, you would call actual endpoints

/**
 * Get details for a specific team
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Object>} - Team details
 */
export const getTeamDetails = async (teamId) => {
    // In a real app, this would be an API call
    // For now we'll simulate async behavior
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get data from localStorage as a fallback
        const savedTeamData = JSON.parse(localStorage.getItem('teamData') || '{}');
        const teams = savedTeamData.teams || [];
        const team = teams.find(t => t.id === teamId);
        
        if (team) {
          resolve(team);
        } else {
          // Mock team data
          resolve({
            id: teamId,
            name: 'Team ' + teamId.substring(0, 5),
            createdAt: new Date().toISOString(),
            members: [
              {
                id: '0x123...', // This would be a real address in production
                name: 'Team Admin',
                email: 'admin@example.com',
                role: 'admin'
              }
            ],
            quorum: 2,
            totalMembers: 1
          });
        }
      }, 300); // Simulate network delay
    });
  };
  
  /**
   * Get transactions for a specific team
   * @param {string} teamId - The ID of the team
   * @returns {Promise<Array>} - List of transactions
   */
  export const getTeamTransactions = async (teamId) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock transactions
        const mockTransactions = [
          {
            id: `tx-${Date.now()}-1`,
            teamId: teamId,
            amount: 0.5,
            currency: 'ETH',
            recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            initiatedBy: {
              id: '0x123...',
              name: 'Team Admin'
            },
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            status: 'completed',
            approvals: [
              {
                id: '0x123...',
                name: 'Team Admin',
                timestamp: new Date(Date.now() - 86400000).toISOString()
              },
              {
                id: '0x456...',
                name: 'Member 1',
                timestamp: new Date(Date.now() - 82800000).toISOString()
              }
            ],
            requiredApprovals: 2
          },
          {
            id: `tx-${Date.now()}-2`,
            teamId: teamId,
            amount: 1.2,
            currency: 'ETH',
            recipient: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
            initiatedBy: {
              id: '0x123...',
              name: 'Team Admin'
            },
            // src/services/teamApi.js (continued)
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          status: 'pending',
          approvals: [
            {
              id: '0x123...',
              name: 'Team Admin',
              timestamp: new Date(Date.now() - 43200000).toISOString()
            }
          ],
          requiredApprovals: 2
        },
        {
          id: `tx-${Date.now()}-3`,
          teamId: teamId,
          amount: 100,
          currency: 'USDC',
          recipient: '0x8C12D605C2fC421Ca6E698B065FCc3DF6CFf942B',
          initiatedBy: {
            id: '0x456...',
            name: 'Member 1'
          },
          createdAt: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
          status: 'pending',
          approvals: [
            {
              id: '0x456...',
              name: 'Member 1',
              timestamp: new Date(Date.now() - 21600000).toISOString()
            }
          ],
          requiredApprovals: 2
        }
      ];
      
      resolve(mockTransactions);
    }, 500); // Simulate network delay
  });
};

/**
 * Create a new team (mock implementation)
 * @param {Object} teamData - The team data
 * @returns {Promise<Object>} - Created team
 */
export const createTeam = async (teamData) => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTeam = {
        id: `team-${Date.now()}`,
        name: teamData.name,
        createdAt: new Date().toISOString(),
        members: [teamData.creator],
        quorum: teamData.quorum,
        totalMembers: 1
      };
      
      resolve(newTeam);
    }, 500);
  });
};

/**
 * Create a new transaction (mock implementation)
 * @param {Object} transactionData - The transaction data
 * @returns {Promise<Object>} - Created transaction
 */
export const createTransaction = async (transactionData) => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTransaction = {
        id: `tx-${Date.now()}`,
        teamId: transactionData.teamId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        recipient: transactionData.recipient,
        initiatedBy: transactionData.initiatedBy,
        createdAt: new Date().toISOString(),
        status: 'pending',
        approvals: [transactionData.initiatedBy],
        requiredApprovals: transactionData.requiredApprovals
      };
      
      resolve(newTransaction);
    }, 300);
  });
};