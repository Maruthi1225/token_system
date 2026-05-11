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
    
    // Inpatient Advances collected today
    const advancesQuery = `
        SELECT a.id, a.admission_date, a.advance_payment, p.name as patient_name,
               w.name as ward_name, b.bed_number
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        JOIN beds b ON a.bed_id = b.id
        JOIN wards w ON b.ward_id = w.id
        WHERE date(a.admission_date) = ? AND a.advance_payment > 0
    `;
    const inpatientAdvances = db.prepare(advancesQuery).all(date);

    // Inpatient Settlements (Discharge) collected today
    const settlementsQuery = `
        SELECT a.id, a.discharge_date, a.total_billed, a.balance_paid, p.name as patient_name,
               w.name as ward_name, b.bed_number, pm.name as payment_mode
        FROM admissions a
        JOIN patients p ON a.patient_id = p.id
        JOIN beds b ON a.bed_id = b.id
        JOIN wards w ON b.ward_id = w.id
        LEFT JOIN payment_modes pm ON a.payment_mode_id = pm.id
        WHERE date(a.discharge_date) = ? AND a.balance_paid > 0
    `;
    const inpatientSettlements = db.prepare(settlementsQuery).all(date);

    res.json({ 
        appointments: rows,
        inpatientAdvances,
        inpatientSettlements
    });
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

    let admQuery = `
        SELECT a.*, b.bed_number, w.name as ward_name, w.cost_per_day
        FROM admissions a
        JOIN beds b ON a.bed_id = b.id
        JOIN wards w ON b.ward_id = w.id
        WHERE a.patient_id = ?
    `;

    const params = [patientId];
    const admParams = [patientId];

    if (startDate) {
        query += ' AND a.date >= ?';
        admQuery += " AND date(a.admission_date) >= ?";
        params.push(startDate);
        admParams.push(startDate);
    }
    if (endDate) {
        query += ' AND a.date <= ?';
        admQuery += " AND date(a.admission_date) <= ?";
        params.push(endDate);
        admParams.push(endDate);
    }

    query += ' ORDER BY a.date DESC';
    admQuery += ' ORDER BY a.admission_date DESC';

    const appointments = db.prepare(query).all(...params);
    const admissions = db.prepare(admQuery).all(...admParams);

    // Fetch services for each admission
    for (let adm of admissions) {
        adm.services = db.prepare('SELECT * FROM inpatient_services WHERE admission_id = ?').all(adm.id);
    }

    res.json({ patient, appointments, admissions });
});

module.exports = router;
