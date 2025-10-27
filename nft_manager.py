#!/usr/bin/env python3
"""
Unified NFT Manager - Mint, Transfer, View NFT Capabilities
Streamlined for Pera Wallet integration on TestNet/DevNet
"""

from algosdk.v2client import algod, indexer
from algosdk import account, transaction, mnemonic
import json
import os
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()

# TestNet/DevNet Configuration
ALGOD_URL = os.getenv('ALGORAND_ALGOD_URL', 'https://testnet-api.algonode.cloud')
ALGOD_TOKEN = os.getenv('ALGORAND_ALGOD_TOKEN', '')
INDEXER_URL = os.getenv('ALGORAND_INDEXER_URL', 'https://testnet-idx.algonode.cloud')
INDEXER_TOKEN = os.getenv('ALGORAND_INDEXER_TOKEN', '')


class NFTManager:
    """Unified NFT management for capability-based access control"""
    
    def __init__(self):
        self.algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)
        self.indexer_client = indexer.IndexerClient(INDEXER_TOKEN, INDEXER_URL)
    
    def get_account_balance(self, address: str) -> float:
        """Get account balance in ALGO"""
        try:
            account_info = self.algod_client.account_info(address)
            return account_info.get('amount', 0) / 1_000_000
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return 0.0
    
    def mint_capability_nft(
        self,
        creator_address: str,
        creator_private_key: str,
        nft_name: str = "API Access Pass",
        unit_name: str = "APIKEY",
        metadata_url: str = "https://api.example.com/nft-metadata.json",
        capabilities: Optional[List[str]] = None
    ) -> Dict:
        """
        Mint a new NFT representing access capabilities
        
        Args:
            creator_address: Wallet address creating the NFT
            creator_private_key: Private key to sign transaction
            nft_name: Full name of the NFT
            unit_name: Short unit name (max 8 chars)
            metadata_url: URL to NFT metadata (IPFS recommended)
            capabilities: List of capabilities this NFT grants
        
        Returns:
            Dict with asset_id, transaction_id, and metadata
        """
        print(f"\n🎨 Minting NFT: {nft_name}")
        print(f"Creator: {creator_address}")
        
        # Check balance
        balance = self.get_account_balance(creator_address)
        print(f"Balance: {balance:.2f} ALGO")
        
        if balance < 0.2:
            raise ValueError(
                f"Insufficient balance! Need at least 0.2 ALGO, have {balance:.2f}\n"
                f"Fund your wallet at: https://bank.testnet.algorand.network/"
            )
        
        # Get suggested parameters
        params = self.algod_client.suggested_params()
        
        # Create NFT metadata note (store capabilities)
        metadata = {
            "name": nft_name,
            "unit_name": unit_name,
            "capabilities": capabilities or ["api_access"],
            "created_at": params.first,
        }
        note = json.dumps(metadata).encode('utf-8')
        
        # Create Asset Configuration Transaction
        txn = transaction.AssetConfigTxn(
            sender=creator_address,
            sp=params,
            total=1,              # Only 1 NFT exists (unique)
            decimals=0,           # Non-divisible
            default_frozen=False, # Transferable
            unit_name=unit_name[:8],  # Max 8 chars
            asset_name=nft_name[:32],  # Max 32 chars
            url=metadata_url[:96],     # Max 96 chars
            manager=creator_address,   # Can change settings
            reserve=creator_address,   # Uncirculated supply holder
            freeze=creator_address,    # Can freeze transfers
            clawback=creator_address,  # Can revoke from holders
            note=note
        )
        
        # Sign and send transaction
        signed_txn = txn.sign(creator_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        print(f"Transaction ID: {txid}")
        print("Waiting for confirmation...")
        
        # Wait for confirmation
        confirmed_txn = transaction.wait_for_confirmation(self.algod_client, txid, 4)
        asset_id = confirmed_txn.get('asset-index')
        
        print(f"\n✅ NFT Created Successfully!")
        print(f"Asset ID: {asset_id}")
        print(f"View on AlgoExplorer: https://testnet.algoexplorer.io/asset/{asset_id}")
        
        # Update .env file with NFT_ASSET_ID
        self._update_env_file(asset_id)
        
        return {
            "asset_id": asset_id,
            "transaction_id": txid,
            "creator": creator_address,
            "metadata": metadata,
            "explorer_url": f"https://testnet.algoexplorer.io/asset/{asset_id}"
        }
    
    def transfer_nft(
        self,
        from_address: str,
        from_private_key: str,
        to_address: str,
        asset_id: int,
        opt_in_first: bool = True
    ) -> str:
        """
        Transfer NFT to another wallet
        
        Args:
            from_address: Sender wallet address
            from_private_key: Sender private key
            to_address: Recipient wallet address
            asset_id: NFT asset ID to transfer
            opt_in_first: Whether to opt-in recipient first
        
        Returns:
            Transaction ID
        """
        print(f"\n📤 Transferring NFT {asset_id}")
        print(f"From: {from_address}")
        print(f"To: {to_address}")
        
        params = self.algod_client.suggested_params()
        
        # Check if recipient needs to opt-in
        if opt_in_first:
            try:
                account_info = self.algod_client.account_info(to_address)
                assets = account_info.get('assets', [])
                opted_in = any(a.get('asset-id') == asset_id for a in assets)
                
                if not opted_in:
                    print("⚠️  Recipient must opt-in to receive this NFT first!")
                    print(f"They need to call: opt_in_to_asset({to_address}, {asset_id})")
                    return ""
            except Exception as e:
                print(f"Warning: Could not check opt-in status: {e}")
        
        # Create transfer transaction
        txn = transaction.AssetTransferTxn(
            sender=from_address,
            sp=params,
            receiver=to_address,
            amt=1,  # Transfer the 1 NFT
            index=asset_id
        )
        
        # Sign and send
        signed_txn = txn.sign(from_private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        print(f"Transfer transaction ID: {txid}")
        transaction.wait_for_confirmation(self.algod_client, txid, 4)
        
        print(f"✅ NFT transferred successfully!")
        return txid
    
    def opt_in_to_asset(
        self,
        address: str,
        private_key: str,
        asset_id: int
    ) -> str:
        """
        Opt-in to receive an NFT (required on Algorand)
        
        Args:
            address: Wallet address opting in
            private_key: Private key to sign
            asset_id: Asset ID to opt into
        
        Returns:
            Transaction ID
        """
        print(f"\n✅ Opting in to asset {asset_id}")
        
        params = self.algod_client.suggested_params()
        
        # Opt-in transaction (send 0 of asset to yourself)
        txn = transaction.AssetTransferTxn(
            sender=address,
            sp=params,
            receiver=address,
            amt=0,
            index=asset_id
        )
        
        signed_txn = txn.sign(private_key)
        txid = self.algod_client.send_transaction(signed_txn)
        
        print(f"Opt-in transaction ID: {txid}")
        transaction.wait_for_confirmation(self.algod_client, txid, 4)
        
        print(f"✅ Successfully opted in to asset {asset_id}")
        return txid
    
    def get_nft_info(self, asset_id: int) -> Dict:
        """Get NFT information from blockchain"""
        try:
            asset_info = self.algod_client.asset_info(asset_id)
            params = asset_info.get('params', {})
            
            return {
                "asset_id": asset_id,
                "name": params.get('name'),
                "unit_name": params.get('unit-name'),
                "total": params.get('total'),
                "decimals": params.get('decimals'),
                "url": params.get('url'),
                "creator": params.get('creator'),
                "manager": params.get('manager'),
            }
        except Exception as e:
            print(f"Error fetching NFT info: {e}")
            return {}
    
    def get_wallet_nfts(self, address: str) -> List[Dict]:
        """Get all NFTs owned by a wallet"""
        try:
            account_info = self.indexer_client.account_info(address)
            assets = account_info.get('account', {}).get('assets', [])
            
            nfts = []
            for asset in assets:
                asset_id = asset.get('asset-id')
                amount = asset.get('amount', 0)
                
                # NFTs have total=1, decimals=0, and amount>0
                if amount > 0:
                    info = self.get_nft_info(asset_id)
                    if info.get('total') == 1 and info.get('decimals') == 0:
                        nfts.append(info)
            
            return nfts
        except Exception as e:
            print(f"Error fetching wallet NFTs: {e}")
            return []
    
    def _update_env_file(self, asset_id: int):
        """Update .env file with new NFT_ASSET_ID"""
        env_path = '.env'
        
        if not os.path.exists(env_path):
            print("⚠️  .env file not found, creating one...")
            with open(env_path, 'w') as f:
                f.write(f"NFT_ASSET_ID={asset_id}\n")
            return
        
        # Read existing .env
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        # Update or add NFT_ASSET_ID
        updated = False
        for i, line in enumerate(lines):
            if line.startswith('NFT_ASSET_ID='):
                lines[i] = f'NFT_ASSET_ID={asset_id}\n'
                updated = True
                break
        
        if not updated:
            lines.append(f'NFT_ASSET_ID={asset_id}\n')
        
        # Write back
        with open(env_path, 'w') as f:
            f.writelines(lines)
        
        print(f"✅ Updated .env with NFT_ASSET_ID={asset_id}")


def main():
    """Interactive CLI for NFT management"""
    manager = NFTManager()
    
    print("=" * 60)
    print("NFT Manager - Capability-Based Access Control")
    print("=" * 60)
    
    print("\n1. Mint new NFT")
    print("2. Transfer NFT")
    print("3. View wallet NFTs")
    print("4. Get NFT info")
    print("5. Opt-in to NFT")
    
    choice = input("\nSelect option (1-5): ").strip()
    
    if choice == "1":
        # Mint NFT
        print("\n--- Mint New NFT ---")
        use_existing = input("Use existing wallet? (y/n): ").lower() == 'y'
        
        if use_existing:
            mnemonic_phrase = input("Enter 25-word mnemonic: ").strip()
            private_key = mnemonic.to_private_key(mnemonic_phrase)
            address = account.address_from_private_key(private_key)
        else:
            print("\n⚠️  Generating new wallet...")
            private_key, address = account.generate_account()
            phrase = mnemonic.from_private_key(private_key)
            print(f"\n🔑 SAVE THIS MNEMONIC:")
            print(phrase)
            print(f"\nAddress: {address}")
            print(f"\nFund at: https://bank.testnet.algorand.network/")
            input("Press Enter after funding...")
        
        nft_name = input("NFT name (default: API Access Pass): ").strip() or "API Access Pass"
        unit_name = input("Unit name (default: APIKEY): ").strip() or "APIKEY"
        
        result = manager.mint_capability_nft(
            creator_address=address,
            creator_private_key=private_key,
            nft_name=nft_name,
            unit_name=unit_name
        )
        
        print(f"\n✅ Asset ID: {result['asset_id']}")
        print(f"Explorer: {result['explorer_url']}")
    
    elif choice == "2":
        # Transfer NFT
        print("\n--- Transfer NFT ---")
        from_mnemonic = input("From wallet mnemonic: ").strip()
        to_address = input("To address: ").strip()
        asset_id = int(input("Asset ID: ").strip())
        
        from_private_key = mnemonic.to_private_key(from_mnemonic)
        from_address = account.address_from_private_key(from_private_key)
        
        manager.transfer_nft(from_address, from_private_key, to_address, asset_id)
    
    elif choice == "3":
        # View wallet NFTs
        address = input("Wallet address: ").strip()
        nfts = manager.get_wallet_nfts(address)
        
        print(f"\n📦 NFTs in wallet {address}:")
        for nft in nfts:
            print(f"\n  Asset ID: {nft['asset_id']}")
            print(f"  Name: {nft['name']}")
            print(f"  Unit: {nft['unit_name']}")
            print(f"  Creator: {nft['creator']}")
    
    elif choice == "4":
        # Get NFT info
        asset_id = int(input("Asset ID: ").strip())
        info = manager.get_nft_info(asset_id)
        
        print(f"\n📋 NFT Info:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    
    elif choice == "5":
        # Opt-in to NFT
        mnemonic_phrase = input("Wallet mnemonic: ").strip()
        asset_id = int(input("Asset ID to opt-in: ").strip())
        
        private_key = mnemonic.to_private_key(mnemonic_phrase)
        address = account.address_from_private_key(private_key)
        
        manager.opt_in_to_asset(address, private_key, asset_id)
    
    else:
        print("Invalid option!")


if __name__ == "__main__":
    main()
