console.log('👋 Server is starting...');

import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'yourSecretKey', // TODO: use process.env.SESSION_SECRET in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set true if using HTTPS
}));
// Dummy users (replace with DB later)
/*const users = {
    alice: 'password123',
    bob: 'securepass'
};*/
const users = {
    'alice@example.com': 'password123',
    'bob@example.com': 'securepass'
};


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
// Login route
/*app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.user = username;
        return res.status(200).send({ message: 'Login successful' });
    }
    res.status(401).send({ error: 'Invalid credentials' });
}); */
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (users[email] && users[email] === password) {
        req.session.user = email;
        return res.status(200).send({ message: 'Login successful' });
    }
    res.status(401).send({ error: 'Invalid credentials' });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(200).send({ message: 'Logged out' });
    });
});

// Middleware to check login
function requireLogin(req, res, next) {
    if (req.session.user) return next();
    res.status(401).send({ error: 'Not authenticated' });
}

// Protected dashboard route
app.get('/dashboard', requireLogin, (req, res) => {
    res.send({ message: `Welcome, ${req.session.user}` });
});


// Start the server
app.listen(5001, async () => {
    console.log('🚀 Backend server is running on [http://localhost:5001]');
    await testSESConnection(); // Run SES connection test on startup
});