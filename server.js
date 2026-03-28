require('dotenv').config({ path: '../../server/.env' });
const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

app.use(express.json());

// Serve the Admin frontend files (admin.html, admin.js, etc.)
app.use(express.static(path.join(__dirname, '..')));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Admin Server: Database connection failed:', err.message);
        process.exit(1);
    }
    console.log('Admin Server: Connected to Database');
});

const ALGORITHM = 'aes-256-cbc';

function decrypt(text) {
    if (!text) return '';
    
    // Basic validation: Encrypted hex strings must be even length and 
    // at least 32 characters long for a single AES block.
    const isHex = /^[0-9a-fA-F]+$/.test(text);
    if (!isHex || text.length % 2 !== 0 || text.length < 32) {
        return text; // Return as is (likely plain text)
    }

    try {
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
        const iv = Buffer.from(process.env.ENCRYPTION_IV, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // Fallback for legacy data that looks like hex but isn't ciphertext
        return text;
    }
}

app.get('/api/admin/db-status', (req, res) => {
    db.query('SELECT 1', (err) => {
        if (err) {
            return res.json({ status: 'not connected' });
        }
        res.json({ status: 'connected' });
    });
});

app.get('/api/admin/messages', (req, res) => {
    const query = 'SELECT * FROM Contact_data ORDER BY CreatedAt DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const decryptedResults = results.map(row => ({
            id: row.UserID,
            userName: decrypt(row.UserName),
            email: decrypt(row.Email),
            message: decrypt(row.Message),
            date: row.CreatedAt
        }));
        res.json(decryptedResults);
    });
});

app.delete('/api/admin/messages/:id', (req, res) => {
    const query = 'DELETE FROM Contact_data WHERE UserID = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Message deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Admin backend running on http://localhost:${PORT}`);
    console.log(`Access the panel at http://localhost:${PORT}/admin.html`);
});