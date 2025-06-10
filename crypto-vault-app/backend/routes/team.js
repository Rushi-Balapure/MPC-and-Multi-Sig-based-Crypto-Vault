// // backend/routes/team.js
// import express from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import dynamoDB from '../utils/awsConfig.js';

// const router = express.Router();

// // Create team endpoint
// router.post('/create', async (req, res) => {
//   console.log('📝 Creating team with request body:', req.body);
  
//   const { teamName, members } = req.body;

//   // Validation
//   if (!teamName || !teamName.trim()) {
//     console.log('❌ Team name is missing or empty');
//     return res.status(400).json({ error: 'Team name is required' });
//   }

//   if (!Array.isArray(members) || members.length === 0) {
//     console.log('❌ Members array is invalid or empty');
//     return res.status(400).json({ error: 'Members array is required and must not be empty' });
//   }

//   // Validate each member has an email
//   for (let i = 0; i < members.length; i++) {
//     if (!members[i].email || !members[i].email.trim()) {
//       console.log(`❌ Member ${i + 1} is missing email`);
//       return res.status(400).json({ error: `Member ${i + 1} must have an email address` });
//     }
//   }

//   const teamId = uuidv4();
//   const params = {
//     TableName: 'VaultTeams', // Make sure this matches your actual DynamoDB table name
//     Item: {
//       teamId: teamId,
//       teamName: teamName.trim(),
//       members: members,
//       createdAt: new Date().toISOString(),
//       status: 'active'
//     },
//   };

//   try {
//     console.log('💾 Saving team to DynamoDB:', params);
//     await dynamoDB.put(params).promise();
    
//     console.log('✅ Team created successfully with ID:', teamId);
//     res.status(201).json({ 
//       message: 'Team created successfully',
//       teamId: teamId,
//       teamName: teamName.trim()
//     });
    
//   } catch (err) {
//     console.error('❌ Error saving team to DynamoDB:', err);
//     res.status(500).json({ 
//       error: 'Could not create team',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });

// // Get all teams (optional - for listing teams)
// router.get('/list', async (req, res) => {
//   const params = {
//     TableName: 'VaultTeams'
//   };

//   try {
//     const result = await dynamoDB.scan(params).promise();
//     console.log('📋 Retrieved teams:', result.Items.length);
    
//     res.status(200).json({
//       message: 'Teams retrieved successfully',
//       teams: result.Items
//     });
    
//   } catch (err) {
//     console.error('❌ Error retrieving teams:', err);
//     res.status(500).json({ 
//       error: 'Could not retrieve teams',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });

// // Get specific team by ID (optional)
// router.get('/:teamId', async (req, res) => {
//   const { teamId } = req.params;

//   const params = {
//     TableName: 'VaultTeams',
//     Key: {
//       teamId: teamId
//     }
//   };

//   try {
//     const result = await dynamoDB.get(params).promise();
    
//     if (!result.Item) {
//       return res.status(404).json({ error: 'Team not found' });
//     }

//     console.log('📋 Retrieved team:', teamId);
//     res.status(200).json({
//       message: 'Team retrieved successfully',
//       team: result.Item
//     });
    
//   } catch (err) {
//     console.error('❌ Error retrieving team:', err);
//     res.status(500).json({ 
//       error: 'Could not retrieve team',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });

// /// testing only

// // // Get teams where logged-in user is a member
// // router.get('/user', verifyTokenMiddleware, async (req, res) => {
// //   const userEmail = req.user.email;

// //   const params = {
// //     TableName: 'VaultTeams'
// //   };

// //   try {
// //     const result = await dynamoDB.scan(params).promise();

// //     // Filter teams where the user's email is present in members list
// //     const userTeams = result.Items.filter(team => 
// //       team.members.some(member => member.email === userEmail)
// //     );

// //     console.log(`📋 ${userTeams.length} teams found for user: ${userEmail}`);

// //     res.status(200).json({
// //       message: 'Teams retrieved successfully',
// //       teams: userTeams
// //     });

// //   } catch (err) {
// //     console.error('❌ Error retrieving user teams:', err);
// //     res.status(500).json({ 
// //       error: 'Could not retrieve user teams',
// //       details: process.env.NODE_ENV === 'development' ? err.message : undefined
// //     });
// //   }
// // });


// export default router;



// backend/routes/team.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../utils/awsConfig.js';

const router = express.Router();

