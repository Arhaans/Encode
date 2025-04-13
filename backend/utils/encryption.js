// backend/utils/encryption.js

// Simulated encryption: encode the report data in Base64
const encryptReport = (plainText) => {
    // In production, perform homomorphic encryption using TenSEAL
    return Buffer.from(plainText).toString('base64');
  };
  
  // Simulated decryption (if needed)
  const decryptReport = (encryptedText) => {
    return Buffer.from(encryptedText, 'base64').toString('utf8');
  };
  
  module.exports = { encryptReport, decryptReport };
  