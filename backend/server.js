require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const mastersRoutes = require('./routes/masters');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const investigationsRoutes = require('./routes/investigations');
const reportsRoutes = require('./routes/reports');
const inpatientRoutes = require('./routes/inpatient');

app.use('/auth', authRoutes);
app.use('/masters', mastersRoutes);
app.use('/patients', patientsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/investigations', investigationsRoutes);
app.use('/reports', reportsRoutes);
app.use('/inpatient', inpatientRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
