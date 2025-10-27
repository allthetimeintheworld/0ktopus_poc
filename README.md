# 0KTOPUS - NFT-Based Capability System

**Cryptographic Access Rights on Algorand Blockchain**

Replace traditional API keys with NFT ownership verification on Algorand blockchain.

---

## 🎯 What This Does

- **Authenticates users** via cryptographic wallet signatures (no passwords)
- **Verifies NFT ownership** to grant API access (no API keys to leak)
- **Issues JWT tokens** for session management
- **Protects API endpoints** with NFT-gated access control

## 🏗️ Architecture

```
Frontend (HTML/JS) → Backend (FastAPI) → Algorand Blockchain
                          ↓
                     Redis (challenges)
```

**Authentication Flow:**

1. User connects Pera Wallet
2. Backend sends random challenge
3. User signs challenge with private key
4. Backend verifies signature + checks NFT ownership
5. If valid → issue JWT token
6. User calls protected APIs with token

## 📋 Prerequisites

- **Python 3.8+**
- **Redis** (for challenge storage)
- **Pera Wallet** browser extension: https://perawallet.app/
- **Algorand TestNet** account with funds

## 🚀 Quick Start

### Option A: Using the UI (Recommended & Simplified)

This is the easiest way to test the complete flow!

#### Step 1: Fund Your Wallet

1. Install **Pera Wallet** browser extension: https://perawallet.app/
2. Create a wallet and switch to **TestNet** in settings
3. Get free TestNet ALGO: https://bank.testnet.algorand.network/

#### Step 2: Open the Frontend

```bash
# Serve the HTML file (simple HTTP server)
python -m http.server 8080
```

Open browser: http://localhost:8080 (or just open `index.html` directly)

#### Step 3: Complete the Flow

**Part 1: NFT Management**
1. **Connect Wallet** → Click "Connect Pera Wallet"
2. **Mint NFT** → Click "Mint NFT" (costs ~0.1 ALGO)
3. **Copy Asset ID** → Save this for the next step
4. **Transfer NFT** → Enter recipient address (e.g., "osoemen's wallet") and asset ID
5. **Verify** → Recipient can see the NFT in their Pera Wallet!

**Part 2: Test Authentication (Optional)**
1. Start the backend API (see Option B below)
2. **Connect Wallet** → Connect the wallet that owns the NFT
3. **Authenticate** → Sign the challenge to prove ownership
4. **Call API** → Access protected endpoints with the JWT token

✅ **The NFT owner now has API access!**

---

### Option B: Using Backend API (For Full Authentication Testing)

If you want to test the authentication system with the backend API:

#### Step 1: Install Dependencies

```bash
cd nft-api-poc
pip install -r requirements.txt
```

#### Step 2: Start Redis (Optional - will use in-memory fallback if not available)

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu)
sudo apt-get install redis-server
sudo systemctl start redis

# Or use Docker
docker run -d -p 6380:6379 redis:alpine
```

#### Step 3: Configure Environment

```bash
# Create .env file
echo "NFT_ASSET_ID=YOUR_ASSET_ID_FROM_MINTING" > .env
echo "JWT_SECRET=$(python -c 'import secrets; print(secrets.token_hex(32))')" >> .env
```

Replace `YOUR_ASSET_ID_FROM_MINTING` with the asset ID you got from Step 3 in Option A.

#### Step 4: Start Backend API

```bash
python api_server.py
```

Server starts at: http://localhost:8000

**API Docs:** http://localhost:8000/docs

#### Step 5: Test Authentication

1. Open http://localhost:8080 (or `index.html`)
2. Connect wallet that owns the NFT
3. Click "Authenticate" to sign challenge
4. Click "Call /api/protected" to access gated content

✅ You should see protected data returned!

## 📁 Project Structure

```
nft-api-poc/
├── index.html           # Frontend UI (Mint, Transfer, Authenticate)
├── api_server.py        # FastAPI backend (Authentication API)
├── requirements.txt     # Python dependencies
├── .env                 # Config (NFT_ASSET_ID, JWT_SECRET)
└── README.md           # This file

# Optional/Legacy files (can be deleted):
├── mint_nft.py          # Old CLI-based NFT creation
├── create_nft*.py       # Old test scripts
├── test_flow.py         # Old test scripts
├── nft_config.json      # Old NFT config format
└── temp_wallet.json     # Old temp wallet file
```

## 🔑 API Endpoints

### Public Endpoints

**GET /** - API information

```bash
curl http://localhost:8000/
```

**GET /health** - Health check

```bash
curl http://localhost:8000/health
```

**GET /api/status** - Public endpoint (no auth)

```bash
curl http://localhost:8000/api/status
```

### Authentication Endpoints

**POST /auth/challenge** - Get challenge to sign

```bash
curl -X POST http://localhost:8000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS"}'
```

**POST /auth/verify** - Verify signature and get token

```bash
curl -X POST http://localhost:8000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "YOUR_WALLET_ADDRESS",
    "signature": "BASE64_SIGNATURE",
    "challenge": {...}
  }'
```

### Protected Endpoints (Require JWT)

**GET /api/protected** - NFT-gated endpoint

```bash
curl http://localhost:8000/api/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**GET /api/user/info** - Get authenticated user info

