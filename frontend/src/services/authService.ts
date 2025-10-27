// authService.ts
// API service layer for NFT-based authentication with FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Challenge {
  message: string
  nonce: string
  timestamp: number
  address: string
  domain: string
}

export interface AuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserInfo {
  wallet_address: string
  nft_asset_id: number
  algo_balance: number
  token_issued_at: number
  token_expires_at: number
}

export interface ProtectedData {
  message: string
  wallet: string
  nft_asset_id: number
  data: {
    secret: string
    api_key: string
    premium_features: string[]
  }
}

/**
 * Request authentication challenge from backend
 */
export async function requestChallenge(address: string): Promise<Challenge> {
  const response = await fetch(`${API_BASE_URL}/auth/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to request challenge')
  }

  return response.json()
}

/**
 * Verify signed challenge and get JWT access token
 */
export async function verifySignature(
  address: string,
  signature: string,
  challenge: Challenge
): Promise<AuthToken> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
      signature,
      challenge,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Signature verification failed')
  }

  return response.json()
}

/**
 * Call protected API endpoint with JWT token
 */
export async function getProtectedData(token: string): Promise<ProtectedData> {
  const response = await fetch(`${API_BASE_URL}/api/protected`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch protected data')
  }

  return response.json()
}

/**
 * Get authenticated user information
 */
export async function getUserInfo(token: string): Promise<UserInfo> {
  const response = await fetch(`${API_BASE_URL}/api/user/info`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user info')
  }

  return response.json()
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<{ status: string; redis: string; nft_configured: boolean }> {
  const response = await fetch(`${API_BASE_URL}/health`)

  if (!response.ok) {
    throw new Error('Health check failed')
  }

  return response.json()
}
