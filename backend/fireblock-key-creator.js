const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a test RSA key pair
function generateRsaKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// Main function
function createFireblocksKeyFile() {
  try {
    console.log('Generating RSA key pair for Fireblocks API...');
    
    // Generate RSA key pair
    const { privateKey, publicKey } = generateRsaKeyPair();
    
    // Write private key to file
    const privateKeyPath = path.join(__dirname, 'fireblock.pem');
    fs.writeFileSync(privateKeyPath, privateKey);
    console.log(`Private key saved to: ${privateKeyPath}`);
    
    // Write public key to file (for reference)
    const publicKeyPath = path.join(__dirname, 'fireblock.pub');
    fs.writeFileSync(publicKeyPath, publicKey);
    console.log(`Public key saved to: ${publicKeyPath}`);
    
    console.log('\n✅ Key files generated successfully');
    console.log('Note: This is a test key pair and cannot be used with the actual Fireblocks API');
    console.log('You will need to replace these with actual keys from Fireblocks');
  } catch (error) {
    console.error('\n❌ ERROR generating key pair:', error);
  }
}

// Run the key generation
createFireblocksKeyFile(); 