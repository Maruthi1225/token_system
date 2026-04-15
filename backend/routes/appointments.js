const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Create an appointment (and optionally register a new patient)
router.post('/', (req, res) => {
    const { 
        visit_type, // "New" or "Old"
        patient_id, // Exists if "Old"
        name, gender, age, village, mandal, district, phone,
        doctor_id, referral_id, batch_id, appointment_time, payment_mode_id, consultation_fee, comments, 
        date // "YYYY-MM-DD"
    } = req.body;

    const tx = db.transaction(() => {
        let finalPatientId = patient_id;

        // If New, insert patient
        if (visit_type === 'New' || !finalPatientId) {
            const pInfo = db.prepare(`
                INSERT INTO patients (name, gender, age, village, mandal, district, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(name, gender, age, village, mandal, district, phone);
            finalPatientId = pInfo.lastInsertRowid;
        } else {
            // Update old patient details in case they changed
            db.prepare(`
                UPDATE patients 
                SET name = ?, gender = ?, age = ?, village = ?, mandal = ?, district = ?, phone = ?
                WHERE id = ?
            `).run(name, gender, age, village, mandal, district, phone, finalPatientId);
        }

        const apptDate = date || new Date().toISOString().split('T')[0];

        // Generate token number for the day and batch
        const lastTokenRow = db.prepare(`
            SELECT MAX(token_number) as maxToken FROM appointments WHERE date = ? AND batch_id = ?
        `).get(apptDate, batch_id);
        const nextToken = (lastTokenRow.maxToken || 0) + 1;

        // Insert appointment
        const aInfo = db.prepare(`
            INSERT INTO appointments (
                patient_id, date, visit_type, doctor_id, referral_id, batch_id, 
                appointment_time, payment_mode_id, consultation_fee, comments, token_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            finalPatientId, apptDate, visit_type, doctor_id, referral_id, batch_id,
            appointment_time, payment_mode_id, consultation_fee, comments, nextToken
        );

        return { appointment_id: aInfo.lastInsertRowid, token_number: nextToken };
    });

    try {
        const result = tx();
        res.json({ message: 'Appointment created successfully', ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating appointment' });
    }
});

// Get appointments for a date
router.get('/', (req, res) => {
    const { date, tokenQuery } = req.query;
    let query = `
        SELECT a.*, p.name as patient_name, p.phone as patient_phone, p.gender, p.age,
               d.name as doctor_name, b.name as batch_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN batches b ON a.batch_id = b.id
        WHERE 1=1
    `;
    const params = [];

    if (date) {
        query += ' AND a.date = ?';
        params.push(date);
    }
    if (tokenQuery) {
        query += ' AND a.token_number = ?';
        params.push(tokenQuery);
    }
    query += ' ORDER BY a.token_number ASC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
});

// Update appointment
router.put('/:id', (req, res) => {
    const { doctor_id, batch_id, appointment_time, payment_mode_id, consultation_fee, comments } = req.body;
    db.prepare(`
        UPDATE appointments
        SET doctor_id = ?, batch_id = ?, appointment_time = ?, payment_mode_id = ?, consultation_fee = ?, comments = ?
        WHERE id = ?
    `).run(doctor_id, batch_id, appointment_time, payment_mode_id, consultation_fee, comments, req.params.id);
    
    res.json({ message: 'Appointment updated successfully' });
});

// Delete and resequence
router.delete('/:id', authorize(['Admin']), (req, res) => {
    const { id } = req.params;

    const tx = db.transaction(() => {
        const apptRow = db.prepare('SELECT date, batch_id, token_number FROM appointments WHERE id = ?').get(id);
        if (!apptRow) throw new Error('Appointment not found');

        // Delete investigation first as it's linked
        db.prepare('DELETE FROM investigations WHERE appointment_id = ?').run(id);

        // Delete appointment
        db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

        // Resequence tokens for the same date and batch > deleted token
        const toUpdate = db.prepare(`
            SELECT id, token_number FROM appointments 
            WHERE date = ? AND batch_id = ? AND token_number > ? 
            ORDER BY token_number ASC
        `).all(apptRow.date, apptRow.batch_id, apptRow.token_number);

        const stmt = db.prepare('UPDATE appointments SET token_number = ? WHERE id = ?');
        let currentToken = apptRow.token_number;
        for (const row of toUpdate) {
            stmt.run(currentToken, row.id);
            currentToken++;
        }
    });

    try {
        tx();
        res.json({ message: 'Appointment deleted and tokens resequenced' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Delete failed', error: error.message });
    }
});

module.exports = router;
