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
    `);

    // Check if admin user exists, if not create one
    const checkUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!checkUser) {
        const hash = bcrypt.hashSync('admin', 10);
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'Admin');
        console.log('Default Admin user created (admin:admin)');
    }
};

initDb();

module.exports = db;
