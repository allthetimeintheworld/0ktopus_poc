# 🚀 0KTOPUS - Complete Quick Start Guide

## 🎯 Daily Use - Start Everything (2 Terminals)

### Terminal 1 - Backend:
```bash
cd /home/j/Desktop/0ktopus_poc
source venv/bin/activate
python3 api_server.py
```
✅ Should show: `Uvicorn running on http://0.0.0.0:8000`

**Or use the script:**
```bash
cd /home/j/Desktop/0ktopus_poc
./start-backend.sh
```

### Terminal 2 - Frontend:
```bash
cd /home/j/Desktop/0ktopus_poc/frontend
npm run dev
```
✅ Should show: `Local: http://localhost:5173/`

**Or use the script:**
```bash
cd /home/j/Desktop/0ktopus_poc
./start-frontend.sh
```

---

## 🌐 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React app with wallet connection |
| **Backend API** | http://localhost:8000 | FastAPI authentication server |
| **Swagger Docs** | http://localhost:8000/docs | Interactive API documentation |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |

---

## 🛑 Stop Everything

Press `Ctrl+C` in both terminals

**Or kill processes by port:**
```bash
# Kill backend (port 8000)
kill $(lsof -t -i:8000)

# Kill frontend (port 5173)
kill $(lsof -t -i:5173)
```

---

## 🔍 Check If Services Are Running

```bash
# Check processes
ps aux | grep -E "(python|uvicorn|vite|npm)" | grep -v grep

# Check ports
ss -tlnp | grep -E "(8000|5173)"

# Should see:
# - Port 8000 (backend/python)
# - Port 5173 (frontend/node)
```

**Verify backend health:**
```bash
curl http://localhost:8000/
# Should return: {"message":"NFT API Authentication Backend"}
```

---

## 📦 Project Location

**Everything runs locally on your machine:**

| What | Where | Port |
|------|-------|------|
| Frontend UI | /home/j/Desktop/0ktopus_poc/frontend | 5173 |
| Backend API | /home/j/Desktop/0ktopus_poc | 8000 |
| Python venv | /home/j/Desktop/0ktopus_poc/venv | - |

---

## ⚙️ Environment Variables

### Backend (.env in project root)
```env
# Algorand Configuration
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud

# NFT Asset ID (fill in after minting your NFT)
NFT_ASSET_ID=

# JWT Secret (auto-generated)
JWT_SECRET=423f8d98b6919f6675ab1c4befa7ab30df21714d98286ce5f91892d14ca41d13

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (frontend/.env)
```env
# Algorand Network Configuration
VITE_ALGOD_SERVER=https://testnet-api.4160.nodely.dev
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet

# Backend API Configuration
VITE_API_URL=http://localhost:8000
```

---

## 🎮 Testing the Complete Flow

1. **Open Frontend:** http://localhost:5173
2. **Connect Wallet:** Click "Connect Wallet" button
3. **Select Wallet:** Choose Pera, Defly, or another wallet
4. **Automatic Setup Modal:** Should appear after connection
5. **Step 1:** Sign the nonce challenge
6. **Step 2:** Mint your NFT
7. **Step 3:** Complete setup
8. **Authenticate:** Use the NFT to get API access

---

## 🔧 Common Issues & Solutions

### Issue: "NFT_ASSET_ID not configured"
**Solution:**
1. Mint your NFT first:
   ```bash
   cd /home/j/Desktop/0ktopus_poc
   source venv/bin/activate
   python3 mint_nft.py
   ```
2. Update `.env` file with the Asset ID returned
3. Restart the backend

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
cd /home/j/Desktop/0ktopus_poc
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd /home/j/Desktop/0ktopus_poc/frontend
npm install
```

### Issue: Wallet won't connect
**Solution:**
1. Make sure you're on **TestNet** in your wallet app
2. Clear browser cache and reload
3. Check browser console for errors (F12)
4. Verify frontend `.env` has correct `VITE_API_URL`

### Issue: Redis connection error
**Solution:**
```bash
# Start Redis server
redis-server

# Or install Redis if not installed (Ubuntu/Debian)
sudo apt install redis-server
```

---

## 🧪 Quick API Tests

### Get Authentication Challenge
```bash
curl -X POST http://localhost:8000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"YOUR_ALGORAND_ADDRESS"}'
```

### Check Health
```bash
curl http://localhost:8000/health
```

### List All Endpoints
```bash
curl http://localhost:8000/docs
# Or visit in browser for interactive docs
```

---

## 📁 Project Structure Quick Reference

```
/home/j/Desktop/0ktopus_poc/
├── api_server.py              # FastAPI backend
├── mint_nft.py                # NFT minting script
├── requirements.txt           # Python dependencies
├── .env                       # Backend environment variables
├── start-backend.sh           # Backend startup script
├── start-frontend.sh          # Frontend startup script
├── venv/                      # Python virtual environment
└── frontend/
    ├── src/
    │   ├── App.tsx            # Main app wrapper
    │   ├── Home.tsx           # Landing page
    │   ├── components/
    │   │   ├── ConnectWallet.tsx
    │   │   ├── WalletConnected.tsx  # Post-connection flow
    │   │   ├── MintNFT.tsx
    │   │   └── AuthFlow.tsx
    │   └── services/
    │       └── authService.ts
    ├── package.json           # Node dependencies
    ├── .env                   # Frontend environment variables
    └── vite.config.ts         # Vite configuration
```

---

## 🐛 Debug & Logs

### View Backend Logs
Backend logs appear in real-time in Terminal 1 where you started it.

### View Frontend Logs
- **Browser Console:** F12 > Console tab
- **Terminal:** Check Terminal 2 where you ran `npm run dev`

### Enable Verbose Logging
```bash
# Backend with debug mode
cd /home/j/Desktop/0ktopus_poc
source venv/bin/activate
python3 api_server.py --reload --log-level debug
```

---

## 🚀 Deployment (Future)

Currently running locally. When ready to deploy:

| Component | Recommended Platform |
|-----------|---------------------|
| Frontend | Vercel, Netlify |
| Backend | Railway, Render, Fly.io |
| Database | Redis Cloud, Upstash |

---

## 📝 Notes

- Both backend and frontend **must be running** simultaneously
- Backend runs on port **8000**, frontend on port **5173**
- Always use **TestNet** for development
- NFT Asset ID must be set in `.env` before authentication works
- JWT tokens expire after 1 hour

---

## 💡 Quick Commands Cheatsheet

```bash
# Start everything (2 terminals)
./start-backend.sh
./start-frontend.sh

# Check if running
ss -tlnp | grep -E "(8000|5173)"

# Kill everything
kill $(lsof -t -i:8000) && kill $(lsof -t -i:5173)

# Reinstall dependencies
pip install -r requirements.txt && cd frontend && npm install

# Generate new JWT secret
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

**Last Updated:** October 27, 2025  
**Project:** 0KTOPUS - Token-Gated API Revenue System  
**Status:** ✅ Running locally on TestNet
