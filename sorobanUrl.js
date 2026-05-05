const StellarSdk = require('@stellar/stellar-sdk');

// Configuration - CORRECT URLs for Stellar Testnet
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";  // For smart contracts
const HORIZON_URL = "https://horizon-testnet.stellar.org";       // For account operations
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const DIPLOMA_NFT_CONTRACT = "CBTGYCVE27SUBICFXLTR53IELNCHYRPDSH3DRGRW6VNETMTOFILRB535";

// Correct way to create Soroban server based on your SDK version
const sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

console.log('✓ Successfully created Soroban server using StellarSdk.rpc.Server');

// Optional: Also create Horizon server if you need it for account operations
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

console.log('Soroban Server:', sorobanServer);
console.log('Horizon Server:', horizonServer);
console.log('Network Passphrase:', NETWORK_PASSPHRASE);

// Test the connection (optional)
async function testConnection() {
  try {
    const health = await sorobanServer.getHealth();
    console.log('✓ Soroban server is healthy:', health);
  } catch (error) {
    console.log('⚠ Could not check Soroban server health:', error.message);
  }
}

testConnection();