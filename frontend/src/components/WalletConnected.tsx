// WalletConnected.tsx
// Post-connection flow with nonce challenge and NFT creation

import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineCheckCircle } from 'react-icons/ai'
import { BsShieldCheck, BsStars, BsKey } from 'react-icons/bs'
import { FaRocket } from 'react-icons/fa'
import algosdk from 'algosdk'

interface WalletConnectedProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  onNFTMinted?: (assetId: number) => void
  onAuthenticated?: () => void
}

type FlowStep = 'challenge' | 'mint' | 'complete'

const WalletConnected = ({ openModal, setModalState, onNFTMinted, onAuthenticated }: WalletConnectedProps) => {
  const { activeAddress, signTransactions } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('challenge')
  const [isLoading, setIsLoading] = useState(false)
  const [challenge, setChallenge] = useState<string | null>(null)
  const [challengeSigned, setChallengeSigned] = useState(false)
  const [nftAssetId, setNftAssetId] = useState<number | null>(null)
  const [nftName, setNftName] = useState('0KTOPUS Access Pass')
  const [unitName, setUnitName] = useState('0KPASS')

  // Request challenge when modal opens
  useEffect(() => {
    if (openModal && activeAddress && !challenge) {
      requestChallenge()
    }
  }, [openModal, activeAddress])

  const requestChallenge = async () => {
    if (!activeAddress) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: activeAddress }),
      })

      if (!response.ok) {
        throw new Error('Failed to get challenge')
      }

      const data = await response.json()
      setChallenge(data.challenge)
      enqueueSnackbar('✅ Challenge received! Please sign to verify wallet ownership.', { variant: 'success' })
    } catch (error) {
      console.error('Challenge error:', error)
      enqueueSnackbar('Failed to get challenge. Please try again.', { variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignChallenge = async () => {
    if (!challenge || !activeAddress) return

    setIsLoading(true)
    try {
      // Sign the challenge with wallet
      enqueueSnackbar('Please sign the challenge in your wallet...', { variant: 'info' })
      
      const encoder = new TextEncoder()
      const messageBytes = encoder.encode(challenge)
      
      // For Pera Wallet, we need to create a transaction to sign
      // We'll use the signTransactions method
      await signTransactions([messageBytes])
      
      enqueueSnackbar('✅ Challenge signed successfully!', { variant: 'success' })
      setChallengeSigned(true)
      setCurrentStep('mint')
    } catch (error) {
      console.error('Signing error:', error)
      enqueueSnackbar('Failed to sign challenge. Please try again.', { variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintNFT = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Wallet address not found. Please reconnect your wallet.', { variant: 'error' })
      return
    }

    setIsLoading(true)
    try {
      // Connect to Algorand TestNet
      const algodUrl = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
      const algodToken = import.meta.env.VITE_ALGOD_TOKEN || ''
      
      console.log('Algorand connection:', { algodUrl, activeAddress })
      
      // Important: Use empty string for port, not '443'
      const algodClient = new algosdk.Algodv2(algodToken, algodUrl, '')

      // Get suggested params
      console.log('Fetching transaction params...')
      const params = await algodClient.getTransactionParams().do()
      console.log('Transaction params received:', params)

      // Create NFT metadata
      const metadata = {
        name: nftName,
        unit_name: unitName,
        capabilities: ['api_access'],
        created_at: Date.now(),
        wallet: activeAddress,
      }
      const note = new TextEncoder().encode(JSON.stringify(metadata))

      console.log('Creating transaction with:', {
        sender: activeAddress,
        assetName: nftName.slice(0, 32),
        unitName: unitName.slice(0, 8),
        total: 1,
        decimals: 0,
      })

      // Create Asset Configuration Transaction
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        total: BigInt(1),
        decimals: 0,
        assetName: nftName.slice(0, 32),
        unitName: unitName.slice(0, 8),
        assetURL: 'https://0ktopus.io/nft-metadata.json',
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        defaultFrozen: false,
        note: note,
        suggestedParams: params,
      })

      console.log('Transaction created successfully')

      // Encode transaction for wallet signing
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn)
      console.log('Transaction encoded, requesting signature...')

      // Sign with wallet
      enqueueSnackbar('Please approve the NFT minting in your wallet...', { variant: 'info' })
      const signedTxns = await signTransactions([encodedTxn])

      if (!signedTxns || !signedTxns[0]) {
        throw new Error('Transaction signing failed or was cancelled')
      }

      console.log('Transaction signed successfully')

      // Send transaction
      const response = await algodClient.sendRawTransaction(signedTxns[0]).do()
      const txId = response.txid
      console.log('Transaction sent:', txId)
      enqueueSnackbar(`Transaction sent! Waiting for confirmation...`, { variant: 'info' })

      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)
      console.log('Transaction confirmed:', confirmedTxn)
      
      const assetId = confirmedTxn.assetIndex ? Number(confirmedTxn.assetIndex) : null

      if (!assetId) {
        throw new Error('Asset ID not found in transaction confirmation')
      }

      setNftAssetId(assetId)
      enqueueSnackbar(`🎉 NFT minted successfully! Asset ID: ${assetId}`, { variant: 'success' })

      if (onNFTMinted) {
        onNFTMinted(assetId)
      }

      setCurrentStep('complete')
    } catch (error) {
      console.error('Full minting error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      const message = error instanceof Error ? error.message : 'Failed to mint NFT'
      enqueueSnackbar(`Error: ${message}`, { variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    if (onAuthenticated) {
      onAuthenticated()
    }
    setModalState(false)
    // Reset state for next time
    setTimeout(() => {
      setCurrentStep('challenge')
      setChallenge(null)
      setChallengeSigned(false)
      setNftAssetId(null)
    }, 500)
  }

  return (
    <dialog
      id="wallet_connected_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-gradient-to-br from-black/95 to-neutral-900/95 text-gray-100 rounded-3xl shadow-2xl border border-white/20 p-8 max-w-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center animate-pulse">
            <FaRocket className="text-2xl text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white">
              <span className="relative inline-block">
                0
                <span className="absolute left-1/2 top-1/2 w-[120%] h-[2px] bg-white/90 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] rounded"></span>
              </span>
              KTOPUS Setup
            </h3>
            <p className="text-sm text-gray-400">Complete your onboarding in 3 steps</p>
          </div>
        </div>

        {/* Connected Wallet Info */}
        <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-300">Connected Wallet</span>
            <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-semibold">
              ✓ Active
            </span>
          </div>
          <div className="text-sm font-mono text-white break-all bg-black/30 px-3 py-2 rounded-lg">
            {activeAddress}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between relative">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-white/10 -z-10"></div>
          
          {/* Step 1: Challenge */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              currentStep === 'challenge' 
                ? 'bg-gradient-to-br from-cyan-500 to-teal-500 border-cyan-400 text-white scale-110' 
                : challengeSigned 
                ? 'bg-green-500 border-green-400 text-white' 
                : 'bg-white/5 border-white/20 text-gray-400'
            }`}>
              {challengeSigned ? '✓' : '1'}
            </div>
            <span className="text-xs font-semibold text-gray-300">Verify</span>
          </div>

          {/* Step 2: Mint */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              currentStep === 'mint' 
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 text-white scale-110' 
                : nftAssetId 
                ? 'bg-green-500 border-green-400 text-white' 
                : 'bg-white/5 border-white/20 text-gray-400'
            }`}>
              {nftAssetId ? '✓' : '2'}
            </div>
            <span className="text-xs font-semibold text-gray-300">Mint NFT</span>
          </div>

          {/* Step 3: Complete */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              currentStep === 'complete' 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-green-400 text-white scale-110' 
                : 'bg-white/5 border-white/20 text-gray-400'
            }`}>
              {currentStep === 'complete' ? '✓' : '3'}
            </div>
            <span className="text-xs font-semibold text-gray-300">Ready</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {/* Step 1: Nonce Challenge */}
          {currentStep === 'challenge' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-start gap-4 p-5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                <BsShieldCheck className="text-3xl text-cyan-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">Step 1: Sign Challenge</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    To verify you own this wallet, we need you to sign a unique challenge message. 
                    This proves ownership without revealing your private key.
                  </p>
                  {challenge && (
                    <div className="mb-4 p-3 bg-black/40 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Challenge Nonce:</p>
                      <p className="text-xs font-mono text-cyan-300 break-all">{challenge}</p>
                    </div>
                  )}
                  <button
                    onClick={handleSignChallenge}
                    disabled={!challenge || isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <AiOutlineLoading3Quarters className="animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <BsKey />
                        <span>Sign Challenge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Mint NFT */}
          {currentStep === 'mint' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-start gap-4 p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                <BsStars className="text-3xl text-purple-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-2">Step 2: Mint Access NFT</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    Create your unique capability NFT on Algorand TestNet. This NFT serves as your 
                    access token for protected APIs.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">NFT Name</label>
                      <input
                        type="text"
                        value={nftName}
                        onChange={(e) => setNftName(e.target.value)}
                        maxLength={32}
                        className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Unit Name</label>
                      <input
                        type="text"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleMintNFT}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <AiOutlineLoading3Quarters className="animate-spin" />
                        <span>Minting...</span>
                      </>
                    ) : (
                      <>
                        <BsStars />
                        <span>Mint NFT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col items-center justify-center p-8 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
                <AiOutlineCheckCircle className="text-6xl text-green-400 mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">🎉 All Set!</h4>
                <p className="text-gray-300 mb-6 max-w-md">
                  Your wallet is verified and your NFT has been minted successfully. 
                  You're now ready to access protected APIs!
                </p>
                
                {nftAssetId && (
                  <div className="mb-6 p-4 bg-black/40 rounded-xl w-full">
                    <p className="text-sm text-gray-400 mb-2">NFT Asset ID:</p>
                    <p className="text-lg font-bold text-green-400 mb-3">{nftAssetId}</p>
                    <a
                      href={`https://testnet.algoexplorer.io/asset/${nftAssetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      View on AlgoExplorer →
                    </a>
                  </div>
                )}

                <button
                  onClick={handleComplete}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold transition-all"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setModalState(false)}
            className="text-sm text-gray-400 hover:text-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default WalletConnected
