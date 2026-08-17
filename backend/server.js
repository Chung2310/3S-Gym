const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
// Set high body limit for Base64 photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/nutrition', require('./routes/nutrition'));

// Serve static assets in production (if public folder exists)
const path = require('path');
const fs = require('fs');
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(publicPath, 'index.html'));
        } else {
            res.status(404).json({ message: 'API Route Not Found' });
        }
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
