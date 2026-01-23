const path = require('path');
// Load .env only if it exists (local development)
try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
    console.log('No .env file found, using system environment variables.');
}
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const coachRoutes = require('./routes/coach');
const uploadRoutes = require('./routes/upload');
const eventsRoutes = require('./routes/events');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '../'))); // Serve root folder

// Serve Uploads - use /tmp in production (Railway/Heroku)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
const uploadsPath = isProduction
    ? path.join('/tmp', 'uploads')
    : path.join(__dirname, 'uploads');

console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/athlete', athleteRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback to index.html for SPA-like navigation (if needed)
app.get('*', (req, res) => {
    // Exclude API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
