#!/usr/bin/env python3
"""
NFT-Based API Access Control Server
FastAPI backend that verifies wallet ownership and NFT holdings
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from algosdk import encoding
from algosdk.v2client import indexer
import jwt
import redis
import secrets
import json
import time
import base64
import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

# Configuration
INDEXER_URL = os.getenv('ALGORAND_INDEXER_URL', 'https://testnet-idx.algonode.cloud')
nft_asset_id_str = os.getenv('NFT_ASSET_ID', '0').strip()
NFT_ASSET_ID = int(nft_asset_id_str) if nft_asset_id_str else 0
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_hex(32))
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_DB = int(os.getenv('REDIS_DB', '0'))
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', '8000'))

# Initialize FastAPI
app = FastAPI(
    title="NFT API Access Control",
    description="API authentication using Algorand NFT ownership",
    version="1.0.0"
)

# Warn if NFT_ASSET_ID is not configured
if NFT_ASSET_ID == 0:
    print("⚠️  WARNING: NFT_ASSET_ID is not set in .env file!")
    print("   Please mint an NFT and update the NFT_ASSET_ID in your .env file")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Redis
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True
    )
    redis_client.ping()
    print("✅ Redis connected")
except Exception as e:
    print(f"⚠️  Redis connection failed: {e}")
    print("Challenge storage will use in-memory fallback")
    redis_client = None

# In-memory fallback for challenges
challenge_store = {}

# Initialize Algorand Indexer
indexer_client = indexer.IndexerClient(
    indexer_token="",
    indexer_address=INDEXER_URL
)

# Request/Response Models
class ChallengeRequest(BaseModel):
    address: str

class VerifyRequest(BaseModel):
    address: str
    signature: str
    challenge: dict

class ChallengeResponse(BaseModel):
    message: str
    nonce: str
    timestamp: int
    address: str
    domain: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

# Utility Functions
def store_challenge(address: str, challenge: dict, ttl: int = 300):
    """Store challenge with 5-minute expiry"""
    if redis_client:
        redis_client.setex(
            f"challenge:{address}",
            ttl,
            json.dumps(challenge)
        )
    else:
        # In-memory fallback
        challenge_store[address] = {
            "data": challenge,
            "expires": time.time() + ttl
        }

def get_challenge(address: str) -> Optional[dict]:
    """Retrieve stored challenge"""
    if redis_client:
        data = redis_client.get(f"challenge:{address}")
        return json.loads(data) if data else None
    else:
        # In-memory fallback
        stored = challenge_store.get(address)
        if stored and stored['expires'] > time.time():
            return stored['data']
        elif stored:
            del challenge_store[address]
        return None

def delete_challenge(address: str):
    """Delete challenge after use"""
    if redis_client:
        redis_client.delete(f"challenge:{address}")
    else:
        challenge_store.pop(address, None)

def verify_signature(message: bytes, signature: bytes, address: str) -> bool:
    """
    Verify cryptographic signature using Algorand Ed25519

    Args:
        message: Original message that was signed
        signature: Signature bytes
        address: Algorand address (public key)

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        from nacl.signing import VerifyKey
        from nacl.exceptions import BadSignatureError

        # Convert Algorand address to public key bytes
        public_key_bytes = encoding.decode_address(address)
        verify_key = VerifyKey(public_key_bytes)

        # Verify signature
        verify_key.verify(message, signature)
        return True
    except BadSignatureError:
        return False
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

def check_nft_ownership(address: str, asset_id: int) -> bool:
    """
    Check if wallet address owns the NFT

    Args:
        address: Algorand wallet address
        asset_id: NFT asset ID

    Returns:
        True if address owns the NFT, False otherwise
    """
    try:
        account_info = indexer_client.account_info(address)
        assets = account_info.get('account', {}).get('assets', [])

        for asset in assets:
            if asset.get('asset-id') == asset_id and asset.get('amount', 0) > 0:
                return True

        return False

    except Exception as e:
        print(f"NFT ownership check error: {e}")
        return False

def is_valid_algorand_address(address: str) -> bool:
    """Validate Algorand address format"""
    try:
        encoding.decode_address(address)
        return True
    except:
        return False

