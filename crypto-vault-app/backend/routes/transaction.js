import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../utils/awsConfig.js';

const router = express.Router();

// Create transaction endpoint
router.post('/create', async (req, res) => {
  const { type, asset, amount, recipient, memo, teamId, createdBy } = req.body;

  // Validation
  if (!type || !asset || !amount || !recipient || !teamId) {
    return res.status(400).json({
      error: 'Missing required fields: type, asset, amount, recipient, teamId'
    });
  }

  const transactionId = uuidv4();
  const transaction_id = Math.floor(100000 + Math.random() * 900000); // random 6-digit number
  const createdAt = new Date().toISOString();

  const transactionRecord = {
    transactionId,
    transaction_id, // random number
    teamId,
    type,
    asset,
    amount: parseFloat(amount),
    recipient,
    memo: memo || '',
    createdBy: createdBy || 'temp-user',
    createdAt,
    status: 'PENDING_APPROVAL',
    approvalsReceived: 0,
    approvalsNeeded: 2,
    approvals: []
  };

  try {
    const params = {
      TableName: 'Transactions',
      Item: transactionRecord
    };
    await dynamoDB.put(params).promise();
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: transactionRecord
    });
  } catch (err) {
    console.error('❌ Error saving transaction to DynamoDB:', err);
    res.status(500).json({
      error: 'Could not create transaction',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Also support POST /
router.post('/', async (req, res) => {
  const { type, asset, amount, recipient, memo, teamId, createdBy } = req.body;

  if (!type || !asset || !amount || !recipient || !teamId) {
    return res.status(400).json({
      error: 'Missing required fields: type, asset, amount, recipient, teamId'
    });
  }

  const transactionId = uuidv4();
  const transaction_id = Math.floor(100000 + Math.random() * 900000); // random 6-digit number
  const createdAt = new Date().toISOString();

  const transactionRecord = {
    transactionId,
    transaction_id, // random number
    teamId,
    type,
    asset,
    amount: parseFloat(amount),
    recipient,
    memo: memo || '',
    createdBy: createdBy || 'temp-user',
    createdAt,
    status: 'PENDING_APPROVAL',
    approvalsReceived: 0,
    approvalsNeeded: 2,
    approvals: []
  };

  try {
    const params = {
      TableName: 'Transactions',
      Item: transactionRecord
    };
    await dynamoDB.put(params).promise();
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: transactionRecord
    });
  } catch (err) {
    console.error('❌ Error saving transaction to DynamoDB:', err);
    res.status(500).json({
      error: 'Could not create transaction',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get pending transactions for a team
router.get('/pending/:teamId', async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  try {
    const params = {
      TableName: 'Transactions',
      IndexName: 'teamId-status-index', // Assumes a GSI on teamId + status
      KeyConditionExpression: 'teamId = :teamId AND #status = :pending',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':teamId': teamId,
        ':pending': 'PENDING_APPROVAL'
      }
    };
    const result = await dynamoDB.query(params).promise();
    res.status(200).json({
      transactions: result.Items || [],
      count: result.Count || 0
    });
  } catch (err) {
    console.error('❌ Error fetching pending transactions:', err);
    res.status(500).json({
      error: 'Could not fetch pending transactions',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update transaction status
router.put('/status/:transactionId', async (req, res) => {
  const { transactionId } = req.params;
  const { status } = req.body;

  if (!transactionId || !status) {
    return res.status(400).json({
      error: 'Transaction ID and status are required'
    });
  }

  try {
    // Get the transaction using the GSI
    const queryParams = {
      TableName: 'Transactions',
      IndexName: 'transactionId-index',
      KeyConditionExpression: 'transactionId = :txId',
      ExpressionAttributeValues: {
        ':txId': transactionId
      }
    };

    const queryResult = await dynamoDB.query(queryParams).promise();
    
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    const transaction = queryResult.Items[0];

    // Update the transaction status using the primary key structure
    const updateParams = {
      TableName: 'Transactions',
      Key: {
        // Assuming transaction_id is the hash key
        transaction_id: transaction.transaction_id
      },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      },
      ReturnValues: 'ALL_NEW'
    };

    console.log('Update params:', updateParams); // Add logging

    const result = await dynamoDB.update(updateParams).promise();

    res.status(200).json({
      message: 'Transaction status updated successfully',
      transaction: result.Attributes
    });
  } catch (err) {
    console.error('❌ Error updating transaction status:', err);
    res.status(500).json({
      error: 'Could not update transaction status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router; 