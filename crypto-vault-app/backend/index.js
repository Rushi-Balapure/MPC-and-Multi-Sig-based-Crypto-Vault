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
        
        // Store user info in both request and session if session exists
        req.user = decoded;
        if (req.session) {
            req.session.user = decoded;
            req.session.isAuthenticated = true;
        }
        next();
    });
};

// Session check middleware (for routes that need session validation)
const sessionCheckMiddleware = (req, res, next) => {
    // First check if there's a valid session
    if (req.session && req.session.isAuthenticated && req.session.user) {
        next();
        return;
    }
    
    // If no valid session, check for Cognito token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Not authenticated. Please login.' });
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
        
        // Store user info in both request and create a session
        req.user = decoded;
        req.session.user = decoded;
        req.session.isAuthenticated = true;
        req.session.loginTime = new Date();
        
        next();
    });
};

// 1) Configure CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// 2) Explicitly handle preflight for every path
app.options('/*', cors(corsOptions));

// 3) Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enhanced session configuration
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: THIRTY_DAYS, // 30 days
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Allows cross-site requests with credentials
    }
};

// Apply session middleware
app.use(session(sessionConfig));

// Login endpoint - Create a session when a user logs in with Cognito token
app.post('/api/login', verifyTokenMiddleware, (req, res) => {
    // verifyTokenMiddleware already verified the JWT and stored user data in req.user
    // Explicitly set session data
    req.session.user = req.user;
    req.session.isAuthenticated = true;
    req.session.loginTime = new Date();
    
    // Save the session
    req.session.save(err => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: 'Failed to create session', error: err.message });
        }
        
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

// Logout endpoint
app.post('/api/logout', (req, res) => {
    // Clear the session
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ message: 'Logout failed', error: err.message });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Get current session user
app.get('/api/session', (req, res) => {
    if (req.session && req.session.user && req.session.isAuthenticated) {
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
        res.status(200).json({
            isAuthenticated: false
        });
    }
});

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

// Protected data route using JWT
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

// Protected data route using session
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

// Session status check
app.get('/api/session-status', (req, res) => {
    res.json({
        hasSession: !!req.session,
        isAuthenticated: req.session?.isAuthenticated || false,
        sessionID: req.sessionID || null,
        sessionExpires: req.session?.cookie?._expires || null
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        sessionConfig: {
            secure: sessionConfig.cookie.secure,
            maxAge: sessionConfig.cookie.maxAge,
            usingCognitoAuth: true
        }
    });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 Backend server is running on [http://localhost:${PORT}]`);
    await testSESConnection(); // Run SES connection test on startup
});