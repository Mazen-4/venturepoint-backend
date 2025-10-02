const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const pool = require('../server').pool || require('mysql2').createPool({
    host: "148.72.3.185",
    user: "vp_DBAdmin",
    password: "Vp_ed#2025%1624*P@s$",
    database: "venturepoint_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET image by ID (from uploads table)
router.get('/image/:id', (req, res) => {
    const { id } = req.params;
    pool.query('SELECT mimetype, data FROM uploads WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Image fetch error:', err);
            return res.status(500).json({ error: 'Failed to load image' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }
        const { mimetype, data } = results[0];
        res.setHeader('Content-Type', mimetype || 'image/jpeg');
        res.send(data);
    });
});

module.exports = router;
