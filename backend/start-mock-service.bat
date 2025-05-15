@echo off
echo Setting up Fireblocks API service in MOCK mode...
set USE_MOCK_FIREBLOCKS=true
set FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io

echo Starting server...
node server.js 