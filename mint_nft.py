#!/usr/bin/env python3
"""
NFT Minting Script for API Access Control
Creates a unique NFT on Algorand TestNet that represents API access rights
"""

from algosdk.v2client import algod
from algosdk import account, transaction
import json

# Algorand TestNet configuration
ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def create_algod_client():
    """Create connection to Algorand node"""
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

def generate_account():
    """Generate new Algorand account"""
    private_key, address = account.generate_account()
    return private_key, address

def wait_for_confirmation(client, txid):
    """Wait for transaction confirmation"""
    last_round = client.status().get('last-round')
    txinfo = client.pending_transaction_info(txid)

    while not (txinfo.get('confirmed-round') and txinfo.get('confirmed-round') > 0):
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)
        txinfo = client.pending_transaction_info(txid)

    print(f"Transaction confirmed in round {txinfo.get('confirmed-round')}")
    return txinfo

def create_access_nft(creator_address, creator_private_key):
    """
    Create NFT representing API access

    Args:
        creator_address: Address of NFT creator
        creator_private_key: Private key to sign transaction

    Returns:
        asset_id: The created NFT's asset ID
    """
    client = create_algod_client()

    # Get suggested parameters
    params = client.suggested_params()

    # NFT Configuration
    nft_config = {
        "sender": creator_address,
        "sp": params,
        "total": 1,                    # Only 1 exists (unique)
        "decimals": 0,                 # Non-divisible
        "default_frozen": False,       # Transferable
        "unit_name": "APIKEY",        # Short name
        "asset_name": "API Access Pass",  # Full name
        "url": "https://api.example.com/nft-metadata.json",
        "manager": creator_address,    # Can change settings
        "reserve": creator_address,    # Where uncirculated assets go
        "freeze": creator_address,     # Can freeze transfers
        "clawback": creator_address,   # Can revoke from holders
    }

    # Create asset transaction
    txn = transaction.AssetConfigTxn(**nft_config)

    # Sign transaction
    signed_txn = txn.sign(creator_private_key)

    # Send transaction
    txid = client.send_transaction(signed_txn)
    print(f"Transaction ID: {txid}")

    # Wait for confirmation
    confirmed_txn = wait_for_confirmation(client, txid)

    # Get asset ID
    asset_id = confirmed_txn.get('asset-index')

    return asset_id

def opt_in_to_asset(account_address, account_private_key, asset_id):
    """
    Opt-in to receive NFT (required on Algorand)

    Args:
        account_address: Address opting in
        account_private_key: Private key to sign
        asset_id: Asset to opt into
    """
    client = create_algod_client()
    params = client.suggested_params()

    # Opt-in transaction (send 0 of asset to yourself)
    txn = transaction.AssetTransferTxn(
        sender=account_address,
        sp=params,
        receiver=account_address,
        amt=0,
        index=asset_id
    )

    signed_txn = txn.sign(account_private_key)
    txid = client.send_transaction(signed_txn)

    print(f"Opt-in transaction ID: {txid}")
    wait_for_confirmation(client, txid)
    print(f"✅ Account {account_address} opted into asset {asset_id}")

def transfer_nft(from_address, from_private_key, to_address, asset_id):
    """
    Transfer NFT to another account

    Args:
        from_address: Sender address
        from_private_key: Sender private key
        to_address: Receiver address
        asset_id: NFT asset ID
    """
    client = create_algod_client()
    params = client.suggested_params()

    txn = transaction.AssetTransferTxn(
        sender=from_address,
        sp=params,
        receiver=to_address,
        amt=1,  # Transfer the 1 NFT
        index=asset_id
    )

    signed_txn = txn.sign(from_private_key)
    txid = client.send_transaction(signed_txn)

    print(f"Transfer transaction ID: {txid}")
    wait_for_confirmation(client, txid)
    print(f"✅ NFT transferred from {from_address} to {to_address}")

def main():
    """Main minting workflow"""
    print("=" * 60)
    print("NFT API Access Minting Script - Algorand TestNet")
    print("=" * 60)
    print()

    choice = input("Do you have an existing account? (y/n): ").lower()

    if choice == 'y':
        print("\n⚠️  SECURITY WARNING: Never share your private key!")
        private_key = input("Enter your private key (or mnemonic): ").strip()

        # Check if mnemonic or private key
        if ' ' in private_key:
            # It's a mnemonic
            private_key = account.mnemonic.to_private_key(private_key)

        address = account.address_from_private_key(private_key)
        print(f"Using address: {address}")
    else:
        print("\n📝 Generating new account...")
        private_key, address = generate_account()
        mnemonic = account.mnemonic.from_private_key(private_key)

        print(f"\n✅ New account created!")
        print(f"Address: {address}")
        print(f"Private Key: {private_key}")
        print(f"\n🔑 Mnemonic (SAVE THIS!):")
        print(f"{mnemonic}")
        print("\n⚠️  KEEP YOUR MNEMONIC SAFE - It's the only way to recover your wallet!")

    # Check balance
    client = create_algod_client()
    try:
        account_info = client.account_info(address)
        balance = account_info.get('amount') / 1_000_000  # Convert microAlgos to Algos
        print(f"\n💰 Account balance: {balance} ALGO")

        if balance < 0.2:
            print("\n❌ Insufficient balance!")
            print(f"Please fund your account with TestNet Algos:")
            print(f"1. Go to: https://bank.testnet.algorand.network/")
            print(f"2. Enter your address: {address}")
            print(f"3. Request funds")
            print("\nThen run this script again.")
            return
    except Exception as e:
        print(f"\n❌ Could not check account balance: {e}")
        print(f"Please fund your account at: https://bank.testnet.algorand.network/")
        print(f"Address: {address}")
        return

    # Create NFT
    print("\n🎨 Creating API Access NFT...")
    try:
        asset_id = create_access_nft(address, private_key)
        print(f"\n✅ NFT CREATED SUCCESSFULLY!")
        print(f"Asset ID: {asset_id}")
        print(f"Creator: {address}")

        # Save to file
        nft_data = {
            "asset_id": asset_id,
            "creator_address": address,
            "creator_private_key": private_key,
            "network": "testnet",
            "explorer_url": f"https://testnet.algoexplorer.io/asset/{asset_id}"
        }

        with open('nft_config.json', 'w') as f:
            json.dump(nft_data, f, indent=2)

        print(f"\n📄 Configuration saved to nft_config.json")
        print(f"\n🔍 View on explorer:")
        print(f"https://testnet.algoexplorer.io/asset/{asset_id}")

        print(f"\n📝 Next steps:")
        print(f"1. Add this to your .env file: NFT_ASSET_ID={asset_id}")
        print(f"2. To give someone API access, transfer this NFT to their wallet")
        print(f"3. Run the backend API: python api_server.py")

    except Exception as e:
        print(f"\n❌ Error creating NFT: {e}")
        print("\nCommon issues:")
        print("- Insufficient balance (need ~0.2 ALGO)")
        print("- Network connectivity issues")
        return

if __name__ == "__main__":
    main()
