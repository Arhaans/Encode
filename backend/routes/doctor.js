// backend/routes/doctor.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { encryptReport } = require('../utils/encryption'); // Simulated homomorphic encryption

// Define file paths for JSON storage
const aclPath = path.join(__dirname, '../data/acl.json');
const accessLogPath = path.join(__dirname, '../data/access_log.json');
const reportsPath = path.join(__dirname, '../data/reports.json');

// Helper function to read JSON content; returns {} if file doesn't exist.
const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Helper function to write JSON data to a file.
const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

/**
 * GET /api/doctor/reports/:patientId
 * This endpoint returns patient reports for a given patient ID.
 * It checks that the requester is a doctor and verifies access via ACL.
 * It also logs the access event in access_log.json.
 */
router.get('/reports/:patientId', authenticateToken, (req, res) => {
  // Ensure the user has a doctor role.
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Only doctors can access patient reports' });
  }

  const { patientId } = req.params;
  const acl = readJSON(aclPath);

  // Check if the doctor's wallet is authorized for the patient.
  if (!acl[patientId] || !acl[patientId].allowed_wallets.includes(req.user.walletAddress)) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to access this patient record' });
  }

  // Log the access event.
  const accessLog = readJSON(accessLogPath);
  if (!accessLog[patientId]) {
    accessLog[patientId] = [];
  }
  accessLog[patientId].push({
    accessed_by: req.user.walletAddress,
    timestamp: new Date().toISOString()
  });
  writeJSON(accessLogPath, accessLog);

  // Retrieve and return the patient’s report data.
  const reportsData = readJSON(reportsPath);
  const patientReports = reportsData[patientId] || [];
  res.json({ reports: patientReports });
});

/**
 * POST /api/doctor/upload
 * This endpoint allows an authorized doctor to upload a new record for a patient.
 * It requires the patientId and reportData in the request body.
 * The report data is encrypted (simulation) and a dummy URL is created to mimic upload to Shadow Drive.
 * The new record is appended to the patient’s reports in reports.json.
 */
router.post('/upload', authenticateToken, (req, res) => {
  // Ensure only doctors can upload records.
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Only doctors can upload records for patients' });
  }

  const { patientId, reportData } = req.body;
  if (!patientId || !reportData) {
    return res.status(400).json({ error: 'Missing patientId or reportData in request body' });
  }

  // Verify doctor's authorization for the patient.
  const acl = readJSON(aclPath);
  if (!acl[patientId] || !acl[patientId].allowed_wallets.includes(req.user.walletAddress)) {
    return res.status(403).json({ error: 'Access denied: You are not authorized to modify this patient record' });
  }

  // Encrypt the provided report data.
  const encryptedReport = encryptReport(reportData);

  // Simulate uploading the report to Shadow Drive by creating a dummy URL.
  const dummyUrl = `https://shadowdrive.example.com/${patientId}/record_${Date.now()}.json`;

  // Update the reports in reports.json.
  const reportsData = readJSON(reportsPath);
  if (!reportsData[patientId]) {
    reportsData[patientId] = [];
  }
  const newRecord = {
    url: dummyUrl,
    encryptedReport: encryptedReport,
    uploadedBy: req.user.walletAddress,
    timestamp: new Date().toISOString()
  };
  reportsData[patientId].push(newRecord);
  writeJSON(reportsPath, reportsData);

  res.json({ message: 'Record uploaded successfully', record: newRecord });
});

module.exports = router;
