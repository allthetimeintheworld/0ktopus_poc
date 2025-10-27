// useAuth.ts
// Custom hook for managing authentication state and JWT tokens

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { requestChallenge, verifySignature, type Challenge, type AuthToken } from '../services/authService'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  tokenExpiry: number | null
  isLoading: boolean
  error: string | null
}

const TOKEN_STORAGE_KEY = 'nft_api_access_token'
const TOKEN_EXPIRY_KEY = 'nft_api_token_expiry'

export function useAuth() {
  const { activeAddress, signData } = useWallet()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    tokenExpiry: null,
    isLoading: false,
    error: null,
  })

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10)
      const now = Math.floor(Date.now() / 1000)

      if (expiry > now) {
        setAuthState({
          isAuthenticated: true,
          token: storedToken,
          tokenExpiry: expiry,
          isLoading: false,
          error: null,
        })
      } else {
        // Token expired, clear storage
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
      }
    }
  }, [])

  // Clear auth state when wallet disconnects
  useEffect(() => {
    if (!activeAddress) {
      logout()
    }
  }, [activeAddress])

  /**
   * Authenticate user with challenge-response protocol
   */
  const authenticate = useCallback(async () => {
    if (!activeAddress) {
      setAuthState((prev) => ({
        ...prev,
        error: 'No wallet connected',
        isLoading: false,
      }))
      return false
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Step 1: Request challenge from backend
      console.log('📝 Requesting challenge for:', activeAddress)
      const challenge: Challenge = await requestChallenge(activeAddress)

      // Step 2: Sign challenge with wallet
      console.log('✍️ Signing challenge...')
      const message = new TextEncoder().encode(JSON.stringify(challenge))

      const signedData = await signData(
        [
          {
            data: Array.from(message),
            message: 'Prove wallet ownership for NFT API access',
          },
        ],
        activeAddress
      )

      if (!signedData || signedData.length === 0) {
        throw new Error('Signature cancelled or failed')
      }

      // Convert signature to base64
      const signatureBase64 = btoa(String.fromCharCode(...signedData[0]))

      // Step 3: Verify signature and get JWT token
      console.log('🔍 Verifying signature and NFT ownership...')
      const authResult: AuthToken = await verifySignature(activeAddress, signatureBase64, challenge)

      // Calculate token expiry timestamp
      const expiry = Math.floor(Date.now() / 1000) + authResult.expires_in

      // Store token in localStorage
      localStorage.setItem(TOKEN_STORAGE_KEY, authResult.access_token)
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString())

      setAuthState({
        isAuthenticated: true,
        token: authResult.access_token,
        tokenExpiry: expiry,
        isLoading: false,
        error: null,
      })

      console.log('✅ Authentication successful!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      console.error('❌ Authentication error:', errorMessage)

      setAuthState({
        isAuthenticated: false,
        token: null,
        tokenExpiry: null,
        isLoading: false,
        error: errorMessage,
      })

      return false
    }
  }, [activeAddress, signData])

  /**
   * Logout and clear authentication state
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    setAuthState({
      isAuthenticated: false,
      token: null,
      tokenExpiry: null,
      isLoading: false,
      error: null,
    })
    console.log('🔓 Logged out')
  }, [])

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback(() => {
    if (!authState.tokenExpiry) return true
    const now = Math.floor(Date.now() / 1000)
    return authState.tokenExpiry <= now
  }, [authState.tokenExpiry])

  /**
   * Get time until token expires (in seconds)
   */
  const timeUntilExpiry = useCallback(() => {
    if (!authState.tokenExpiry) return 0
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, authState.tokenExpiry - now)
  }, [authState.tokenExpiry])

  return {
    ...authState,
    authenticate,
    logout,
    isTokenExpired,
    timeUntilExpiry,
  }
}
