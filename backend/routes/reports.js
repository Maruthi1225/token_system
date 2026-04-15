const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/daily', (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    const query = `
        SELECT a.id, a.date, a.token_number, a.visit_type, a.consultation_fee, a.comments,
               p.name as patient_name, p.phone as patient_phone, p.age, p.gender,
               d.name as doctor_name, r.name as referral_name, b.name as batch_name, 
               pm.name as payment_mode
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN referrals r ON a.referral_id = r.id
        LEFT JOIN batches b ON a.batch_id = b.id
        LEFT JOIN payment_modes pm ON a.payment_mode_id = pm.id
        WHERE a.date = ?
        ORDER BY a.token_number ASC
    `;

    const rows = db.prepare(query).all(date);
    res.json(rows);
});

router.get('/patient/:patientId', (req, res) => {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    let query = `
        SELECT a.id, a.date, a.token_number, a.visit_type, a.consultation_fee, a.comments, a.appointment_time,
               d.name as doctor_name, b.name as batch_name,
               i.weight, i.height, i.pulse, i.bp, i.temperature, i.spo2
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN batches b ON a.batch_id = b.id
        LEFT JOIN investigations i ON i.appointment_id = a.id
        WHERE a.patient_id = ?
    `;

    const params = [patientId];

    if (startDate) {
        query += ' AND a.date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND a.date <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY a.date DESC';

    const appointments = db.prepare(query).all(...params);

    res.json({ patient, appointments });
});

module.exports = router;
