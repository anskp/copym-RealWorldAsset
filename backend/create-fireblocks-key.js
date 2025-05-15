const fs = require('fs');
const path = require('path');

// Create a proper PEM key file for testing
const pemContent = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtYwBLagPvAl6s
08bEbBaUWL7CqOP/acT5iO4PUSvPwEnncfvo4b23tAhRMfxN7bKtSFuLWlNJHjH/
yfDoQCSm0iZfMX8uXSfXhKtMcePdYtpMtBrqppjJQrqPfq/QkHcleT....
-----END PRIVATE KEY-----`;

const filePath = path.join(__dirname, 'fireblock.pem');

try {
  fs.writeFileSync(filePath, pemContent, 'utf8');
  console.log(`PEM key file created at: ${filePath}`);
  console.log('Make sure to replace the key content with your actual Fireblocks private key');
} catch (error) {
  console.error('Error creating PEM file:', error.message);
} 