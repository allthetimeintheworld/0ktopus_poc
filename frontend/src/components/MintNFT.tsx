// MintNFT.tsx
// Component for minting NFT capabilities directly from the frontend

import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { BsStars } from 'react-icons/bs'
import algosdk from 'algosdk'

interface MintNFTProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  onMinted?: (assetId: number) => void
}

const MintNFT = ({ openModal, setModalState, onMinted }: MintNFTProps) => {
  const { activeAddress, signTransactions } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [isMinting, setIsMinting] = useState(false)
  const [nftName, setNftName] = useState('API Access Pass')
  const [unitName, setUnitName] = useState('APIKEY')

  const handleMint = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    setIsMinting(true)

    try {
      // Connect to Algorand TestNet
      const algodUrl = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
      const algodToken = import.meta.env.VITE_ALGOD_TOKEN || ''
      const algodClient = new algosdk.Algodv2(algodToken, algodUrl, '')

      // Get suggested params
      const params = await algodClient.getTransactionParams().do()

      // Create NFT metadata
      const metadata = {
        name: nftName,
        unit_name: unitName,
        capabilities: ['api_access'],
        created_at: Date.now(),
      }
      const note = new TextEncoder().encode(JSON.stringify(metadata))

      // Create Asset Configuration Transaction
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        total: BigInt(1),
        decimals: 0,
        assetName: nftName.slice(0, 32),
        unitName: unitName.slice(0, 8),
        assetURL: 'https://api.example.com/nft-metadata.json',
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        defaultFrozen: false,
        note: note,
        suggestedParams: params,
      })

      // Encode transaction for wallet signing
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

      // Sign with Pera Wallet
      enqueueSnackbar('Please approve the transaction in your wallet...', { variant: 'info' })
      const signedTxns = await signTransactions([encodedTxn])

      if (!signedTxns || !signedTxns[0]) {
        throw new Error('Transaction signing failed or was cancelled')
      }

      // Send transaction
      const response = await algodClient.sendRawTransaction(signedTxns[0]).do()
      const txId = response.txid

      enqueueSnackbar(`Transaction sent! ID: ${txId.slice(0, 10)}...`, { variant: 'info' })

      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)
      const assetId = confirmedTxn.assetIndex ? Number(confirmedTxn.assetIndex) : null

      if (!assetId) {
        throw new Error('Asset ID not found in transaction confirmation')
      }

      enqueueSnackbar(`🎉 NFT minted successfully! Asset ID: ${assetId}`, { variant: 'success' })

      console.log('NFT Details:', {
        assetId,
        txId,
        explorer: `https://testnet.algoexplorer.io/asset/${assetId}`,
      })

      // Call callback if provided
      if (onMinted) {
        onMinted(assetId)
      }

      // Close modal after success
      setTimeout(() => setModalState(false), 2000)
    } catch (error) {
      console.error('Minting error:', error)
      const message = error instanceof Error ? error.message : 'Failed to mint NFT'
      enqueueSnackbar(`Error: ${message}`, { variant: 'error' })
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <dialog
      id="mint_nft_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BsStars className="text-xl text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              0KTOPUS Capability Mint
            </h3>
            <p className="text-xs text-gray-400">Create your access token</p>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="mb-6 p-4 bg-neutral-700 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Connected Wallet</span>
            {activeAddress ? (
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Ready</span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Not Connected</span>
            )}
          </div>
          {activeAddress && (
            <div className="text-xs font-mono text-gray-300 break-all">{activeAddress}</div>
          )}
        </div>

        {/* NFT Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">NFT Name</label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="API Access Pass"
              maxLength={32}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 32 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Unit Name</label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value.toUpperCase())}
              placeholder="APIKEY"
              maxLength={8}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max 8 characters (ticker symbol)</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-400 mb-2">What happens next:</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Creates a unique NFT (total supply: 1)</li>
            <li>• Stored on Algorand blockchain</li>
            <li>• Grants API access capabilities</li>
            <li>• Cost: ~0.001 ALGO + network fee</li>
            <li>• Can be transferred or sold</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setModalState(false)}
            disabled={isMinting}
            className="flex-1 py-3 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-gray-300 font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMint}
            disabled={!activeAddress || isMinting}
            className={`
              flex-1 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95
              ${
                activeAddress && !isMinting
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : 'bg-neutral-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isMinting ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Minting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <BsStars />
                Mint NFT
              </span>
            )}
          </button>
        </div>

        {/* Warning */}
        {!activeAddress && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
            ⚠️ Please connect your wallet first
          </div>
        )}
      </div>
    </dialog>
  )
}

export default MintNFT
