const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mock Auth for fast deployment. In production, use MongoDB User model.
// const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Simple hardcoded check for MVP
    if (username === 'admin' && password === '123456') {
        const token = jwt.sign({ id: 1, role: 'PT' }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
        return res.json({ token, user: { username: 'admin', role: 'PT' } });
    }

    res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
});

module.exports = router;
