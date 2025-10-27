#!/usr/bin/env python3
"""
Test the complete NFT authentication flow via command line
Simulates what the browser wallet would do
"""

import requests
import json
from algosdk import encoding
import base64

# Load our test wallet
with open('temp_wallet.json', 'r') as f:
    wallet = json.load(f)

ADDRESS = wallet['address']
PRIVATE_KEY = wallet['private_key']

API_URL = "http://localhost:8000"

print("=" * 60)
print("NFT API Authentication Flow - Command Line Test")
print("=" * 60)
print(f"\nWallet: {ADDRESS}")
print(f"NFT Asset ID: 747080196")

# Step 1: Get challenge
print("\n📝 Step 1: Requesting authentication challenge...")
response = requests.post(f"{API_URL}/auth/challenge", json={
    "address": ADDRESS
})

if response.status_code != 200:
    print(f"❌ Failed: {response.text}")
    exit(1)

challenge = response.json()
print(f"✅ Challenge received:")
print(f"   Nonce: {challenge['nonce'][:32]}...")
print(f"   Timestamp: {challenge['timestamp']}")

# Step 2: Sign challenge (what Pera Wallet would do)
print(f"\n✍️  Step 2: Signing challenge with private key...")
message = json.dumps(challenge, separators=(',', ':')).encode('utf-8')

# Sign the message
from nacl.signing import SigningKey
signing_key = SigningKey(base64.b64decode(PRIVATE_KEY)[:32])
signature_bytes = signing_key.sign(message).signature
signature_b64 = base64.b64encode(signature_bytes).decode('utf-8')

print(f"✅ Signature created: {signature_b64[:40]}...")

# Step 3: Verify signature and get JWT
print(f"\n🔍 Step 3: Verifying signature + NFT ownership...")
response = requests.post(f"{API_URL}/auth/verify", json={
    "address": ADDRESS,
    "signature": signature_b64,
    "challenge": challenge
})

if response.status_code != 200:
    print(f"❌ Verification failed: {response.text}")
    exit(1)

auth_data = response.json()
access_token = auth_data['access_token']

print(f"✅ Authentication successful!")
print(f"   Access Token: {access_token[:40]}...")
print(f"   Expires in: {auth_data['expires_in']}s")

# Step 4: Call protected API
print(f"\n🔐 Step 4: Calling protected API endpoint...")
response = requests.get(f"{API_URL}/api/protected", headers={
    "Authorization": f"Bearer {access_token}"
})

if response.status_code != 200:
    print(f"❌ API call failed: {response.text}")
    exit(1)

protected_data = response.json()

print(f"✅ Protected data received!")
print(f"\n{json.dumps(protected_data, indent=2)}")

# Step 5: Call user info endpoint
print(f"\n👤 Step 5: Getting user info...")
response = requests.get(f"{API_URL}/api/user/info", headers={
    "Authorization": f"Bearer {access_token}"
})

if response.status_code == 200:
    user_info = response.json()
    print(f"✅ User info:")
    print(f"\n{json.dumps(user_info, indent=2)}")

print(f"\n" + "=" * 60)
print("🎉 SUCCESS! NFT-based authentication works!")
print("=" * 60)
print(f"\n✅ Proved wallet ownership via cryptographic signature")
print(f"✅ Verified NFT ownership on Algorand blockchain")
print(f"✅ Received JWT access token")
print(f"✅ Accessed protected API endpoints")
print(f"\n💡 No API keys needed - NFT = access credential!")
