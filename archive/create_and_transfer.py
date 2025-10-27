#!/usr/bin/env python3
"""Create NFT and transfer to Pera wallet - no input required"""

from algosdk.v2client import algod
from algosdk import account, transaction
import json
import time

# Your Pera Wallet address
YOUR_WALLET = "5I2JGWH7O5MATWRTKI6BIY2LPVCJ2RWC3QBE3XEYIBS2DFNCDPLNS3HFF4"

# Temporary wallet (just generated)
TEMP_ADDRESS = "FAAFOQKFCM326G3JJ4IKNO2KVEE6YATW3DA4TWZWCEYSA2IE5YWL3B7EMY"

# TestNet configuration
ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Load the temp private key from the previous script
# Since we just generated it, I'll regenerate with same seed approach
# Actually, let me use a simpler approach - save/load from file

def main():
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

    print("=" * 60)
    print("NFT Creation & Transfer")
    print("=" * 60)

    # Generate temp wallet (deterministic for this session)
    import hashlib
    seed = hashlib.sha256(b"temp_nft_creator_seed_12345").digest()
    from algosdk import encoding
    temp_private_key = seed[:32]  # Use first 32 bytes

    # Actually, safer to generate fresh and save
    temp_private_key, temp_address = account.generate_account()

    print(f"\n📝 Temporary wallet: {temp_address}")
    print("Checking balance...")

    # Check balance
    max_retries = 10
    for i in range(max_retries):
        try:
            account_info = client.account_info(temp_address)
            balance = account_info.get('amount') / 1_000_000

            if balance >= 0.3:
                print(f"✅ Balance: {balance} ALGO")
                break
            else:
                print(f"Waiting for funds... ({i+1}/{max_retries})")
                time.sleep(3)
        except Exception as e:
            print(f"Waiting for funding... ({i+1}/{max_retries})")
            time.sleep(3)
    else:
        print("❌ Wallet not funded within timeout")
        print(f"Please fund: {temp_address}")
        return

    # Create NFT
    print(f"\n🎨 Creating API Access NFT...")
    params = client.suggested_params()

    txn = transaction.AssetConfigTxn(
        sender=temp_address,
        sp=params,
        total=1,
        decimals=0,
        default_frozen=False,
        unit_name="APIKEY",
        asset_name="API Access Pass",
        url="https://api.example.com/nft-metadata.json",
        manager=temp_address,
        reserve=temp_address,
        freeze=temp_address,
        clawback=temp_address
    )

    signed_txn = txn.sign(temp_private_key)
    txid = client.send_transaction(signed_txn)

    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")

    confirmed_txn = transaction.wait_for_confirmation(client, txid, 4)
    asset_id = confirmed_txn.get('asset-index')

    print(f"\n✅ NFT CREATED!")
    print(f"Asset ID: {asset_id}")
    print(f"https://testnet.algoexplorer.io/asset/{asset_id}")

    # Check if your wallet needs to opt-in
    print(f"\n📥 Checking if your wallet has opted into the asset...")

    try:
        your_account_info = client.account_info(YOUR_WALLET)
        assets = your_account_info.get('assets', [])
        has_opted_in = any(a['asset-id'] == asset_id for a in assets)

        if not has_opted_in:
            print(f"⚠️  Your wallet needs to opt-in to receive the NFT")
            print(f"\n🔧 MANUAL STEP REQUIRED:")
            print(f"   1. Open Pera Wallet app/extension")
            print(f"   2. Switch to TestNet")
            print(f"   3. Tap '+' or 'Add Asset'")
            print(f"   4. Enter Asset ID: {asset_id}")
            print(f"   5. Tap 'Add' to opt-in")
            print(f"\nOR use this URL:")
            print(f"   https://testnet.algoexplorer.io/asset/{asset_id}")
            print(f"   Click 'Add to Pera Wallet' button")

            print(f"\n⏳ Waiting 30 seconds for you to opt-in...")
            time.sleep(30)

            # Check again
            your_account_info = client.account_info(YOUR_WALLET)
            assets = your_account_info.get('assets', [])
            has_opted_in = any(a['asset-id'] == asset_id for a in assets)

            if not has_opted_in:
                print(f"❌ Still not opted in. Please complete opt-in and run transfer manually.")
                print(f"\nTo transfer later, use:")
                print(f"  Asset ID: {asset_id}")
                print(f"  From: {temp_address}")
                print(f"  To: {YOUR_WALLET}")

                # Save for manual transfer
                with open('transfer_info.json', 'w') as f:
                    json.dump({
                        'asset_id': asset_id,
                        'temp_private_key': temp_private_key,
                        'temp_address': temp_address,
                        'your_wallet': YOUR_WALLET
                    }, f, indent=2)
                print(f"\n📝 Transfer info saved to transfer_info.json")
                return

        print(f"✅ Your wallet is ready to receive!")

    except Exception as e:
        print(f"⚠️  Could not verify opt-in status: {e}")
        print(f"Attempting transfer anyway...")

    # Transfer NFT
    print(f"\n📤 Transferring NFT to your wallet...")
    params = client.suggested_params()

    transfer_txn = transaction.AssetTransferTxn(
        sender=temp_address,
        sp=params,
        receiver=YOUR_WALLET,
        amt=1,
        index=asset_id
    )

    signed_transfer = transfer_txn.sign(temp_private_key)

    try:
        txid = client.send_transaction(signed_transfer)
        print(f"Transfer transaction ID: {txid}")
        transaction.wait_for_confirmation(client, txid, 4)

        print(f"\n🎉 SUCCESS! NFT transferred to your wallet!")
        print(f"Check your Pera Wallet - you should see the NFT now")
        print(f"\n🔍 Verify on explorer:")
        print(f"https://testnet.algoexplorer.io/address/{YOUR_WALLET}")

    except Exception as e:
        print(f"❌ Transfer failed: {e}")
        print(f"\nLikely cause: Your wallet hasn't opted in yet")
        print(f"Please opt-in to asset {asset_id} in Pera Wallet")

        # Save for manual transfer
        with open('transfer_info.json', 'w') as f:
            json.dump({
                'asset_id': asset_id,
                'temp_private_key': temp_private_key,
                'temp_address': temp_address,
                'your_wallet': YOUR_WALLET
            }, f, indent=2)
        print(f"Transfer info saved to transfer_info.json")
        print(f"Run manual_transfer.py after opting in")

    # Save config
    config = {
        "asset_id": asset_id,
        "owner_address": YOUR_WALLET,
        "network": "testnet",
        "explorer_url": f"https://testnet.algoexplorer.io/asset/{asset_id}"
    }

    with open('nft_config.json', 'w') as f:
        json.dump(config, f, indent=2)

    print(f"\n📝 Configuration saved to nft_config.json")

    # Update .env
    with open('.env', 'r') as f:
        env_content = f.read()

    env_content = env_content.replace('NFT_ASSET_ID=', f'NFT_ASSET_ID={asset_id}')

    with open('.env', 'w') as f:
        f.write(env_content)

    print(f"✅ .env updated with NFT_ASSET_ID={asset_id}")
    print(f"\n🚀 Ready to start the API server!")
    print(f"   source venv/bin/activate")
    print(f"   python api_server.py")

if __name__ == "__main__":
    main()
