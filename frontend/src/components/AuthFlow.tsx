// AuthFlow.tsx
// NFT-based authentication component with challenge-response protocol
// Integrates with QuickStartTemplate's wallet system

import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import React, { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineLock, AiOutlineUnlock, AiOutlineClockCircle } from 'react-icons/ai'
import { BsShieldCheck, BsKey } from 'react-icons/bs'
import { useAuth } from '../hooks/useAuth'
import { getProtectedData, getUserInfo, type ProtectedData, type UserInfo } from '../services/authService'

interface AuthFlowProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const AuthFlow = ({ openModal, setModalState }: AuthFlowProps) => {
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const { isAuthenticated, token, isLoading, error, authenticate, logout, timeUntilExpiry } = useAuth()

  const [protectedData, setProtectedData] = useState<ProtectedData | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Update countdown timer
  useEffect(() => {
    if (isAuthenticated) {
      setTimeLeft(timeUntilExpiry())
      const interval = setInterval(() => {
        const remaining = timeUntilExpiry()
        setTimeLeft(remaining)
        if (remaining === 0) {
          enqueueSnackbar('Session expired. Please authenticate again.', { variant: 'warning' })
          logout()
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, timeUntilExpiry, logout, enqueueSnackbar])

  // Handle authentication
  const handleAuthenticate = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      return
    }

    const success = await authenticate()

    if (success) {
      enqueueSnackbar('🎉 Authentication successful! You now have API access.', { variant: 'success' })
    } else if (error) {
      enqueueSnackbar(`Authentication failed: ${error}`, { variant: 'error' })
    }
  }

  // Fetch protected data
  const handleFetchProtectedData = async () => {
    if (!token) return

    setIsFetching(true)
    try {
      const data = await getProtectedData(token)
      setProtectedData(data)
      enqueueSnackbar('✅ Protected data retrieved successfully', { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch data'
      enqueueSnackbar(`Error: ${message}`, { variant: 'error' })

      if (message.includes('expired') || message.includes('Invalid token')) {
        logout()
      }
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch user info
  const handleFetchUserInfo = async () => {
    if (!token) return

    setIsFetching(true)
    try {
      const data = await getUserInfo(token)
      setUserInfo(data)
      enqueueSnackbar('✅ User info retrieved successfully', { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user info'
      enqueueSnackbar(`Error: ${message}`, { variant: 'error' })

      if (message.includes('expired') || message.includes('Invalid token')) {
        logout()
      }
    } finally {
      setIsFetching(false)
    }
  }

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <dialog
      id="auth_flow_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-neutral-800 text-gray-100 rounded-2xl shadow-xl border border-neutral-700 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <BsShieldCheck className="text-xl text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
              0KTOPUS Access Control
            </h3>
            <p className="text-xs text-gray-400">NFT-based authentication</p>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="mb-6 p-4 bg-neutral-700 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Wallet Status</span>
            {activeAddress ? (
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Connected</span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Not Connected</span>
            )}
          </div>
          {activeAddress && (
            <div className="text-xs font-mono text-gray-300 break-all">{activeAddress}</div>
          )}
        </div>

        {/* Authentication Section */}
        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-700 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <AiOutlineLock className="text-2xl text-amber-400" />
                <div>
                  <h4 className="font-semibold">Not Authenticated</h4>
                  <p className="text-xs text-gray-400">Sign a challenge to verify NFT ownership</p>
                </div>
              </div>

              <button
                onClick={handleAuthenticate}
                disabled={!activeAddress || isLoading}
                className={`
                  w-full py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95
                  ${
                    activeAddress && !isLoading
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'bg-neutral-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <BsKey />
                    Authenticate with NFT
                  </span>
                )}
              </button>

              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="p-4 bg-neutral-700/50 rounded-xl text-sm">
              <h5 className="font-semibold mb-2">How it works:</h5>
              <ol className="space-y-1 text-gray-400 text-xs list-decimal list-inside">
                <li>Backend generates a unique challenge</li>
                <li>You sign the challenge with your wallet</li>
                <li>Backend verifies your signature and NFT ownership</li>
                <li>You receive a JWT access token (valid for 1 hour)</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Authenticated Status */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <AiOutlineUnlock className="text-2xl text-green-400" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-400">Authenticated</h4>
                  <p className="text-xs text-gray-400">You have access to protected APIs</p>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
                >
                  Logout
                </button>
              </div>

              {/* Token expiry */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <AiOutlineClockCircle />
                <span>Session expires in: {formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* API Actions */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-300">Protected API Endpoints:</h5>

              <button
                onClick={handleFetchProtectedData}
                disabled={isFetching}
                className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <span className="flex items-center justify-center gap-2">
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'GET /api/protected'
                )}
              </button>

              <button
                onClick={handleFetchUserInfo}
                disabled={isFetching}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <span className="flex items-center justify-center gap-2">
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'GET /api/user/info'
                )}
              </button>
            </div>

            {/* Response Data */}
            {protectedData && (
              <div className="p-4 bg-neutral-900 rounded-xl">
                <h6 className="text-xs font-semibold text-gray-400 mb-2">Protected Data Response:</h6>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(protectedData, null, 2)}
                </pre>
              </div>
            )}

            {userInfo && (
              <div className="p-4 bg-neutral-900 rounded-xl">
                <h6 className="text-xs font-semibold text-gray-400 mb-2">User Info Response:</h6>
                <pre className="text-xs text-gray-300 overflow-x-auto">{JSON.stringify(userInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-action mt-6">
          <button
            className="btn w-full sm:w-auto bg-neutral-700 hover:bg-neutral-600 border-none text-gray-300 rounded-xl"
            onClick={() => setModalState(false)}
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default AuthFlow
