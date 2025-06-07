import express from 'express';
const router = express.Router();
//const express = require('express');
//const router = express.Router();
//const { v4: uuidv4 } = require('uuid');
import { v4 as uuidv4 } from 'uuid';

import dynamoDB from '../utils/awsConfig.js';
//const dynamoDB = require('../utils/awsConfig');

router.post('/create', async (req, res) => {
  const { teamName, members } = req.body;

  if (!teamName || !Array.isArray(members)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const params = {
    TableName: 'VaultTeams', // ✅ Match your actual table name
    Item: {
      teamId: uuidv4(),          // ✅ Must match partition key name
      teamName: teamName,
      members: members,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await dynamoDB.put(params).promise();
    res.status(201).json({ message: 'Team created successfully' });
  } catch (err) {
    console.error('Error saving team:', err);
    res.status(500).json({ error: 'Could not create team' });
  }
});

export default router;
