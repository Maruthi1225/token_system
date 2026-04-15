const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Search patients (by name, phone)
router.get('/', (req, res) => {
    const { query } = req.query;
    if (!query) {
        const rows = db.prepare('SELECT * FROM patients ORDER BY id DESC LIMIT 50').all();
        return res.json(rows);
    }
    const searchStr = `%${query}%`;
    const rows = db.prepare('SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT 50').all(searchStr, searchStr);
    res.json(rows);
});

// Update patient
router.put('/:id', (req, res) => {
    const { name, gender, age, village, mandal, district, phone } = req.body;
    db.prepare(`
        UPDATE patients 
        SET name = ?, gender = ?, age = ?, village = ?, mandal = ?, district = ?, phone = ?
        WHERE id = ?
    `).run(name, gender, age, village, mandal, district, phone, req.params.id);
    res.json({ message: 'Patient updated successfully' });
});

module.exports = router;
