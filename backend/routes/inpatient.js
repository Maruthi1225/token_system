const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ========================
// WARDS & BEDS API
// ========================

// Get all wards with their beds
router.get('/wards', (req, res) => {
    try {
        const wards = db.prepare('SELECT * FROM wards').all();
        const beds = db.prepare('SELECT * FROM beds').all();
        
        const wardsWithBeds = wards.map(ward => ({
            ...ward,
            beds: beds.filter(bed => bed.ward_id === ward.id)
        }));
        
        res.json(wardsWithBeds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new ward
router.post('/wards', (req, res) => {
    try {
        const { name, type, cost_per_day, number_of_beds } = req.body;
        if (!name || !type || !cost_per_day) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        db.prepare('BEGIN').run();
        
        const stmt = db.prepare('INSERT INTO wards (name, type, cost_per_day) VALUES (?, ?, ?)');
        const result = stmt.run(name, type, cost_per_day);
        const wardId = result.lastInsertRowid;
        
        if (number_of_beds && parseInt(number_of_beds) > 0) {
            const insertBed = db.prepare('INSERT INTO beds (ward_id, bed_number) VALUES (?, ?)');
            const count = parseInt(number_of_beds);
            for (let i = 1; i <= count; i++) {
                insertBed.run(wardId, `Bed ${i}`);
            }
        }
        
        db.prepare('COMMIT').run();
        
        res.status(201).json({ id: wardId, name, type, cost_per_day });
    } catch (err) {
        if(db.inTransaction) db.prepare('ROLLBACK').run();
        res.status(500).json({ error: err.message });
    }
});

// Delete a ward (only if no beds are occupied or no beds exist)
router.delete('/wards/:id', (req, res) => {
    try {
        const { id } = req.params;
        const beds = db.prepare('SELECT * FROM beds WHERE ward_id = ?').all(id);
        
        const occupiedBed = beds.find(b => b.status === 'Occupied');
        if (occupiedBed) {
            return res.status(400).json({ error: 'Cannot delete ward with occupied beds.' });
        }

        db.prepare('BEGIN').run();
        db.prepare('DELETE FROM beds WHERE ward_id = ?').run(id);
        db.prepare('DELETE FROM wards WHERE id = ?').run(id);
        db.prepare('COMMIT').run();

        res.json({ message: 'Ward and its beds deleted successfully.' });
    } catch (err) {
        db.prepare('ROLLBACK').run();
        res.status(500).json({ error: err.message });
    }
});

// Add a bed
router.post('/beds', (req, res) => {
    try {
        const { ward_id, bed_number } = req.body;
        if (!ward_id || !bed_number) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const stmt = db.prepare('INSERT INTO beds (ward_id, bed_number) VALUES (?, ?)');
        const result = stmt.run(ward_id, bed_number);
        
        res.status(201).json({ id: result.lastInsertRowid, ward_id, bed_number, status: 'Available' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a bed
router.delete('/beds/:id', (req, res) => {
    try {
        const { id } = req.params;
        const bed = db.prepare('SELECT * FROM beds WHERE id = ?').get(id);
        if (!bed) return res.status(404).json({ error: 'Bed not found' });
        if (bed.status === 'Occupied') {
            return res.status(400).json({ error: 'Cannot delete an occupied bed.' });
        }

        db.prepare('DELETE FROM beds WHERE id = ?').run(id);
        res.json({ message: 'Bed deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk add beds to a ward
router.post('/wards/:id/bulk-beds', (req, res) => {
    try {
        const { id } = req.params;
        const { count } = req.body;
        
        if (!count || parseInt(count) <= 0) {
            return res.status(400).json({ error: 'Invalid count' });
        }
        
        const ward = db.prepare('SELECT * FROM wards WHERE id = ?').get(id);
        if (!ward) return res.status(404).json({ error: 'Ward not found' });
        
        const currentCount = db.prepare('SELECT COUNT(*) as c FROM beds WHERE ward_id = ?').get(id).c;
        const numCount = parseInt(count);
        
        db.prepare('BEGIN').run();
        const insertBed = db.prepare('INSERT INTO beds (ward_id, bed_number) VALUES (?, ?)');
        for(let i=1; i<=numCount; i++) {
            insertBed.run(id, `Bed ${currentCount + i}`);
        }
        db.prepare('COMMIT').run();
        
        res.status(201).json({ message: `${numCount} beds added successfully` });
    } catch (err) {
        if(db.inTransaction) db.prepare('ROLLBACK').run();
        res.status(500).json({ error: err.message });
    }
});

// ========================
// ADMISSIONS API
// ========================

// Get active admissions
router.get('/admissions', (req, res) => {
    try {
        const query = `
            SELECT a.*, p.name as patient_name, p.phone as patient_phone, 
                   b.bed_number, w.name as ward_name, w.cost_per_day
            FROM admissions a
            JOIN patients p ON a.patient_id = p.id
            JOIN beds b ON a.bed_id = b.id
            JOIN wards w ON b.ward_id = w.id
            WHERE a.status = 'Admitted'
        `;
        const admissions = db.prepare(query).all();
        res.json(admissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admit a patient
router.post('/admissions', (req, res) => {
    try {
        const { patient_id, bed_id, advance_payment } = req.body;
        if (!patient_id || !bed_id) {
            return res.status(400).json({ error: 'Missing patient_id or bed_id' });
        }

        const bed = db.prepare('SELECT * FROM beds WHERE id = ?').get(bed_id);
        if (!bed || bed.status === 'Occupied') {
            return res.status(400).json({ error: 'Bed is not available.' });
        }

        const admission_date = new Date().toISOString();
        
        db.prepare('BEGIN').run();
        
        const stmt = db.prepare('INSERT INTO admissions (patient_id, bed_id, admission_date, advance_payment) VALUES (?, ?, ?, ?)');
        const result = stmt.run(patient_id, bed_id, admission_date, advance_payment || 0);
        
        db.prepare("UPDATE beds SET status = 'Occupied' WHERE id = ?").run(bed_id);
        
        db.prepare('COMMIT').run();
        
        res.status(201).json({ id: result.lastInsertRowid, patient_id, bed_id, admission_date, advance_payment, status: 'Admitted' });
    } catch (err) {
        if(db.inTransaction) db.prepare('ROLLBACK').run();
        res.status(500).json({ error: err.message });
    }
});

// Get specific admission details (including services)
router.get('/admissions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender, p.phone as patient_phone, 
                   b.bed_number, w.name as ward_name, w.cost_per_day
            FROM admissions a
            JOIN patients p ON a.patient_id = p.id
            JOIN beds b ON a.bed_id = b.id
            JOIN wards w ON b.ward_id = w.id
            WHERE a.id = ?
        `;
        const admission = db.prepare(query).get(id);
        if (!admission) return res.status(404).json({ error: 'Admission not found' });

        const services = db.prepare('SELECT * FROM inpatient_services WHERE admission_id = ?').all(id);
        admission.services = services;
        
        res.json(admission);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a service/treatment
router.post('/services', (req, res) => {
    try {
        const { admission_id, service_name, cost, quantity } = req.body;
        if (!admission_id || !service_name || cost === undefined || quantity === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const total = parseFloat(cost) * parseInt(quantity);
        const date = new Date().toISOString();
        
        const stmt = db.prepare('INSERT INTO inpatient_services (admission_id, service_name, cost, quantity, total, date) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(admission_id, service_name, cost, quantity, total, date);
        
        res.status(201).json({ id: result.lastInsertRowid, admission_id, service_name, cost, quantity, total, date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a service
router.delete('/services/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM inpatient_services WHERE id = ?').run(id);
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Discharge patient
router.put('/admissions/:id/discharge', (req, res) => {
    try {
        const { id } = req.params;
        const { total_billed, balance_paid, payment_mode_id } = req.body;
        
        const admission = db.prepare('SELECT * FROM admissions WHERE id = ?').get(id);
        if (!admission) return res.status(404).json({ error: 'Admission not found' });
        if (admission.status === 'Discharged') return res.status(400).json({ error: 'Patient already discharged' });

        const discharge_date = new Date().toISOString();
        
        db.prepare('BEGIN').run();
        
        // Update admission
        db.prepare(`
            UPDATE admissions 
            SET status = 'Discharged', 
                discharge_date = ?,
                total_billed = ?,
                balance_paid = ?,
                payment_mode_id = ?
            WHERE id = ?
        `).run(discharge_date, total_billed || 0, balance_paid || 0, payment_mode_id || null, id);
        
        // Free bed
        db.prepare("UPDATE beds SET status = 'Available' WHERE id = ?").run(admission.bed_id);
        
        db.prepare('COMMIT').run();
        
        res.json({ message: 'Patient discharged successfully', discharge_date });
    } catch (err) {
        if(db.inTransaction) db.prepare('ROLLBACK').run();
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