```bash
curl http://localhost:8000/api/user/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

### ✅ Cryptographic Verification

- **Ed25519 signatures** (same as SSH, Signal)
- **Mathematically proven** ownership (not "probably secure")
- **Can't forge** without private key (2^256 keyspace)

### ✅ Replay Attack Prevention

- **Unique nonce** in each challenge
- **5-minute expiry** on challenges
- **Single-use** challenges (deleted after verification)

### ✅ No Shared Secrets

- **No API keys** stored in database
- **Private key never leaves** wallet
- **Signature visible but useless** (nonce changes)

### ✅ On-Chain Verification

- **NFT ownership** checked on blockchain
- **Immutable audit trail** of transfers
- **No centralized database** of permissions

## 🧪 Testing

### Test Challenge Generation

```bash
curl -X POST http://localhost:8000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address": "TESTWALLET123..."}'
```

### Test Without NFT

Try authenticating with wallet that doesn't own NFT:

- Should fail with: `NFT not found in wallet`

### Test Expired Challenge

1. Get challenge
2. Wait 6 minutes
3. Try to verify

- Should fail with: `Challenge expired`

### Test Invalid Signature

Try sending random signature:

- Should fail with: `Invalid signature`

## 🐛 Troubleshooting

### Redis Connection Error

**Error:** `Redis connection failed`

**Fix:**

```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### NFT_ASSET_ID Not Configured

**Error:** `NFT_ASSET_ID not configured`

**Fix:**

1. Run `python mint_nft.py`
2. Add asset ID to `.env`
3. Restart API server

### NFT Not Found in Wallet

**Error:** `NFT not found in wallet`

**Fix:**

1. Check NFT is in your Pera Wallet
2. Verify correct asset ID in `.env`
3. Ensure wallet is on TestNet (not MainNet)
4. Check on explorer: https://testnet.algoexplorer.io/address/YOUR_WALLET

### CORS Errors

**Error:** Cross-origin request blocked

**Fix:**

- Use `python -m http.server` to serve frontend
- Or access `index.html` via `file://` protocol
- Backend already has CORS enabled for all origins

### Pera Wallet Not Connecting

**Fix:**

1. Install Pera Wallet extension: https://perawallet.app/
2. Create/import wallet
3. Switch to TestNet in settings
4. Refresh page and try again

## 📊 Comparison: API Keys vs NFT Access

| Feature             | API Keys             | NFT-Based                |
| ------------------- | -------------------- | ------------------------ |
| **Storage**         | Database (leak risk) | Blockchain (transparent) |
| **Revocation**      | Update database      | Burn/transfer NFT        |
| **Transferability** | Manual process       | Transfer NFT             |
| **Auditability**    | App logs             | On-chain history         |
| **Monetization**    | Subscription         | NFT marketplace          |
| **Compromise**      | Key leak = access    | Need private key         |
| **Multi-platform**  | Key per platform     | One NFT, all platforms   |

## 🎓 How It Works (Technical)

### 1. Challenge-Response Protocol

```python
# Backend generates random challenge
challenge = {
    "nonce": "random_64_char_hex",
    "timestamp": 1704672000,
    "address": "wallet_address"
}
```

### 2. Cryptographic Signature

```javascript
// User signs with private key (in wallet)
signature = sign(challenge, private_key);
// Signature proves ownership without revealing key
```

### 3. Backend Verification

```python
# Verify signature mathematically
is_valid = verify_signature(
    message=challenge,
    signature=signature,
    public_key=wallet_address
)

# Check NFT ownership on blockchain
owns_nft = check_blockchain(wallet_address, nft_asset_id)

# Both must be true to grant access
if is_valid and owns_nft:
    return jwt_token
```

### 4. Protected API Access

```python
# Client includes JWT in requests
headers = {
    "Authorization": f"Bearer {jwt_token}"
}

# Backend validates JWT
if valid_jwt and not_expired:
    return protected_data
```

## 🚀 Next Steps

### For Production:

1. **Smart Contract**: Add on-chain access logic

   - Expiration dates
   - Usage limits
   - Tiered access levels

2. **Security Hardening**:

   - Rate limiting
   - IP allowlisting
   - Multi-signature wallets
   - Regular NFT re-checks

3. **Infrastructure**:

   - HTTPS only
   - Proper secret management
   - Redis persistence
   - Monitoring/logging

4. **MainNet Deployment**:
   - Switch to Algorand MainNet
   - Real NFT creation
   - Production Pera Wallet

### For Development:

- Add more NFT types (tiers)
- Implement admin dashboard
- Add usage analytics
- Create smart contract version

## 📚 Additional Resources

- **Algorand Docs**: https://developer.algorand.org/
- **Pera Wallet**: https://perawallet.app/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **JWT.io**: https://jwt.io/

## 🔗 Related Files

- `NFT_API_TECHNICAL_SPEC.md` - Full technical specification
- `SECURITY_PROOF_OF_OWNERSHIP.md` - Security analysis & cryptography explanation

## 📝 License

MIT License - Free to use for any purpose

---

**Built with ❤️ using Algorand blockchain**

Questions? Check the technical docs or security analysis in this repo.
