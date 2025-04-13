// backend/routes/patient.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');
const { encryptReport } = require('../utils/encryption');
// Import your Shadow Drive SDK here (simulate upload for now)

// Paths for JSON storage
const aclPath = path.join(__dirname, '../data/acl.json');
const accessLogPath = path.join(__dirname, '../data/access_log.json');
const reportsPath = path.join(__dirname, '../data/reports.json');

// Helper functions to read/write JSON files
const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// POST /api/patient/store: patient uploads an encrypted report
router.post('/store', authenticateToken, (req, res) => {
  // Only patients can upload
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can upload reports' });
  }
  const { patientId, reportData } = req.body; // reportData is the plaintext report
  if (!patientId || !reportData) {
    return res.status(400).json({ error: 'Missing patientId or reportData' });
  }

  // Encrypt report (simulate homomorphic encryption)
  const encryptedReport = encryptReport(reportData);
  
  // Simulate upload to Shadow Drive
  // In production, use @shadow-drive/sdk to upload the encrypted report.
  // For demonstration, we return a dummy URL.
  const dummyUrl = `https://shadowdrive.example.com/${patientId}/report_${Date.now()}.json`;

  // Save report metadata to reports.json
  const reportsData = readJSON(reportsPath);
  if (!reportsData[patientId]) reportsData[patientId] = [];
  const reportEntry = {
    url: dummyUrl,
    encryptedReport,
    timestamp: new Date().toISOString()
  };
  reportsData[patientId].push(reportEntry);
  writeJSON(reportsPath, reportsData);

  // Update ACL for patient if not already set – each patient should have an entry
  const acl = readJSON(aclPath);
  if (!acl[patientId]) {
    // Initialize with patient as owner and empty allowed list
    acl[patientId] = { owner: req.user.walletAddress, allowed_wallets: [] };
    writeJSON(aclPath, acl);
  }

  res.json({ message: 'Report uploaded successfully', reportUrl: dummyUrl });
});

// POST /api/patient/grant-access: patient grants access to a wallet
router.post('/grant-access', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can manage access' });
  }
  const { patientId, walletToGrant } = req.body;
  if (!patientId || !walletToGrant) {
    return res.status(400).json({ error: 'Missing patientId or walletToGrant' });
  }
  const acl = readJSON(aclPath);
  if (!acl[patientId] || acl[patientId].owner !== req.user.walletAddress) {
    return res.status(403).json({ error: 'You are not the owner of this patient record' });
  }
  if (!acl[patientId].allowed_wallets.includes(walletToGrant)) {
    acl[patientId].allowed_wallets.push(walletToGrant);
    writeJSON(aclPath, acl);
  }
  res.json({ message: 'Access granted', acl: acl[patientId] });
});

// POST /api/patient/revoke-access: patient revokes access to a wallet
router.post('/revoke-access', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can manage access' });
  }
  const { patientId, walletToRevoke } = req.body;
  if (!patientId || !walletToRevoke) {
    return res.status(400).json({ error: 'Missing patientId or walletToRevoke' });
  }
  const acl = readJSON(aclPath);
  if (!acl[patientId] || acl[patientId].owner !== req.user.walletAddress) {
    return res.status(403).json({ error: 'You are not the owner of this patient record' });
  }
  acl[patientId].allowed_wallets = acl[patientId].allowed_wallets.filter(
    (w) => w !== walletToRevoke
  );
  writeJSON(aclPath, acl);
  res.json({ message: 'Access revoked', acl: acl[patientId] });
});

// GET /api/patient/access-list/:patientId: show wallets with access
router.get('/access-list/:patientId', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const acl = readJSON(aclPath);
  if (!acl[patientId]) return res.status(404).json({ error: 'Patient not found' });
  // Only the owner can view full access list
  if (req.user.walletAddress !== acl[patientId].owner) {
    return res.status(403).json({ error: 'Not authorized to view access list' });
  }
  res.json({ accessList: acl[patientId].allowed_wallets });
});

// GET /api/patient/access-log/:patientId: show access log for a patient
router.get('/access-log/:patientId', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const acl = readJSON(aclPath);
  if (!acl[patientId]) return res.status(404).json({ error: 'Patient not found' });
  // Only the owner can view the log
  if (req.user.walletAddress !== acl[patientId].owner) {
    return res.status(403).json({ error: 'Not authorized to view access log' });
  }
  const accessLog = readJSON(accessLogPath);
  res.json({ accessLog: accessLog[patientId] || [] });
});

module.exports = router;
