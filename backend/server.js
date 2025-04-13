// backend/server.js
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Import route modules
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const researcherRoutes = require('./routes/researcher');
const ragRoutes = require('./routes/rag');

// Mount routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/researcher', researcherRoutes);
app.use('/api/rag', ragRoutes);

app.listen(port, () => {
  console.log(`MediCrypt backend running on port ${port}`);
});
