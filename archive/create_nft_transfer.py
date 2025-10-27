#!/usr/bin/env python3
"""Create NFT with new wallet and transfer to your Pera wallet"""

from algosdk.v2client import algod
from algosdk import account, transaction
import json

# Your Pera Wallet address
YOUR_WALLET = "5I2JGWH7O5MATWRTKI6BIY2LPVCJ2RWC3QBE3XEYIBS2DFNCDPLNS3HFF4"

# TestNet configuration
ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def main():
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

    print("=" * 60)
    print("NFT Creation & Transfer Script")
    print("=" * 60)

    # Step 1: Generate temporary wallet for NFT creation
    print("\n📝 Generating temporary wallet for NFT creation...")
    creator_private_key, creator_address = account.generate_account()

    print(f"Temporary wallet: {creator_address}")
    print(f"\n💰 Fund this wallet with test ALGO:")
    print(f"   https://bank.testnet.algorand.network/")
    print(f"\n⚠️  You need to fund this address before continuing!")

    input("\nPress ENTER after funding the wallet...")

    # Check balance
    try:
        account_info = client.account_info(creator_address)
        balance = account_info.get('amount') / 1_000_000
        print(f"\n✅ Balance: {balance} ALGO")

        if balance < 0.3:
            print("❌ Need at least 0.3 ALGO (for NFT creation + transfer)")
            return
    except Exception as e:
        print(f"❌ Wallet not funded yet: {e}")
        return

    # Step 2: Create NFT
    print(f"\n🎨 Creating API Access NFT...")
    params = client.suggested_params()

    txn = transaction.AssetConfigTxn(
        sender=creator_address,
        sp=params,
        total=1,
        decimals=0,
        default_frozen=False,
        unit_name="APIKEY",
        asset_name="API Access Pass",
        url="https://api.example.com/nft-metadata.json",
        manager=creator_address,
        reserve=creator_address,
        freeze=creator_address,
        clawback=creator_address
    )

    signed_txn = txn.sign(creator_private_key)
    txid = client.send_transaction(signed_txn)

    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")

    confirmed_txn = transaction.wait_for_confirmation(client, txid, 4)
    asset_id = confirmed_txn.get('asset-index')

    print(f"\n✅ NFT CREATED!")
    print(f"Asset ID: {asset_id}")
    print(f"https://testnet.algoexplorer.io/asset/{asset_id}")

    # Step 3: Opt-in to asset (your wallet must accept it first)
    print(f"\n📥 Your Pera Wallet needs to opt-in to receive the NFT")
    print(f"\nOption 1 (Automatic - needs your mnemonic):")
    print(f"   Enter your 25-word mnemonic to auto opt-in")
    print(f"\nOption 2 (Manual - safer):")
    print(f"   1. Open Pera Wallet app")
    print(f"   2. Go to 'Add Asset'")
    print(f"   3. Search for asset ID: {asset_id}")
    print(f"   4. Click 'Add'")

    choice = input("\nUse automatic opt-in? (y/n): ").lower()

    if choice == 'y':
        print("\n⚠️ This requires your 25-word mnemonic phrase")
        user_mnemonic = input("Enter your mnemonic: ").strip()

        try:
            from algosdk import mnemonic
            user_private_key = mnemonic.to_private_key(user_mnemonic)
            user_address = account.address_from_private_key(user_private_key)

            if user_address != YOUR_WALLET:
                print(f"❌ Mnemonic doesn't match wallet {YOUR_WALLET}")
                print("Please opt-in manually in Pera Wallet app")
                input("Press ENTER after opting in...")
            else:
                # Opt-in transaction
                params = client.suggested_params()
                opt_in_txn = transaction.AssetTransferTxn(
                    sender=user_address,
                    sp=params,
                    receiver=user_address,
                    amt=0,
                    index=asset_id
                )
                signed_opt_in = opt_in_txn.sign(user_private_key)
                txid = client.send_transaction(signed_opt_in)
                transaction.wait_for_confirmation(client, txid, 4)
                print("✅ Opt-in successful!")

        except Exception as e:
            print(f"❌ Error: {e}")
            print("Please opt-in manually in Pera Wallet app")
            input("Press ENTER after opting in...")
    else:
        print("\n👉 Please opt-in manually in Pera Wallet, then press ENTER")
        input()

    # Step 4: Transfer NFT
    print(f"\n📤 Transferring NFT to your wallet...")
    params = client.suggested_params()

    transfer_txn = transaction.AssetTransferTxn(
        sender=creator_address,
        sp=params,
        receiver=YOUR_WALLET,
        amt=1,
        index=asset_id
    )

    signed_transfer = transfer_txn.sign(creator_private_key)
    txid = client.send_transaction(signed_transfer)

    print(f"Transfer transaction ID: {txid}")
    transaction.wait_for_confirmation(client, txid, 4)

    print(f"\n🎉 SUCCESS! NFT transferred to your wallet!")
    print(f"Check your Pera Wallet - you should see the NFT now")
    print(f"\n🔍 Verify on explorer:")
    print(f"https://testnet.algoexplorer.io/address/{YOUR_WALLET}")

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
    print(f"   python api_server.py")

if __name__ == "__main__":
    main()
