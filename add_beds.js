const db = require('./backend/db/database');

console.log("Adding missing beds to existing wards...");

// Get the ward IDs
const wards = db.prepare('SELECT id, name FROM wards').all();

const insertBed = db.prepare('INSERT INTO beds (ward_id, bed_number) VALUES (?, ?)');

wards.forEach(w => {
    // get current max bed number count
    const count = db.prepare('SELECT COUNT(*) as count FROM beds WHERE ward_id = ?').get(w.id).count;
    let target = 0;
    
    if (w.name.includes('ICU')) {
        target = 25;
    } else {
        target = 100;
    }

    if (count < target) {
        for (let i = count + 1; i <= target; i++) {
            insertBed.run(w.id, `Bed ${i}`);
        }
        console.log(`Added ${target - count} beds to ${w.name}`);
    } else {
        console.log(`${w.name} already has ${count} beds`);
    }
});

console.log("Done.");
