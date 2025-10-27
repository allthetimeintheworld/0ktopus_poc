# AllGoGrand - Quick Start Reference

## Application URLs

### Frontend (Vite Dev Server)
**URL:** http://localhost:5173
- React application with Tailwind CSS
- Wallet connection interface
- NFT minting and authentication flow

### Backend (FastAPI)
**URL:** http://localhost:8000
- API endpoints for authentication
- NFT ownership verification
- Challenge-response protocol

### API Documentation
**Swagger UI:** http://localhost:8000/docs
**ReDoc:** http://localhost:8000/redoc

## Starting the Application

### Option 1: Using Scripts

#### Backend:
```bash
cd /home/j/Desktop/AllGoGrand
./start-backend.sh
```

#### Frontend:
```bash
cd /home/j/Desktop/AllGoGrand
./start-frontend.sh
```

### Option 2: Manual Start

#### Backend:
```bash
cd /home/j/Desktop/AllGoGrand
source venv/bin/activate
python api_server.py
```

#### Frontend:
```bash
cd /home/j/Desktop/AllGoGrand/frontend
npm run dev
```

## Checking if Services are Running

```bash
# Check processes
ps aux | grep -E "(python|uvicorn|vite|npm)" | grep -v grep

# Check ports
netstat -tlnp | grep -E "(8000|5173)"
# or
ss -tlnp | grep -E "(8000|5173)"
```

## Common Issues

### Issue: "I see nothing" in browser
**Solution:** Make sure you're accessing the correct port (5173, not 5174)
- ✅ Correct: http://localhost:5173
- ❌ Wrong: http://localhost:5174

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 8000 (backend)
kill $(lsof -t -i:8000)

# Kill process on port 5173 (frontend)
kill $(lsof -t -i:5173)
```

### Issue: Module not found errors
**Solution:**
```bash
# Backend
cd /home/j/Desktop/AllGoGrand
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd /home/j/Desktop/AllGoGrand/frontend
npm install
```

### Issue: Wallet won't connect
**Solution:**
1. Make sure you're on TestNet in your wallet app
2. Clear browser cache and reload
3. Check browser console for errors (F12)

## Environment Variables

### Backend (.env in root)
```env
ALGORAND_TOKEN=
ALGORAND_SERVER=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_SERVER=https://testnet-idx.algonode.cloud
JWT_SECRET_KEY=your-secret-key-here
REDIS_URL=redis://localhost:6379
```

### Frontend (frontend/.env)
```env
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet
VITE_API_URL=http://localhost:8000
```

## Testing the Flow

1. **Open Frontend:** http://localhost:5173
2. **Connect Wallet:** Click "Connect Wallet" button
3. **Select Wallet:** Choose Pera, Defly, or another wallet
4. **Automatic Setup Modal:** Should appear after connection
5. **Step 1:** Sign the nonce challenge
6. **Step 2:** Mint your NFT
7. **Step 3:** Complete setup
8. **Authenticate:** Use the NFT to get API access

## Verification

### Check Backend Health
```bash
curl http://localhost:8000/
# Should return: {"message":"NFT API Authentication Backend"}
```

### Check Frontend Build
```bash
cd /home/j/Desktop/AllGoGrand/frontend
npm run build
# Should complete without errors
```

## Quick Debug

### View Backend Logs
```bash
# In the terminal where you started the backend
# Logs appear in real-time
```

### View Frontend Logs
```bash
# Check browser console (F12 > Console tab)
# Check terminal where you ran `npm run dev`
```

### Test API Endpoints
```bash
# Get challenge
curl -X POST http://localhost:8000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_ALGORAND_ADDRESS"}'

# Health check
curl http://localhost:8000/health
```

## File Structure Quick Reference

```
/home/j/Desktop/AllGoGrand/
├── api_server.py              # FastAPI backend
├── requirements.txt           # Python dependencies
├── .env                       # Backend environment variables
├── start-backend.sh          # Backend startup script
├── start-frontend.sh         # Frontend startup script
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app wrapper
│   │   ├── Home.tsx          # Landing page
│   │   ├── components/
│   │   │   ├── ConnectWallet.tsx
│   │   │   ├── WalletConnected.tsx  # NEW: Post-connection flow
│   │   │   ├── MintNFT.tsx
│   │   │   └── AuthFlow.tsx
│   │   └── services/
│   │       └── authService.ts
│   ├── package.json          # Node dependencies
│   ├── .env                  # Frontend environment variables
│   └── vite.config.ts        # Vite configuration
└── venv/                     # Python virtual environment
```

## Support

If you encounter issues:
1. Check this document for common solutions
2. Review the logs in terminal
3. Check browser console (F12)
4. Verify environment variables are set correctly
5. Ensure TestNet is selected in your wallet

## Last Updated
October 27, 2025
