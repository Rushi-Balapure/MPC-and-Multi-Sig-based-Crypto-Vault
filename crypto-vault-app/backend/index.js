// backend/index.js 
import dotenv from 'dotenv';
import verifyTokenMiddleware from './middleware/verifyToken.js';
dotenv.config();

console.log('👋 Server is starting...');

import express from 'express';
import session from 'express-session';
import { SESClient, GetSendQuotaCommand, VerifyEmailAddressCommand } from '@aws-sdk/client-ses';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dynamoDB from './utils/awsConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import teamRoutes from './routes/team.js';

const port = process.env.PORT || 5000;

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
// const verifyTokenMiddleware = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).json({ message: 'Missing Authorization header' });
//     }

//     const token = authHeader.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ message: 'Missing token' });
//     }

//     jwt.verify(token, getKey, {
//         algorithms: ['RS256'],
//         issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
//     }, (err, decoded) => {
//         if (err) {
//             console.error('Token verification error:', err);
//             return res.status(401).json({ message: 'Unauthorized', error: err.message });
//         }
        
//         req.user = decoded;
//         next();
//     });
// };

// Configure CORS - Single configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session middleware (for non-JWT routes)
app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Add request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST') {
        console.log('Request body:', req.body);
    }
    next();
});

// Use team routes
app.use('/api/teams', teamRoutes);

// Root test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'CryptoVault Backend Server is running',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Test cognito JWT route
app.get('/api/verify-token', verifyTokenMiddleware, (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: req.user
    });
});

// Endpoint to verify email with SES
app.post('/api/verify-email', async (req, res) => {
    const { emails } = req.body;

    console.log('📧 Emails received for verification:', emails);

    // Validate request
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ 
            error: 'Emails array is required and must not be empty' 
        });
    }

    try {
        const results = [];
        
        for (const email of emails) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                console.log(`❌ Invalid email format: ${email}`);
                return res.status(400).json({ 
                    error: `Invalid email format: ${email}` 
                });
            }

            console.log(`📧 Verifying email: ${email}`);
            const params = { EmailAddress: email };
            const command = new VerifyEmailAddressCommand(params);
            const result = await sesClient.send(command);
            results.push({ email, result, status: 'verification_sent' });
        }

        console.log('✅ All emails verified successfully');
        res.status(200).json({ 
            message: 'Verification emails sent successfully', 
            results 
        });
        
    } catch (error) {
        console.error('❌ Error verifying emails:', error);
        res.status(500).json({ 
            error: 'Failed to verify emails',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Protected data route using Cognito JWT
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'CryptoVault Backend Server is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    console.log(`🚀 CryptoVault Backend server is running on http://localhost:${PORT}`);
    console.log(`📁 Available routes:`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   POST /api/verify-email - Email verification`);
    console.log(`   POST /api/teams/create - Create team`);
    console.log(`   GET  /api/teams/list - List all teams`);
    console.log(`   GET  /api/teams/:teamId - Get specific team`);
    console.log(`   GET  /api/verify-token - Verify JWT token`);
    console.log(`   GET  /api/secure-data - Protected route`);
    
    await testSESConnection(); // Run SES connection test on startup
});