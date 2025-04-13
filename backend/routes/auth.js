// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bs58 = require('bs58');

// POST /api/auth/signin
// Expected body: { walletAddress, signature, role }
// (In a real implementation, verify signature using SIWS & Solana web3 libraries)
router.post('/signin', (req, res) => {
  const { walletAddress, signature, role } = req.body;
  if (!walletAddress || !signature || !role) {
    return res.status(400).json({ error: 'Missing walletAddress, signature, or role' });
  }

  // Simulated SIWS verification (in production, validate signature using @solana/web3.js)
  // For now, assume the signature is valid if provided.
  console.log(`Authenticating wallet: ${walletAddress} as ${role}`);

  // Issue JWT token
  const token = jwt.sign({ walletAddress, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;
