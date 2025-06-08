// backend/routes/team.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../utils/awsConfig.js';
import verifyTokenMiddleware from '../middleware/verifyToken.js';

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

  // Validate each member has an email
  for (let i = 0; i < members.length; i++) {
    if (!members[i].email || !members[i].email.trim()) {
      console.log(`❌ Member ${i + 1} is missing email`);
      return res.status(400).json({ error: `Member ${i + 1} must have an email address` });
    }
  }

  const teamId = uuidv4();
  const params = {
    TableName: 'VaultTeams', // Make sure this matches your actual DynamoDB table name
    Item: {
      teamId: teamId,
      teamName: teamName.trim(),
      members: members,
      createdAt: new Date().toISOString(),
      status: 'active'
    },
  };

  try {
    console.log('💾 Saving team to DynamoDB:', params);
    await dynamoDB.put(params).promise();
    
    console.log('✅ Team created successfully with ID:', teamId);
    res.status(201).json({ 
      message: 'Team created successfully',
      teamId: teamId,
      teamName: teamName.trim()
    });
    
  } catch (err) {
    console.error('❌ Error saving team to DynamoDB:', err);
    res.status(500).json({ 
      error: 'Could not create team',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all teams (optional - for listing teams)
router.get('/list', async (req, res) => {
  const params = {
    TableName: 'VaultTeams'
  };

  try {
    const result = await dynamoDB.scan(params).promise();
    console.log('📋 Retrieved teams:', result.Items.length);
    
    res.status(200).json({
      message: 'Teams retrieved successfully',
      teams: result.Items
    });
    
  } catch (err) {
    console.error('❌ Error retrieving teams:', err);
    res.status(500).json({ 
      error: 'Could not retrieve teams',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get specific team by ID (optional)
router.get('/:teamId', async (req, res) => {
  const { teamId } = req.params;

  const params = {
    TableName: 'VaultTeams',
    Key: {
      teamId: teamId
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('📋 Retrieved team:', teamId);
    res.status(200).json({
      message: 'Team retrieved successfully',
      team: result.Item
    });
    
  } catch (err) {
    console.error('❌ Error retrieving team:', err);
    res.status(500).json({ 
      error: 'Could not retrieve team',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/// testing only

// Get teams where logged-in user is a member
router.get('/user', verifyTokenMiddleware, async (req, res) => {
  const userEmail = req.user.email;

  const params = {
    TableName: 'VaultTeams'
  };

  try {
    const result = await dynamoDB.scan(params).promise();

    // Filter teams where the user's email is present in members list
    const userTeams = result.Items.filter(team => 
      team.members.some(member => member.email === userEmail)
    );

    console.log(`📋 ${userTeams.length} teams found for user: ${userEmail}`);

    res.status(200).json({
      message: 'Teams retrieved successfully',
      teams: userTeams
    });

  } catch (err) {
    console.error('❌ Error retrieving user teams:', err);
    res.status(500).json({ 
      error: 'Could not retrieve user teams',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


export default router;