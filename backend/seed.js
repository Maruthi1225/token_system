const db = require('./db/database');
const bcrypt = require('bcrypt');

const seed = () => {
    // Check if doctors are empty
    const doctorsCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
    if (doctorsCount === 0) {
        console.log('Seeding dummy data...');
        
        // Add Doctors
        db.prepare("INSERT INTO doctors (name, details) VALUES ('Dr. Vanamala', 'General Physician')").run();
        db.prepare("INSERT INTO doctors (name, details) VALUES ('Dr. Sharma', 'Pediatrician')").run();

        // Add Referrals
        db.prepare("INSERT INTO referrals (type, name) VALUES ('RMP', 'Suresh Kumar')").run();
        db.prepare("INSERT INTO referrals (type, name) VALUES ('Doctor', 'Dr. Ramesh')").run();
        db.prepare("INSERT INTO referrals (type, name) VALUES ('Self', 'Walk-in')").run();

        // Add Batches
        db.prepare("INSERT INTO batches (name) VALUES ('Morning Batch (9 AM - 1 PM)')").run();
        db.prepare("INSERT INTO batches (name) VALUES ('Evening Batch (5 PM - 9 PM)')").run();

        // Add Payment Modes
        db.prepare("INSERT INTO payment_modes (name) VALUES ('Cash')").run();
        db.prepare("INSERT INTO payment_modes (name) VALUES ('UPI / PhonePe')").run();

        // Add Users
        const hash = bcrypt.hashSync('user1', 10);
        db.prepare("INSERT INTO users (username, password, role) VALUES ('receptionist', ?, 'User1')").run(hash);
        db.prepare("INSERT INTO users (username, password, role) VALUES ('nurse', ?, 'User2/User3')").run(hash);

        // Add Patients & Appointments for Today's date
        const today = new Date().toISOString().split('T')[0];
        
        const tx = db.transaction(() => {
            const p1 = db.prepare("INSERT INTO patients (name, gender, age, village, mandal, district, phone) VALUES ('Venkat Reddy', 'Male', 45, 'Ameenpur', 'Patancheru', 'Sangareddy', '9876543210')").run();
            const p2 = db.prepare("INSERT INTO patients (name, gender, age, village, mandal, district, phone) VALUES ('Lakshmi', 'Female', 32, 'Miyapur', 'Serilingampally', 'Ranga Reddy', '9988776655')").run();
            
            // Appt 1
            const a1 = db.prepare(`
                INSERT INTO appointments (patient_id, date, visit_type, doctor_id, referral_id, batch_id, appointment_time, payment_mode_id, consultation_fee, comments, token_number)
                VALUES (?, ?, 'New', 1, 3, 1, '10:30', 1, 500, 'Fever and cough', 1)
            `).run(p1.lastInsertRowid, today);

            // Appt 2
            const a2 = db.prepare(`
                INSERT INTO appointments (patient_id, date, visit_type, doctor_id, referral_id, batch_id, appointment_time, payment_mode_id, consultation_fee, comments, token_number)
                VALUES (?, ?, 'New', 2, 1, 2, '18:00', 2, 400, 'Routine checkup', 2)
            `).run(p2.lastInsertRowid, today);

            // Add an investigation for Appt 1
            db.prepare(`
                INSERT INTO investigations (appointment_id, weight, height, pulse, bp, temperature, spo2)
                VALUES (?, 75.5, 170, 85, '130/85', 101.2, 98)
            `).run(a1.lastInsertRowid);
        });

        tx();
        console.log('Seeding completed successfully!');
    } else {
        console.log('Data already exists, skipping seed.');
    }
};

seed();