# API Endpoints
@app.get("/")
async def root():
    """API information"""
    return {
        "name": "NFT API Access Control",
        "version": "1.0.0",
        "status": "active",
        "nft_asset_id": NFT_ASSET_ID,
        "endpoints": {
            "challenge": "POST /auth/challenge",
            "verify": "POST /auth/verify",
            "protected": "GET /api/protected",
            "status": "GET /api/status"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    redis_status = "connected" if redis_client else "fallback"

    return {
        "status": "healthy",
        "redis": redis_status,
        "indexer": INDEXER_URL,
        "nft_configured": NFT_ASSET_ID > 0
    }

@app.post("/auth/challenge", response_model=ChallengeResponse)
async def create_challenge(request: ChallengeRequest):
    """
    Step 1: Generate authentication challenge

    User requests a challenge to sign with their wallet.
    Challenge contains random nonce to prevent replay attacks.
    """
    address = request.address

    # Validate address format
    if not is_valid_algorand_address(address):
        raise HTTPException(status_code=400, detail="Invalid Algorand address")

    # Generate unique challenge
    challenge = {
        "message": "Authenticate to API service",
        "nonce": secrets.token_hex(32),
        "timestamp": int(time.time()),
        "address": address,
        "domain": "api.example.com"
    }

    # Store challenge for 5 minutes
    store_challenge(address, challenge, ttl=300)

    print(f"📝 Challenge created for {address}")

    return challenge

@app.post("/auth/verify", response_model=TokenResponse)
async def verify_signature_and_nft(request: VerifyRequest):
    """
    Step 2: Verify signature and NFT ownership

    User submits signed challenge. Backend verifies:
    1. Signature is cryptographically valid
    2. Challenge hasn't expired
    3. Wallet owns the required NFT

    Returns JWT access token if all checks pass.
    """
    address = request.address
    signature_b64 = request.signature
    challenge_data = request.challenge

    # Check NFT is configured
    if NFT_ASSET_ID == 0:
        raise HTTPException(
            status_code=503,
            detail="NFT_ASSET_ID not configured. Run mint_nft.py first."
        )

    # 1. Retrieve stored challenge
    stored_challenge = get_challenge(address)
    if not stored_challenge:
        raise HTTPException(
            status_code=401,
            detail="Challenge not found or expired. Request new challenge."
        )

    # 2. Verify challenge data matches
    if challenge_data != stored_challenge:
        raise HTTPException(
            status_code=401,
            detail="Challenge data mismatch"
        )

    # 3. Check timestamp (max 5 minutes old)
    current_time = int(time.time())
    if current_time - stored_challenge.get('timestamp', 0) > 300:
        delete_challenge(address)
        raise HTTPException(
            status_code=401,
            detail="Challenge expired"
        )

    # 4. Verify cryptographic signature
    try:
        message = json.dumps(challenge_data, separators=(',', ':')).encode('utf-8')
        signature_bytes = base64.b64decode(signature_b64)

        is_valid = verify_signature(message, signature_bytes, address)

        if not is_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid signature - wallet ownership not proven"
            )

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Signature verification failed: {str(e)}"
        )

    # 5. Check NFT ownership
    owns_nft = check_nft_ownership(address, NFT_ASSET_ID)

    if not owns_nft:
        raise HTTPException(
            status_code=403,
            detail=f"NFT (asset {NFT_ASSET_ID}) not found in wallet. API access denied."
        )

    # 6. Delete challenge (prevent reuse)
    delete_challenge(address)

    # 7. Issue JWT access token
    token_payload = {
        "wallet": address,
        "nft": NFT_ASSET_ID,
        "iat": current_time,
        "exp": current_time + 3600  # 1 hour expiration
    }

    access_token = jwt.encode(token_payload, JWT_SECRET, algorithm='HS256')

    print(f"✅ Authentication successful for {address}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 3600
    }

@app.get("/api/status")
async def public_status():
    """Public endpoint - no authentication required"""
    return {
        "status": "online",
        "message": "This is a public endpoint",
        "authentication": "not required"
    }

@app.get("/api/protected")
async def protected_endpoint(authorization: Optional[str] = Header(None)):
    """
    Protected endpoint - requires valid JWT from NFT holder

    Demonstrates NFT-gated API access.
    """
    # Check Authorization header
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header. Format: Bearer <token>"
        )

    token = authorization.split(' ')[1]

    # Verify JWT
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    wallet_address = payload.get('wallet')
    nft_asset_id = payload.get('nft')

    # Optional: Re-verify NFT ownership (catches stolen/transferred NFTs)
    # Uncomment for maximum security (adds ~200ms latency)
    # owns_nft = check_nft_ownership(wallet_address, nft_asset_id)
    # if not owns_nft:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="NFT no longer in wallet. Access revoked."
    #     )

    # Return protected data
    return {
        "message": "🎉 Success! You have access to protected content.",
        "wallet": wallet_address,
        "nft_asset_id": nft_asset_id,
        "data": {
            "secret": "This data is only visible to NFT holders",
            "api_key": "sk_live_abc123xyz789",
            "premium_features": ["feature_1", "feature_2", "feature_3"]
        }
    }

@app.get("/api/user/info")
async def user_info(authorization: Optional[str] = Header(None)):
    """Get authenticated user information"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="No authorization token")

    token = authorization.split(' ')[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    wallet = payload.get('wallet')
    nft = payload.get('nft')

    # Get account info from blockchain
    try:
        account_info = indexer_client.account_info(wallet)
        balance = account_info.get('account', {}).get('amount', 0) / 1_000_000

        return {
            "wallet_address": wallet,
            "nft_asset_id": nft,
            "algo_balance": balance,
            "token_issued_at": payload.get('iat'),
            "token_expires_at": payload.get('exp')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account info: {e}")

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom error response format"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on server startup"""
    print("\n" + "=" * 60)
    print("NFT API Access Control Server")
    print("=" * 60)
    print(f"Indexer: {INDEXER_URL}")
    print(f"NFT Asset ID: {NFT_ASSET_ID}")
    print(f"Redis: {REDIS_HOST}:{REDIS_PORT}")
    print(f"JWT Secret: {'*' * 32}")
    print("=" * 60)

    if NFT_ASSET_ID == 0:
        print("\n⚠️  WARNING: NFT_ASSET_ID not configured!")
        print("Run: python mint_nft.py")
        print("Then update .env with NFT_ASSET_ID")
    print()

if __name__ == "__main__":
    import uvicorn

    print("\n🚀 Starting server...")
    print(f"API will be available at: http://{API_HOST}:{API_PORT}")
    print(f"API docs: http://{API_HOST}:{API_PORT}/docs")
    print()

    uvicorn.run(
        app,
        host=API_HOST,
        port=API_PORT,
        log_level="info"
    )
