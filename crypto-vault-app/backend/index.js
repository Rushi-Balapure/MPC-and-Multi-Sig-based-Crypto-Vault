console.log('👋 Server is starting...');

import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { SESClient, GetSendQuotaCommand, VerifyEmailAddressCommand } from '@aws-sdk/client-ses';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import fetch from 'node-fetch';  // Add this import for making HTTP requests

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

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.options('/*', cors(corsOptions));

// Body parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session setup
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: THIRTY_DAYS,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
};
app.use(session(sessionConfig));

// Cognito setup
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_tyCJFcHdz';
const COGNITO_REGION = process.env.COGNITO_REGION || 'ap-south-1';

const client = jwksClient({
    jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

const verifyTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    }, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ message: 'Unauthorized', error: err.message });
        }

        req.user = decoded;
        req.session.user = decoded;
        req.session.isAuthenticated = true;

        next();
    });
};

// Session-protected route middleware
const sessionCheckMiddleware = (req, res, next) => {
    if (req.session?.isAuthenticated && req.session?.user) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Not authenticated. Please login.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
    }, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return res.status(401).json({ message: 'Unauthorized', error: err.message });
        }

        req.session.user = decoded;
        req.session.isAuthenticated = true;
        req.session.loginTime = new Date();
        req.user = decoded;

        next();
    });
};

// ✅ LOGIN endpoint (session created here)
app.post('/api/login', verifyTokenMiddleware, (req, res) => {
    req.session.save(err => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: 'Failed to create session', error: err.message });
        }

        // Set cookie manually if needed (not usually necessary)
        // res.cookie('connect.sid', req.sessionID, { httpOnly: true, sameSite: 'Lax' });

        res.status(200).json({
            message: 'Login successful',
            user: {
                username: req.user.username || req.user['cognito:username'],
                email: req.user.email,
                sub: req.user.sub
            },
            sessionId: req.sessionID
        });
    });
});

// ✅ Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ message: 'Logout failed', error: err.message });
        }

        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});

// ✅ Check session
app.get('/api/session', (req, res) => {
    if (req.session?.user && req.session?.isAuthenticated) {
        res.status(200).json({
            isAuthenticated: true,
            user: {
                username: req.session.user.username || req.session.user['cognito:username'],
                email: req.session.user.email,
                sub: req.session.user.sub
            },
            loginTime: req.session.loginTime
        });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});

// ✅ Session-protected route
app.get('/api/session-data', sessionCheckMiddleware, (req, res) => {
    res.json({
        message: 'This is data protected by session',
        user: req.session.user,
        data: {
            vaultInfo: "This is your crypto vault information (session protected)",
            timestamp: new Date().toISOString(),
            sessionId: req.sessionID,
            loginTime: req.session.loginTime
        }
    });
});

// ✅ Token-protected route
app.get('/api/secure-data', verifyTokenMiddleware, (req, res) => {
    res.json({
        message: 'This is secured data',
        user: req.user,
        data: {
            vaultInfo: "This is your crypto vault information",
            timestamp: new Date().toISOString()
        }
    });
});

// ✅ AWS Email verification
app.post('/api/verify-email', async (req, res) => {
    const { emails } = req.body;

    try {
        const results = [];
        for (const email of emails) {
            const result = await sesClient.send(new VerifyEmailAddressCommand({ EmailAddress: email }));
            results.push({ email, result });
        }
        res.status(200).send({ message: 'Verification emails sent', results });
    } catch (error) {
        console.error('Error verifying emails:', error);
        res.status(500).send({ error: error.message });
    }
});

// ✅ Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        session: req.sessionID,
        authenticated: req.session?.isAuthenticated || false,
        frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
    });
});

// ✅ Vault Approval Endpoint
app.post('/api/vault/approve', sessionCheckMiddleware, async (req, res) => {
    try {
        const { team_id, shard_id, shard_value } = req.body;

        // Validate required fields
        if (!team_id || !shard_id || !shard_value) {
            return res.status(400).json({
                message: 'Missing required fields. Please provide team_id, shard_id, and shard_value'
            });
        }

        // Forward the request to the external API
        const response = await fetch('https://2zfmmwd269.execute-api.ap-south-1.amazonaws.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                team_id,
                shard_id,
                shard_value
            })
        });

        const data = await response.json();

        // Forward the response back to the frontend
        res.status(response.status).json(data);

    } catch (error) {
        console.error('Error in vault approval:', error);
        res.status(500).json({
            message: 'Failed to process vault approval',
            error: error.message
        });
    }
});

// ✅ Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
    await testSESConnection();
});
