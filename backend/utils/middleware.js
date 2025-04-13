// backend/utils/middleware.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Expect the token in the Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = payload;
    next();
  });
};

module.exports = { authenticateToken };
