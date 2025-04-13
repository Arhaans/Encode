// backend/routes/rag.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticateToken } = require('../utils/middleware');

// POST /api/rag/query
// Expected payload: { query, context }
// For doctors, 'context' should be the full report.
// For researchers, 'context' should contain aggregated/anonymized data.
router.post('/query', authenticateToken, async (req, res) => {
  const { query, context } = req.body;
  
  // Validate that query exists.
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Only allow doctors or researchers.
  if (!['doctor', 'researcher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized role for RAG queries' });
  }
  
  try {
    let response;
    if (req.user.role === 'doctor') {
      if (!context) {
        return res.status(400).json({ error: 'For doctors, full report text must be provided in the context field.' });
      }
      response = await axios.post('http://localhost:5001/rag', {
        query: query,
        report: context
      });
    } else if (req.user.role === 'researcher') {
      if (!context) {
        return res.status(400).json({ error: 'For researchers, aggregated_context must be provided in the context field.' });
      }
      response = await axios.post('http://localhost:5002/rag', {
        query: query,
        aggregated_context: context
      });
    }
    res.json({ answer: response.data.answer });
  } catch (error) {
    console.error('Error in RAG pipeline:', error.message);
    res.status(500).json({ error: 'Error processing RAG query' });
  }
});

module.exports = router;
