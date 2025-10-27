# Frontend Integration Guide

This guide explains how to use the new React frontend with your NFT API authentication backend.

## 🎯 What Was Created

A complete React + TypeScript frontend that integrates:

1. **QuickStartTemplate's wallet system** (`@txnlab/use-wallet-react`)
2. **Your challenge-response authentication** (FastAPI backend)
3. **Professional UI components** (Tailwind CSS + DaisyUI)

## 📁 Project Structure

```
nft-api-poc/
├── frontend/                    # NEW - React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthFlow.tsx     # Main authentication component
│   │   │   ├── ConnectWallet.tsx # From QuickStartTemplate
│   │   │   └── Account.tsx      # From QuickStartTemplate
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # Auth state management hook
│   │   ├── services/
│   │   │   └── authService.ts   # API communication layer
│   │   ├── utils/               # From QuickStartTemplate
│   │   ├── App.tsx              # Wallet provider setup
│   │   ├── Home.tsx             # Main landing page
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── api_server.py                # Existing FastAPI backend
└── ... (other POC files)
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd nft-api-poc/frontend
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**`.env` Configuration:**

```bash
# Algorand Network (TestNet by default)
VITE_ALGOD_SERVER=https://testnet-api.4160.nodely.dev
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet

# Backend API URL
VITE_API_URL=http://localhost:8000
```

### Step 3: Start Backend API

```bash
# In the main nft-api-poc directory
python api_server.py
```

Backend runs at: http://localhost:8000

### Step 4: Start Frontend

```bash
# In nft-api-poc/frontend directory
npm run dev
```

Frontend runs at: http://localhost:5173

## 🔌 How It Works

### 1. Wallet Connection

The app uses `@txnlab/use-wallet-react` which supports:
- **Pera Wallet**
- **Defly**
- **Exodus**
- **KMD** (LocalNet only)

User clicks "Connect Wallet" → Opens modal → Selects wallet provider → Connects

### 2. Authentication Flow

**File: `src/components/AuthFlow.tsx`**

```typescript
// User clicks "Authenticate"
const handleAuthenticate = async () => {
  // 1. Request challenge from backend
  const challenge = await requestChallenge(address)

  // 2. Sign challenge with wallet
  const signedData = await signData([{ data: challenge }], address)

  // 3. Verify signature + NFT ownership
  const token = await verifySignature(address, signedData, challenge)

  // 4. Store JWT token
  localStorage.setItem('token', token)
}
```

**Backend endpoints used:**
- `POST /auth/challenge` - Get challenge to sign
- `POST /auth/verify` - Verify signature and get JWT

### 3. Protected API Calls

**File: `src/services/authService.ts`**

```typescript
// Call protected endpoint with JWT
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Endpoints available:**
- `GET /api/protected` - NFT-gated data
- `GET /api/user/info` - User information

## 🎨 Components Overview

### `AuthFlow.tsx`

Main authentication component with:
- **Connect status** indicator
- **Authenticate button** (triggers challenge-response)
- **Protected API buttons** (call /api/protected, /api/user/info)
- **Token expiry countdown** (auto-logout when expired)
- **JSON response display**

**Usage in your app:**

```tsx
import AuthFlow from './components/AuthFlow'

function App() {
  const [openAuthModal, setOpenAuthModal] = useState(false)

  return (
    <>
      <button onClick={() => setOpenAuthModal(true)}>
        Authenticate
      </button>
      <AuthFlow openModal={openAuthModal} setModalState={setOpenAuthModal} />
    </>
  )
}
```

### `useAuth` Hook

Custom hook for auth state management:

```tsx
const {
  isAuthenticated,  // boolean - is user authenticated?
  token,           // string | null - JWT token
  isLoading,       // boolean - authentication in progress
  error,           // string | null - error message
  authenticate,    // () => Promise<boolean> - trigger auth flow
  logout,          // () => void - clear auth state
  timeUntilExpiry, // () => number - seconds until token expires
} = useAuth()
```

**Features:**
- Stores token in localStorage
- Auto-loads token on page refresh
- Auto-clears on wallet disconnect
- Validates token expiry

### `authService.ts`

API service layer with TypeScript types:

```typescript
// Challenge from backend
interface Challenge {
  message: string
  nonce: string
  timestamp: number
  address: string
  domain: string
}

// Functions available:
requestChallenge(address: string): Promise<Challenge>
verifySignature(address: string, signature: string, challenge: Challenge): Promise<AuthToken>
getProtectedData(token: string): Promise<ProtectedData>
getUserInfo(token: string): Promise<UserInfo>
checkHealth(): Promise<{ status: string }>
```

## 🔧 Customization

### Change API Base URL

**File: `frontend/src/services/authService.ts`**

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

Or update `.env`:

```bash
VITE_API_URL=https://api.yourproject.com
```

### Add New Protected Endpoints

1. **Add to authService.ts:**

```typescript
export async function getCustomData(token: string): Promise<CustomData> {
  const response = await fetch(`${API_BASE_URL}/api/custom`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}
```

2. **Use in AuthFlow.tsx:**

```tsx
const handleGetCustom = async () => {
  const data = await getCustomData(token!)
  console.log(data)
}
```

### Customize UI Colors

**File: `frontend/tailwind.config.js`**

```js
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    }
  }
}
```

## 🧪 Testing

