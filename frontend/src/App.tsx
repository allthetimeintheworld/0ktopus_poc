// App.tsx
// Main application entry point
// Integrates QuickStartTemplate wallet system with NFT API authentication

import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'

// Algorand network configuration
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.4160.nodely.dev'
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || ''
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || ''
const ALGOD_NETWORK = import.meta.env.VITE_ALGOD_NETWORK || 'testnet'

// Configure supported wallets based on network
let supportedWallets: SupportedWallet[]

if (ALGOD_NETWORK === 'localnet') {
  // LocalNet: Use KMD wallet
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: ALGOD_SERVER,
        token: ALGOD_TOKEN,
        port: ALGOD_PORT,
      },
    },
  ]
} else {
  // TestNet/MainNet: Use Pera, Defly, Exodus
  supportedWallets = [
    { id: WalletId.PERA },
    { id: WalletId.DEFLY },
    { id: WalletId.EXODUS },
    // Add WalletConnect if needed:
    // { id: WalletId.WALLETCONNECT, options: { projectId: 'YOUR_PROJECT_ID' } }
  ]
}

export default function App() {
  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: ALGOD_NETWORK,
    networks: {
      [ALGOD_NETWORK]: {
        algod: {
          baseServer: ALGOD_SERVER,
          port: ALGOD_PORT || 443,
          token: ALGOD_TOKEN,
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <WalletProvider manager={walletManager}>
        <Home />
      </WalletProvider>
    </SnackbarProvider>
  )
}
