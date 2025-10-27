#!/usr/bin/env python3
"""
Quick System Check - Verify everything is set up correctly
"""

import os
import sys
from pathlib import Path

def check_files():
    """Check if required files exist"""
    print("📂 Checking file structure...")
    
    required_files = {
        "api_server.py": "FastAPI backend",
        "nft_manager.py": "NFT management tool",
        "requirements.txt": "Python dependencies",
        ".env.example": "Configuration template",
        "frontend/package.json": "Frontend dependencies",
        "frontend/src/Home.tsx": "Main frontend page",
        "frontend/src/components/MintNFT.tsx": "Minting component",
        "frontend/src/components/AuthFlow.tsx": "Auth component",
    }
    
    missing = []
    for file, desc in required_files.items():
        if Path(file).exists():
            print(f"  ✅ {file} - {desc}")
        else:
            print(f"  ❌ {file} - {desc} (MISSING)")
            missing.append(file)
    
    return len(missing) == 0

def check_dependencies():
    """Check if Python dependencies are installed"""
    print("\n🐍 Checking Python dependencies...")
    
    required_modules = [
        ("fastapi", "FastAPI framework"),
        ("uvicorn", "ASGI server"),
        ("algosdk", "Algorand SDK"),
        ("jwt", "JWT tokens (PyJWT)"),
        ("redis", "Redis client"),
        ("dotenv", "Environment variables"),
        ("pydantic", "Data validation"),
    ]
    
    missing = []
    for module, desc in required_modules:
        try:
            __import__(module)
            print(f"  ✅ {module} - {desc}")
        except ImportError:
            print(f"  ❌ {module} - {desc} (NOT INSTALLED)")
            missing.append(module)
    
    if missing:
        print(f"\n  ⚠️  Install missing: pip install {' '.join(missing)}")
        return False
    
    return True

def check_env():
    """Check environment configuration"""
    print("\n⚙️  Checking configuration...")
    
    env_file = Path(".env")
    if not env_file.exists():
        print("  ⚠️  .env file not found")
        print("  📝 Run: cp .env.example .env")
        return False
    
    print("  ✅ .env file exists")
    
    # Check key variables
    from dotenv import load_dotenv
    load_dotenv()
    
    checks = {
        "ALGORAND_ALGOD_URL": "Algorand node URL",
        "ALGORAND_INDEXER_URL": "Algorand indexer URL",
        "JWT_SECRET": "JWT secret key",
    }
    
    missing = []
    for var, desc in checks.items():
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            display = value[:20] + "..." if len(value) > 20 else value
            print(f"  ✅ {var} = {display}")
        else:
            print(f"  ⚠️  {var} not set - {desc}")
            missing.append(var)
    
    # NFT_ASSET_ID is optional initially
    nft_id = os.getenv("NFT_ASSET_ID")
    if nft_id:
        print(f"  ✅ NFT_ASSET_ID = {nft_id}")
    else:
        print(f"  ℹ️  NFT_ASSET_ID not set (will be filled after minting)")
    
    return len(missing) == 0

def check_frontend():
    """Check frontend setup"""
    print("\n🎨 Checking frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("  ❌ Frontend directory not found")
        return False
    
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("  ⚠️  node_modules not found")
        print("  📝 Run: cd frontend && npm install")
        return False
    
    print("  ✅ node_modules exists")
    
    frontend_env = frontend_dir / ".env"
    if not frontend_env.exists():
        print("  ⚠️  frontend/.env not found")
        print("  📝 Run: cd frontend && cp .env.example .env")
        return False
    
    print("  ✅ frontend/.env exists")
    
    return True

def check_network():
    """Check Algorand TestNet connectivity"""
    print("\n🌐 Checking Algorand TestNet connectivity...")
    
    try:
        from algosdk.v2client import algod
        
        algod_url = os.getenv("ALGORAND_ALGOD_URL", "https://testnet-api.algonode.cloud")
        algod_token = os.getenv("ALGORAND_ALGOD_TOKEN", "")
        
        client = algod.AlgodClient(algod_token, algod_url)
        status = client.status()
        
        print(f"  ✅ Connected to Algorand TestNet")
        print(f"  ℹ️  Last round: {status.get('last-round')}")
        return True
    except Exception as e:
        print(f"  ❌ Cannot connect to Algorand: {e}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("🔍 AllGoGrand System Check")
    print("=" * 60)
    
    checks = [
        ("File Structure", check_files),
        ("Python Dependencies", check_dependencies),
        ("Environment Config", check_env),
        ("Frontend Setup", check_frontend),
        ("Network Connectivity", check_network),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"\n❌ Error in {name}: {e}")
            results[name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All checks passed! System is ready.")
        print("\n🚀 Next steps:")
        print("   1. Start backend: python api_server.py")
        print("   2. Start frontend: cd frontend && npm run dev")
        print("   3. Open browser: http://localhost:5173")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
