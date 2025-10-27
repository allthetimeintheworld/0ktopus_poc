#!/usr/bin/env python3
"""Quick NFT creation for your wallet"""

from algosdk.v2client import algod
from algosdk import account, transaction, mnemonic
import json

# Your mnemonic
MNEMONIC = "pepper adapt later tooth have poet sister amused acquire cigar chapter crew fossil deputy seed gallery about arm diet violin tooth nurse rotate bonus"

# TestNet configuration
ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def main():
    # Get account from mnemonic
    private_key = mnemonic.to_private_key(MNEMONIC)
    address = account.address_from_private_key(private_key)

    print(f"Creating NFT for: {address}")

    # Connect to Algorand
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

    # Check balance
    account_info = client.account_info(address)
    balance = account_info.get('amount') / 1_000_000
    print(f"Balance: {balance} ALGO")

    if balance < 0.2:
        print("⚠️ Insufficient balance!")
        return

    # Create NFT
    print("\n🎨 Creating API Access NFT...")
    params = client.suggested_params()

    txn = transaction.AssetConfigTxn(
        sender=address,
        sp=params,
        total=1,
        decimals=0,
        default_frozen=False,
        unit_name="APIKEY",
        asset_name="API Access Pass",
        url="https://api.example.com/nft-metadata.json",
        manager=address,
        reserve=address,
        freeze=address,
        clawback=address
    )

    # Sign and send
    signed_txn = txn.sign(private_key)
    txid = client.send_transaction(signed_txn)

    print(f"Transaction ID: {txid}")
    print("Waiting for confirmation...")

    # Wait for confirmation
    confirmed_txn = transaction.wait_for_confirmation(client, txid, 4)
    asset_id = confirmed_txn.get('asset-index')

    print(f"\n✅ NFT CREATED!")
    print(f"Asset ID: {asset_id}")
    print(f"Owner: {address}")
    print(f"\n🔍 View on explorer:")
    print(f"https://testnet.algoexplorer.io/asset/{asset_id}")

    # Save config
    config = {
        "asset_id": asset_id,
        "owner_address": address,
        "network": "testnet",
        "explorer_url": f"https://testnet.algoexplorer.io/asset/{asset_id}"
    }

    with open('nft_config.json', 'w') as f:
        json.dump(config, f, indent=2)

    print(f"\n📝 Next step: Add to .env file:")
    print(f"NFT_ASSET_ID={asset_id}")

    # Update .env automatically
    with open('.env', 'r') as f:
        env_content = f.read()

    env_content = env_content.replace('NFT_ASSET_ID=', f'NFT_ASSET_ID={asset_id}')

    with open('.env', 'w') as f:
        f.write(env_content)

    print(f"✅ .env updated automatically!")

if __name__ == "__main__":
    main()
