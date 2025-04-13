// backend/routes/researcher.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');

const aclPath = path.join(__dirname, '../data/acl.json');
const accessLogPath = path.join(__dirname, '../data/access_log.json');
const reportsPath = path.join(__dirname, '../data/reports.json');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// GET /api/researcher/trends
router.get('/trends', authenticateToken, (req, res) => {
  if (req.user.role !== 'researcher') {
    return res.status(403).json({ error: 'Only researchers can access trend data' });
  }

  // (Optional) Verify access for the researcher over a set of patients if needed.
  // For now, we’ll assume that if they are authenticated as a researcher they can query anonymized data.

  // Log the access event – here we log under a dummy patient ID "anonymized" or you might aggregate separately
  const accessLog = readJSON(accessLogPath);
  const anonLogKey = 'anonymized';
  if (!accessLog[anonLogKey]) accessLog[anonLogKey] = [];
  accessLog[anonLogKey].push({
    accessed_by: req.user.walletAddress,
    timestamp: new Date().toISOString()
  });
  writeJSON(accessLogPath, accessLog);

  // Simulate trend analysis using reports.json – in production, feed your data into your RAG pipeline.
  const reports = readJSON(reportsPath);
  // For anonymity, return aggregate counts per day (example)
  const trendData = {};
  Object.values(reports).forEach((reportList) => {
    reportList.forEach((report) => {
      const day = report.timestamp.split('T')[0];
      trendData[day] = (trendData[day] || 0) + 1;
    });
  });

  res.json({ trends: trendData });
});

module.exports = router;
