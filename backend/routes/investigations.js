const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Get investigation by appointment id
router.get('/:appointmentId', (req, res) => {
    const row = db.prepare('SELECT * FROM investigations WHERE appointment_id = ?').get(req.params.appointmentId);
    if (!row) return res.json(null);
    res.json(row);
});

// Save or Update preliminary investigation
router.post('/', authorize(['User2/User3', 'Admin']), (req, res) => {
    const { appointment_id, weight, height, pulse, bp, temperature, spo2 } = req.body;
    
    // Check if exists
    const existing = db.prepare('SELECT id FROM investigations WHERE appointment_id = ?').get(appointment_id);

    if (existing) {
        db.prepare(`
            UPDATE investigations
            SET weight = ?, height = ?, pulse = ?, bp = ?, temperature = ?, spo2 = ?
            WHERE appointment_id = ?
        `).run(weight, height, pulse, bp, temperature, spo2, appointment_id);
    } else {
        db.prepare(`
            INSERT INTO investigations (appointment_id, weight, height, pulse, bp, temperature, spo2)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(appointment_id, weight, height, pulse, bp, temperature, spo2);
    }
    
    res.json({ message: 'Investigation data saved successfully' });
});

module.exports = router;
