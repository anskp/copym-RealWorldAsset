# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key

# Fireblocks Configuration
FIREBLOCKS_API_KEY=your-fireblocks-api-key
FIREBLOCKS_API_SECRET_PATH=./fireblock.pem
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io
USE_MOCK_FIREBLOCKS=false

# Sumsub Configuration
SUMSUB_APP_TOKEN=your-sumsub-app-token
SUMSUB_SECRET_KEY=your-sumsub-secret-key
SUMSUB_BASE_URL=https://api.sumsub.com

# OAuth Configuration 
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
TWITTER_CONSUMER_KEY=your-twitter-consumer-key
TWITTER_CONSUMER_SECRET=your-twitter-consumer-secret

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

## Setting Up Fireblocks

1. Make sure the `fireblock.pem` private key file is in the backend directory
2. Set `FIREBLOCKS_API_KEY` to your Fireblocks API Key
3. If you don't have real Fireblocks credentials, set `USE_MOCK_FIREBLOCKS=true` to use mock data

## Testing the Setup

1. Start the backend service:
   ```
   cd backend
   $env:PORT="5000"
   npm start
   ```

2. Open `test-api.html` in your browser to test the API endpoints 

3. To test the Fireblocks connection specifically, run:
   ```
   cd backend
   node test-fireblocks-connection.js
   ```

## Troubleshooting

- If you get `EADDRINUSE` errors, kill the existing process with:
  ```
  npx kill-port 5001
  ```

- If you have trouble with PowerShell environment variables, use this format:
  ```
  $env:PORT="5000"; npm start
  ``` 