const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcrypt');

router.use(authenticate);

// --- DOCTORS ---
router.get('/doctors', (req, res) => {
    const rows = db.prepare('SELECT * FROM doctors').all();
    res.json(rows);
});
router.post('/doctors', authorize(['Admin']), (req, res) => {
    const { name, details } = req.body;
    const stmt = db.prepare('INSERT INTO doctors (name, details) VALUES (?, ?)');
    const info = stmt.run(name, details);
    res.json({ id: info.lastInsertRowid, name, details });
});
router.put('/doctors/:id', authorize(['Admin']), (req, res) => {
    const { name, details } = req.body;
    db.prepare('UPDATE doctors SET name = ?, details = ? WHERE id = ?').run(name, details, req.params.id);
    res.json({ message: 'Doctor updated' });
});

// --- REFERRALS ---
router.get('/referrals', (req, res) => {
    const rows = db.prepare('SELECT * FROM referrals').all();
    res.json(rows);
});
router.post('/referrals', authorize(['Admin']), (req, res) => {
    const { type, name } = req.body;
    const info = db.prepare('INSERT INTO referrals (type, name) VALUES (?, ?)').run(type, name);
    res.json({ id: info.lastInsertRowid, type, name });
});

// --- BATCHES ---
router.get('/batches', (req, res) => {
    const rows = db.prepare('SELECT * FROM batches').all();
    res.json(rows);
});
router.post('/batches', authorize(['Admin']), (req, res) => {
    const { name } = req.body;
    const info = db.prepare('INSERT INTO batches (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid, name });
});

// --- PAYMENT MODES ---
router.get('/payment-modes', (req, res) => {
    const rows = db.prepare('SELECT * FROM payment_modes').all();
    res.json(rows);
});
router.post('/payment-modes', authorize(['Admin']), (req, res) => {
    const { name } = req.body;
    const info = db.prepare('INSERT INTO payment_modes (name) VALUES (?)').run(name);
    res.json({ id: info.lastInsertRowid, name });
});

// --- USERS (Admin Only) ---
router.get('/users', authorize(['Admin']), (req, res) => {
    const rows = db.prepare('SELECT id, username, role FROM users').all();
    res.json(rows);
});
router.post('/users', authorize(['Admin']), (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hash = bcrypt.hashSync(password, 10);
        const info = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, role);
        res.json({ id: info.lastInsertRowid, username, role });
    } catch (error) {
        res.status(400).json({ message: 'User might already exist' });
    }
});

module.exports = router;