// Create team endpoint
router.post('/create', async (req, res) => {
  console.log('📝 Creating team with request body:', req.body);
  
  const { teamName, members } = req.body;

  // Validation
  if (!teamName || !teamName.trim()) {
    console.log('❌ Team name is missing or empty');
    return res.status(400).json({ error: 'Team name is required' });
  }

  if (!Array.isArray(members) || members.length === 0) {
    console.log('❌ Members array is invalid or empty');
    return res.status(400).json({ error: 'Members array is required and must not be empty' });
  }

  // Validate each member has an email and role
  for (let i = 0; i < members.length; i++) {
    if (!members[i].email || !members[i].email.trim()) {
      console.log(`❌ Member ${i + 1} is missing email`);
      return res.status(400).json({ error: `Member ${i + 1} must have an email address` });
    }
    if (!members[i].role) {
      console.log(`❌ Member ${i + 1} is missing role`);
      return res.status(400).json({ error: `Member ${i + 1} must have a role` });
    }
  }

  // Find the creator from members array
  const creator = members.find(member => member.role === 'creator');
  if (!creator) {
    console.log('❌ No creator found in members array');
    return res.status(400).json({ error: 'Team must have a creator' });
  }

  const createdBy = creator.email;

  const teamId = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    // 1. Create main team record
    const teamRecord = {
      PK: `TEAM#${teamId}`,
      SK: 'META',
      teamId: teamId,
      teamName: teamName.trim(),
      createdBy: createdBy,
      members: members.map(member => ({
        email: member.email,
        role: member.role,
        status: member.role === 'creator' ? 'accepted' : 'invited'
      })),
      createdAt: createdAt
    };

    // 2. Create user mapping records - FIXED: Use correct field names matching table schema
    const userMappingRecords = members.map(member => ({
      // Your table expects these exact field names:
      userEmail: member.email,  // Partition key (not PK)
      teamId: teamId,          // Sort key (not SK)
      
      teamName: teamName.trim(),
      role: member.role,
      status: member.role === 'creator' ? 'accepted' : 'invited',
      createdAt: createdAt
    }));

    console.log('💾 Team Record:', JSON.stringify(teamRecord, null, 2));
    console.log('💾 User Mapping Records:', JSON.stringify(userMappingRecords, null, 2));

    // Save team record to VaultTeams table
    const teamParams = {
      TableName: 'VaultTeams',
      Item: teamRecord
    };
    
    console.log('💾 Saving to VaultTeams...');
    await dynamoDB.put(teamParams).promise();
    console.log('✅ Team record saved successfully');

    // Save user mappings to UserTeamMappings table
    console.log('💾 Saving user mappings...');
    for (const userRecord of userMappingRecords) {
      const userParams = {
        TableName: 'UserTeamMappings',
        Item: userRecord
      };
      
      console.log(`💾 Saving mapping for user: ${userRecord.userEmail}`);
      console.log(`💾 Full userParams object:`, JSON.stringify(userParams, null, 2));
      console.log(`💾 Item keys:`, Object.keys(userRecord));
      
      await dynamoDB.put(userParams).promise();
      console.log(`✅ User mapping saved for: ${userRecord.userEmail}`);
    }
    
    console.log('✅ Team created successfully with ID:', teamId);
    res.status(201).json({ 
      message: 'Team created successfully',
      teamId: teamId,
      teamName: teamName.trim(),
      memberCount: members.length
    });
    
  } catch (err) {
    console.error('❌ Error saving team to DynamoDB:', err);
    res.status(500).json({ 
      error: 'Could not create team',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// // Fetch user's teams endpoint
// router.get('/user/:userEmail', async (req, res) => {
//   console.log('🔍 Fetching teams for user:', req.params.userEmail);
  
//   const { userEmail } = req.params;
  
//   if (!userEmail || !userEmail.trim()) {
//     return res.status(400).json({ error: 'User email is required' });
//   }

//   try {
//     const params = {
//       TableName: 'UserTeamMappings',
//       KeyConditionExpression: 'userEmail = :userEmail',
//       ExpressionAttributeValues: {
//         ':userEmail': userEmail
//       }
//     };

//     console.log('🔍 Querying DynamoDB:', params);
//     const result = await dynamoDB.query(params).promise();
    
//     const teams = result.Items.map(item => ({
//       teamId: item.teamId,
//       teamName: item.teamName,
//       status: item.status,
//       createdAt: item.createdAt
//     }));

//     console.log(`✅ Found ${teams.length} teams for user ${userEmail}`);
//     res.status(200).json({ 
//       teams: teams,
//       count: teams.length
//     });
    
//   } catch (err) {
//     console.error('❌ Error fetching teams from DynamoDB:', err);
//     res.status(500).json({ 
//       error: 'Could not fetch teams',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });

// Fetch user's teams endpoint with team details
router.get('/user/:userEmail', async (req, res) => {
  console.log('🔍 Fetching teams for user:', req.params.userEmail);
  
  const { userEmail } = req.params;
  
  if (!userEmail || !userEmail.trim()) {
    return res.status(400).json({ error: 'User email is required' });
  }

  try {
    // First, get all team mappings for the user
    const mappingParams = {
      TableName: 'UserTeamMappings',
      KeyConditionExpression: 'userEmail = :userEmail',
      ExpressionAttributeValues: {
        ':userEmail': userEmail
      }
    };

    console.log('🔍 Querying UserTeamMappings:', mappingParams);
    const mappingResult = await dynamoDB.query(mappingParams).promise();
    
    if (mappingResult.Items.length === 0) {
      console.log(`📭 No teams found for user ${userEmail}`);
      return res.status(200).json({ 
        teams: [],
        count: 0
      });
    }

    // Extract team IDs and fetch detailed team information
    const teamIds = mappingResult.Items.map(item => item.teamId);
    const teamsWithDetails = [];

    // Batch get team details to minimize API calls
    for (const teamId of teamIds) {
      try {
        const teamParams = {
          TableName: 'VaultTeams',
          Key: { teamId: teamId }
        };
        
        const teamResult = await dynamoDB.get(teamParams).promise();
        
        if (teamResult.Item) {
          // Find the user's status in this team
          const userMapping = mappingResult.Items.find(item => item.teamId === teamId);
          
          teamsWithDetails.push({
            teamId: teamResult.Item.teamId,
            teamName: teamResult.Item.teamName,
            name: teamResult.Item.teamName, // For compatibility
            members: teamResult.Item.members || [],
            memberCount: teamResult.Item.members ? teamResult.Item.members.length : 0,
            createdBy: teamResult.Item.createdBy,
            createdAt: teamResult.Item.createdAt,
            status: userMapping.status,
            userRole: userMapping.role || 'member'
          });
        }
      } catch (teamErr) {
        console.error(`❌ Error fetching team ${teamId}:`, teamErr);
        // Continue with other teams even if one fails
      }
    }

    console.log(`✅ Found ${teamsWithDetails.length} teams with details for user ${userEmail}`);
    res.status(200).json({ 
      teams: teamsWithDetails,
      count: teamsWithDetails.length
    });
    
  } catch (err) {
    console.error('❌ Error fetching teams from DynamoDB:', err);
    res.status(500).json({ 
      error: 'Could not fetch teams',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Fetch specific team details
router.get('/details/:teamId', async (req, res) => {
  console.log('🔍 Fetching team details for:', req.params.teamId);
  
  const { teamId } = req.params;
  const userEmail = req.query.userEmail; // Get user email from query params
  
  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  try {
    // Get team details
    const teamParams = {
      TableName: 'VaultTeams',
      Key: { teamId: teamId }
    };
    
    const teamResult = await dynamoDB.get(teamParams).promise();
    
    if (!teamResult.Item) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // If userEmail is provided, verify user is part of the team
    if (userEmail) {
      const userMappingParams = {
        TableName: 'UserTeamMappings',
        Key: {
          userEmail: userEmail,
          teamId: teamId
        }
      };
      
      const userMappingResult = await dynamoDB.get(userMappingParams).promise();
      
      if (!userMappingResult.Item) {
        return res.status(403).json({ error: 'Access denied: User not part of this team' });
      }
    }

    const teamDetails = {
      teamId: teamResult.Item.teamId,
      teamName: teamResult.Item.teamName,
      name: teamResult.Item.teamName,
      members: teamResult.Item.members || [],
      memberCount: teamResult.Item.members ? teamResult.Item.members.length : 0,
      createdBy: teamResult.Item.createdBy,
      createdAt: teamResult.Item.createdAt,
      updatedAt: teamResult.Item.updatedAt
    };

    console.log(`✅ Team details fetched for ${teamId}`);
    res.status(200).json({ team: teamDetails });
    
  } catch (err) {
    console.error('❌ Error fetching team details:', err);
    res.status(500).json({ 
      error: 'Could not fetch team details',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update team endpoint (for future use)
router.put('/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { teamName, userEmail } = req.body;
  
  if (!teamId || !userEmail) {
    return res.status(400).json({ error: 'Team ID and user email are required' });
  }

  try {
    // Verify user is part of the team
    const userMappingParams = {
      TableName: 'UserTeamMappings',
      Key: {
        userEmail: userEmail,
        teamId: teamId
      }
    };
    
    const userMappingResult = await dynamoDB.get(userMappingParams).promise();
    
    if (!userMappingResult.Item) {
      return res.status(403).json({ error: 'Access denied: User not part of this team' });
    }

    // Update team details
    const updateParams = {
      TableName: 'VaultTeams',
      Key: { teamId: teamId },
      UpdateExpression: 'SET teamName = :teamName, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':teamName': teamName,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(updateParams).promise();
    
    res.status(200).json({ 
      message: 'Team updated successfully',
      team: result.Attributes
    });
    
  } catch (err) {
    console.error('❌ Error updating team:', err);
    res.status(500).json({ 
      error: 'Could not update team',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


export default router;