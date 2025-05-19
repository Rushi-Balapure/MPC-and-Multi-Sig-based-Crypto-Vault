// index.js (Backend)
console.log('👋 Server is starting...');

import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { SESClient, GetSendQuotaCommand, VerifyEmailAddressCommand } from '@aws-sdk/client-ses';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

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

// Configure Cognito JWT verification
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_tyCJFcHdz';
const COGNITO_REGION = process.env.COGNITO_REGION || 'ap-south-1';

// Setup JWKS client for token verification
const client = jwksClient({
    jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

// JWT verification middleware
const verifyTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Missing token' });
    }

    jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    }, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ message: 'Unauthorized', error: err.message });
        }
        
        req.user = decoded;
        next();
    });
};

// 1) Configure CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// 2) Explicitly handle preflight for every path
app.options('/*', cors(corsOptions));

// 3) Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session middleware (for non-JWT routes)
app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Test cognito JWT route
app.get('/api/verify-token', verifyTokenMiddleware, (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: req.user
    });
});

// Endpoint to verify email
app.post('/api/verify-email', async (req, res) => {
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

// Protected data route using Cognito JWT
app.get('/api/secure-data', verifyTokenMiddleware, (req, res) => {
    res.json({ 
        message: 'This is secured data',
        user: req.user,
        data: {
            // Your secure data here
            vaultInfo: "This is your crypto vault information",
            timestamp: new Date().toISOString()
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 Backend server is running on [http://localhost:${PORT}]`);
    await testSESConnection(); // Run SES connection test on startup
});