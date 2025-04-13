// backend/utils/solana.js
const { Connection, clusterApiUrl } = require('@solana/web3.js');
const solanaNetwork = process.env.SOLANA_NETWORK || clusterApiUrl('devnet');
const connection = new Connection(solanaNetwork, 'confirmed');

module.exports = { connection };
