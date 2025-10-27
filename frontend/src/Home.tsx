// Home.tsx
// Main landing page with NFT API authentication demo

import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { BsWallet2, BsShieldCheck, BsStars } from 'react-icons/bs'
import { AiOutlineApi } from 'react-icons/ai'

// Import components from QuickStartTemplate
import ConnectWallet from './components/ConnectWallet'
import AuthFlow from './components/AuthFlow'
import MintNFT from './components/MintNFT'
import WalletConnected from './components/WalletConnected'

// Animated Logo Component
const AnimatedLogo: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-mark"
    >
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#5B3DD6" />
          <stop offset="50%" stopColor="#7A3AE6" />
          <stop offset="100%" stopColor="#9D4EDD" />
        </linearGradient>
        <linearGradient id="g2" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FF66A3" />
          <stop offset="50%" stopColor="#FF5A8A" />
          <stop offset="100%" stopColor="#FF4081" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Left (purple) circle with glow */}
      <circle 
        className="circle-left" 
        cx="28" 
        cy="40" 
        r="20" 
        fill="url(#g1)" 
        filter="url(#glow)" 
        opacity="0.9" 
      />

      {/* Right (pink) circle with glow */}
      <circle 
        className="circle-right" 
        cx="48" 
        cy="40" 
        r="20" 
        fill="url(#g2)" 
        filter="url(#glow)" 
        opacity="0.9" 
      />

      {/* Overlap blend effect */}
      <circle cx="38" cy="36" r="12" fill="#000" opacity="0.1" />
    </svg>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="feature-card p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/8 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(91,61,214,0.2)]">
      <div className="text-4xl mb-3 bg-gradient-to-br from-pink-400 to-purple-600 bg-clip-text text-transparent">
        {icon}
      </div>
      <div className="text-base font-semibold mb-2 text-white">{title}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
  )
}

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openAuthModal, setOpenAuthModal] = useState(false)
  const [openMintModal, setOpenMintModal] = useState(false)
  const [openWalletConnectedModal, setOpenWalletConnectedModal] = useState(false)
  const [mintedAssetId, setMintedAssetId] = useState<number | null>(null)

  const { activeAddress } = useWallet()

  // Watch for wallet connection and show setup flow
  const [previousAddress, setPreviousAddress] = useState<string | null>(null)
  
  useEffect(() => {
    if (activeAddress && activeAddress !== previousAddress) {
      // Wallet just connected
      setPreviousAddress(activeAddress)
      setOpenWalletModal(false)
      setOpenWalletConnectedModal(true)
    } else if (!activeAddress && previousAddress) {
      // Wallet disconnected
      setPreviousAddress(null)
    }
  }, [activeAddress, previousAddress])

  const handleNFTMinted = (assetId: number) => {
    setMintedAssetId(assetId)
    console.log('NFT minted with Asset ID:', assetId)
  }

  const handleSetupComplete = () => {
    // After setup, user can now authenticate
    setOpenAuthModal(true)
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 bg-gradient-radial" style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(91, 61, 214, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 102, 163, 0.15) 0%, transparent 50%)
        `,
        animation: 'backgroundPulse 8s ease-in-out infinite alternate'
      }}></div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="w-full bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <AnimatedLogo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  <span className="relative inline-block">
                    0
                    <span className="absolute left-1/2 top-1/2 w-[120%] h-[2px] bg-white/90 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] rounded"></span>
                  </span>
                  KTOPUS
                </h1>
                <p className="text-xs text-gray-400">Token-Gated API Revenue System</p>
              </div>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/40 text-sm font-semibold text-gray-100 transition-all duration-300 backdrop-blur-sm"
            onClick={() => setOpenWalletModal(true)}
          >
            <BsWallet2 className="text-lg text-cyan-400" />
            <span>{activeAddress ? 'Wallet Connected' : 'Connect Wallet'}</span>
          </button>
        </nav>

        {/* Hero Section */}
        <header className="text-center py-12 px-4">
          <div className="logo-card inline-flex flex-col items-center gap-6 px-10 py-8 rounded-3xl bg-gradient-to-br from-black/80 to-neutral-900/90 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_80px_rgba(91,61,214,0.1)] border border-white/10 backdrop-blur-3xl mb-8 animate-float">
            <div className="flex items-center gap-6">
              <AnimatedLogo size={80} />
              <div className="text-7xl font-bold text-white tracking-wider" style={{
                textShadow: '0 0 30px rgba(91, 61, 214, 0.3)'
              }}>
                <span className="relative inline-block">
                  0
                  <span className="absolute left-1/2 top-1/2 w-[120%] h-[3px] bg-gradient-to-r from-white to-white/80 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] rounded shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                </span>
                KTOPUS
              </div>
            </div>
            <div className="text-3xl font-semibold uppercase tracking-[8px] bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent animate-pulse">
              Interactive Demo
            </div>
          </div>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Revolutionary token-gated API revenue system powered by Algorand blockchain. 
            Transform your APIs into revenue streams with soulbound token authentication.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-10">
            <FeatureCard 
              icon="⚡" 
              title="60-90 Days Faster" 
              description="Accelerated payment processing"
            />
            <FeatureCard 
              icon="💰" 
              title="40-80% Revenue Boost" 
              description="Token-gated API monetization"
            />
            <FeatureCard 
              icon="🎯" 
              title="15-25% Royalties" 
              description="Passive income from NFT trades"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            {activeAddress ? (
              <div className="space-y-6">
                {/* Mint NFT Card */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(157,78,221,0.2)]">
                  <div className="flex items-center gap-4 mb-4">
                    <BsStars className="text-5xl text-purple-400" />
                    <div>
                      <h3 className="text-2xl font-semibold">Step 1: Mint Access NFT</h3>
                      <p className="text-sm text-gray-400">
                        Create your capability NFT on TestNet
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg transition-all duration-300 shadow-[0_8px_24px_rgba(255,102,163,0.3)] hover:shadow-[0_12px_32px_rgba(91,61,214,0.4)]"
                    onClick={() => setOpenMintModal(true)}
                  >
                    Mint Capability NFT
                  </button>

                  {mintedAssetId && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400">
                      ✅ NFT Minted! Asset ID: {mintedAssetId}
                      <br />
                      <a
                        href={`https://testnet.algoexplorer.io/asset/${mintedAssetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-green-300 transition"
                      >
                        View on Explorer
                      </a>
                    </div>
                  )}
                </div>

                {/* Authentication Card */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(103,232,249,0.2)]">
                  <div className="flex items-center gap-4 mb-4">
                    <BsShieldCheck className="text-5xl text-cyan-400" />
                    <div>
                      <h3 className="text-2xl font-semibold">Step 2: Authenticate</h3>
                      <p className="text-sm text-gray-400">
                        Prove NFT ownership to access protected APIs
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg transition-all duration-300 shadow-lg"
                    onClick={() => setOpenAuthModal(true)}
                  >
                    Authenticate & Access APIs
                  </button>
                </div>

                {/* Info Card */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <AiOutlineApi className="text-3xl text-teal-400" />
                    How It Works
                  </h3>

                  <ol className="space-y-4 text-sm text-gray-300">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        1
                      </span>
                      <span>
                        <strong className="text-white">Connect Wallet:</strong> Link your Pera Wallet (or other
                        supported wallets)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        2
                      </span>
                      <span>
                        <strong className="text-white">Request Challenge:</strong> Backend generates a unique random
                        nonce
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        3
                      </span>
                      <span>
                        <strong className="text-white">Sign Challenge:</strong> Prove ownership by signing with your
                        private key
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        4
                      </span>
                      <span>
                        <strong className="text-white">Verify NFT:</strong> Backend checks your wallet owns the
                        required NFT
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        5
                      </span>
                      <span>
                        <strong className="text-white">Get Token:</strong> Receive JWT access token (valid for 1 hour)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                        6
                      </span>
                      <span>
                        <strong className="text-white">Access APIs:</strong> Call protected endpoints with your token
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Security Features */}
                <div className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-2xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold mb-4 text-green-400">🔒 Security Features</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>✅ Ed25519 cryptographic signatures</li>
                    <li>✅ Replay attack prevention with unique nonces</li>
                    <li>✅ Challenge expiry (5 minutes)</li>
                    <li>✅ On-chain NFT ownership verification</li>
                    <li>✅ No API keys stored in database</li>
                    <li>✅ Private keys never leave your wallet</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <BsWallet2 className="mx-auto text-6xl text-gray-500 mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Connect Your Wallet</h3>
                <p className="text-gray-400 mb-8">Connect your wallet first to start the authentication flow</p>
                <button
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold transition-all duration-300 shadow-lg"
                  onClick={() => setOpenWalletModal(true)}
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-gradient-to-b from-black/90 to-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-6 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-3 mb-3">
            <AnimatedLogo size={24} />
            <span className="font-bold text-white text-lg tracking-wide">
              <span className="relative inline-block">
                0
                <span className="absolute left-1/2 top-1/2 w-[120%] h-[1.5px] bg-white/90 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] rounded"></span>
              </span>
              KTOPUS
            </span>
          </div>
          <p className="text-gray-500">
            Built with ❤️ using Algorand • FastAPI • React • TypeScript
          </p>
        </footer>
      </div>

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <WalletConnected 
        openModal={openWalletConnectedModal} 
        setModalState={setOpenWalletConnectedModal}
        onNFTMinted={handleNFTMinted}
        onAuthenticated={handleSetupComplete}
      />
      <MintNFT openModal={openMintModal} setModalState={setOpenMintModal} onMinted={handleNFTMinted} />
      <AuthFlow openModal={openAuthModal} setModalState={setOpenAuthModal} />
    </div>
  )
}

export default Home
