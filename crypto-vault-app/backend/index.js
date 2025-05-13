console.log('👋 Server is starting...');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SESClient, GetSendQuotaCommand, VerifyEmailAddressCommand } from '@aws-sdk/client-ses';

dotenv.config();  // Load environment variables from .env file

// Setup AWS SES client
const sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Test AWS SES connection
const testSESConnection = async () => {
    try {
        const result = await sesClient.send(new GetSendQuotaCommand({}));
        console.log('✅ AWS SES connection successful!');
        console.log('SES Send Quota:', result);
    } catch (error) {
        console.error('❌ AWS SES connection failed:', error.message);
    }
};

const app = express();

// 1) Configure CORS once, before any routes:
const corsOptions = {
    origin: 'http://localhost:3000',      // your React app
    methods: ['GET', 'POST', 'OPTIONS'],    // allowed methods
    allowedHeaders: ['Content-Type'],     // allowed headers
    credentials: true                     // allow cookies/auth if needed
};
app.use(cors(corsOptions));

// 2) Explicitly handle preflight for every path:
app.options('/*', cors(corsOptions));

// 3) Body parser:
app.use(express.json());


// Endpoint to verify email
app.post('/verify-email', async (req, res) => {
    const { emails } = req.body;

    console.log('Emails received from frontend:', emails);

    try {
        const results = [];
        for (const email of emails) {
            const params = { EmailAddress: email };
            const command = new VerifyEmailAddressCommand(params);
            const result = await sesClient.send(command);
            results.push({ email, result });
        }

        res.status(200).send({ message: 'Verification emails sent', results });
    } catch (error) {
        console.error('Error verifying emails:', error);
        res.status(500).send({ error: error.message });
    }

});

// Start the server
app.listen(5001, async () => {
    console.log('🚀 Backend server is running on [http://localhost:5001]');
    await testSESConnection(); // Run SES connection test on startup
});