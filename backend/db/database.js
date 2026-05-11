const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const initDb = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payment_modes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            gender TEXT,
            age INTEGER,
            village TEXT,
            mandal TEXT,
            district TEXT,
            phone TEXT
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            date TEXT NOT NULL,
            visit_type TEXT NOT NULL,
            doctor_id INTEGER,
            referral_id INTEGER,
            batch_id INTEGER,
            appointment_time TEXT,
            payment_mode_id INTEGER,
            consultation_fee REAL,
            comments TEXT,
            token_number INTEGER,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(doctor_id) REFERENCES doctors(id),
            FOREIGN KEY(referral_id) REFERENCES referrals(id),
            FOREIGN KEY(batch_id) REFERENCES batches(id),
            FOREIGN KEY(payment_mode_id) REFERENCES payment_modes(id)
        );

        CREATE TABLE IF NOT EXISTS investigations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER UNIQUE,
            weight REAL,
            height REAL,
            pulse INTEGER,
            bp TEXT,
            temperature REAL,
            spo2 INTEGER,
            FOREIGN KEY(appointment_id) REFERENCES appointments(id)
        );

        CREATE TABLE IF NOT EXISTS wards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            cost_per_day REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS beds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_id INTEGER NOT NULL,
            bed_number TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Available',
            FOREIGN KEY(ward_id) REFERENCES wards(id)
        );

        CREATE TABLE IF NOT EXISTS admissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            bed_id INTEGER NOT NULL,
            admission_date TEXT NOT NULL,
            discharge_date TEXT,
            status TEXT NOT NULL DEFAULT 'Admitted',
            advance_payment REAL DEFAULT 0,
            total_billed REAL DEFAULT 0,
            balance_paid REAL DEFAULT 0,
            payment_mode_id INTEGER,
            FOREIGN KEY(patient_id) REFERENCES patients(id),
            FOREIGN KEY(bed_id) REFERENCES beds(id),
            FOREIGN KEY(payment_mode_id) REFERENCES payment_modes(id)
        );

        CREATE TABLE IF NOT EXISTS inpatient_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admission_id INTEGER NOT NULL,
            service_name TEXT NOT NULL,
            cost REAL NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            total REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY(admission_id) REFERENCES admissions(id)
        );
    `);

    // Check if admin user exists, if not create one
    const checkUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!checkUser) {
        const hash = bcrypt.hashSync('admin', 10);
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'Admin');
        console.log('Default Admin user created (admin:admin)');
    }

    // Seed wards and beds if none exist
    const wardsCount = db.prepare('SELECT COUNT(*) as count FROM wards').get().count;
    if (wardsCount === 0) {
        const insertWard = db.prepare('INSERT INTO wards (name, type, cost_per_day) VALUES (?, ?, ?)');
        const insertBed = db.prepare('INSERT INTO beds (ward_id, bed_number) VALUES (?, ?)');
        
        // ICU 1
        const icu1 = insertWard.run('ICU 1', 'ICU', 2000);
        for(let i=1; i<=25; i++) insertBed.run(icu1.lastInsertRowid, `Bed ${i}`);

        // ICU 2
        const icu2 = insertWard.run('ICU 2', 'ICU', 5000);
        for(let i=1; i<=25; i++) insertBed.run(icu2.lastInsertRowid, `Bed ${i}`);

        // General Ward 1
        const gw1 = insertWard.run('General Ward 1', 'General', 750);
        for(let i=1; i<=100; i++) insertBed.run(gw1.lastInsertRowid, `Bed ${i}`);

        // General Ward 2
        const gw2 = insertWard.run('General Ward 2', 'General', 750);
        for(let i=1; i<=100; i++) insertBed.run(gw2.lastInsertRowid, `Bed ${i}`);

        console.log('Dummy wards and beds seeded.');
    }
};

initDb();

module.exports = db;
