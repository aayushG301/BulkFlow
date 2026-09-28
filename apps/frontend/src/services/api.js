import axios from 'axios'

import { storage } from '@/utils/storage'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({ baseURL })

// A plain axios instance (no interceptors) for the refresh call itself,
// so a failed refresh never recurses back into the interceptor below.
const refreshClient = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = storage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null
let onSessionExpired = () => {}

// The backend uses 401 for two different things: the auth middleware
// rejecting a bad/expired token, and ordinary business errors (e.g.
// "Current password is incorrect"). Only the first should trigger a
// token refresh - treating the second as an expired session would log
// the user out for typing a wrong password.
const TOKEN_ERROR_PATTERN =
  /^(authentication required|invalid authentication|authentication token|user account not found)/i

const isTokenError = (response) => TOKEN_ERROR_PATTERN.test(response?.data?.message || '')

// Called once from AuthContext so this module can trigger a logout
// without importing React context logic into a plain service file.
export const registerSessionExpiredHandler = (handler) => {
  onSessionExpired = handler
}

const refreshAccessToken = async () => {
  const refreshToken = storage.getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  const response = await refreshClient.post('/auth/refresh-token', { refreshToken })
  const accessToken = response.data?.data?.accessToken

  if (!accessToken) throw new Error('Refresh response did not include an access token')

  storage.setAccessToken(accessToken)
  return accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    const isAuthEndpoint = config?.url?.startsWith('/auth/')

    if (response?.status !== 401 || isAuthEndpoint || config?._retry || !isTokenError(response)) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      // Several requests can 401 at once (e.g. a burst of polling) -
      // only one refresh call should ever be in flight.
      refreshPromise = refreshPromise || refreshAccessToken()
      const accessToken = await refreshPromise
      refreshPromise = null

      config.headers.Authorization = `Bearer ${accessToken}`
      return api(config)
    } catch (refreshError) {
      refreshPromise = null
      storage.clearTokens()
      onSessionExpired()
      return Promise.reject(refreshError)
    }
  },
)