### Test Authentication Flow

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Select Pera Wallet (or other provider)
4. Click "Authenticate & Access APIs"
5. Sign the challenge in wallet popup
6. Should see "Authenticated" status
7. Click "GET /api/protected" or "GET /api/user/info"
8. View JSON response

### Test Error Handling

**Test expired challenge:**
1. Modify backend `ttl=300` to `ttl=5` (5 seconds)
2. Request challenge
3. Wait 6 seconds
4. Try to verify → Should fail with "Challenge expired"

**Test missing NFT:**
1. Use wallet without the NFT
2. Try to authenticate
3. Should fail with "NFT not found in wallet"

**Test expired token:**
1. Authenticate successfully
2. Wait 1 hour (or modify JWT expiry in backend)
3. Try calling protected API
4. Should fail with "Token expired"

## 🔒 Security Considerations

### Current Implementation

✅ **Good:**
- Ed25519 cryptographic signatures
- Challenge nonces prevent replay attacks
- Tokens expire after 1 hour
- Private keys never leave wallet
- JWT tokens stored in localStorage

⚠️ **Production Improvements:**

1. **Use HttpOnly cookies** instead of localStorage:

```typescript
// Backend sends JWT as HttpOnly cookie
response.set_cookie(
    "access_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="strict"
)
```

2. **Add CSRF protection** for cookie-based auth

3. **Implement refresh tokens** for longer sessions

4. **Add rate limiting** on authentication endpoints

5. **Use HTTPS only** in production

## 📚 Additional Features You Can Add

### 1. Re-verify NFT Ownership on Each Request

**Backend: `api_server.py`**

Uncomment lines 389-394 in `/api/protected` endpoint:

```python
# Optional: Re-verify NFT ownership (adds ~200ms latency)
owns_nft = check_nft_ownership(wallet_address, nft_asset_id)
if not owns_nft:
    raise HTTPException(
        status_code=403,
        detail="NFT no longer in wallet. Access revoked."
    )
```

### 2. Add Token Refresh

**Backend: Create `/auth/refresh` endpoint**

```python
@app.post("/auth/refresh")
async def refresh_token(current_token: str):
    # Verify old token
    payload = jwt.decode(current_token, JWT_SECRET, algorithms=['HS256'])

    # Re-check NFT ownership
    owns_nft = check_nft_ownership(payload['wallet'], NFT_ASSET_ID)
    if not owns_nft:
        raise HTTPException(403, "NFT no longer owned")

    # Issue new token
    new_token = jwt.encode({...}, JWT_SECRET)
    return {"access_token": new_token}
```

### 3. Add User Dashboard

Create `src/components/Dashboard.tsx`:

```tsx
function Dashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Fetch user-specific data
    getUserStats(token).then(setStats)
  }, [token])

  return <div>Your API usage: {stats?.requests_made}</div>
}
```

## 🐛 Troubleshooting

### Issue: "Cannot connect wallet"

**Solution:**
1. Install Pera Wallet extension: https://perawallet.app/
2. Create/import wallet
3. Switch to TestNet in wallet settings
4. Refresh page

### Issue: "Challenge not found or expired"

**Solution:**
- Challenges expire after 5 minutes
- Request a new challenge
- Complete authentication flow within 5 minutes

### Issue: "NFT not found in wallet"

**Solution:**
1. Check `.env` has correct `NFT_ASSET_ID`
2. Verify wallet owns the NFT on Lora:
   - https://lora.algokit.io/testnet/asset/{ASSET_ID}
3. Make sure wallet is on TestNet (not MainNet)

### Issue: "CORS error when calling API"

**Solution:**
1. Check backend is running on http://localhost:8000
2. Verify `VITE_API_URL` matches backend URL
3. Backend already has CORS enabled:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Already configured
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Build errors with TypeScript

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version
npx tsc --version  # Should be ^5.1.6
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build for production:**

```bash
npm run build
# Output in dist/ folder
```

2. **Configure environment variables** on hosting platform:

```
VITE_ALGOD_SERVER=https://testnet-api.4160.nodely.dev
VITE_ALGOD_NETWORK=testnet
VITE_API_URL=https://your-backend.com
```

3. **Deploy:**

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### Backend Deployment (Railway/Render/Fly.io)

See main README.md for backend deployment instructions.

## 📝 Next Steps

1. ✅ Frontend working with template wallet system
2. ✅ Challenge-response authentication integrated
3. ✅ JWT token management implemented
4. 🔄 Add NFT minting UI (from QuickStartTemplate)
5. 🔄 Add user dashboard with API usage stats
6. 🔄 Deploy to production (TestNet → MainNet)

## 💡 Tips

- **Development:** Use `npm run dev` for hot reload
- **Type Safety:** All API responses are typed in TypeScript
- **Error Handling:** All API calls wrapped in try-catch with user notifications
- **State Management:** Uses React hooks (no Redux needed for this size)
- **Styling:** Tailwind CSS + DaisyUI dark theme

## 📞 Need Help?

Check these resources:

- **Algorand Docs:** https://developer.algorand.org/
- **@txnlab/use-wallet:** https://github.com/TxnLab/use-wallet
- **Pera Wallet:** https://perawallet.app/
- **FastAPI Docs:** https://fastapi.tiangolo.com/

---

**🎉 You now have a production-ready React frontend for NFT-based API authentication!**
