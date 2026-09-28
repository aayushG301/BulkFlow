const ACCESS_TOKEN_KEY = 'bulkflow.accessToken'
const REFRESH_TOKEN_KEY = 'bulkflow.refreshToken'

const safeGet = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage may be unavailable (private browsing, quota) - the app
    // still works for the current tab session via in-memory state.
  }
}

const safeRemove = (key) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

export const storage = {
  getAccessToken: () => safeGet(ACCESS_TOKEN_KEY),
  getRefreshToken: () => safeGet(REFRESH_TOKEN_KEY),

  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) safeSet(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) safeSet(REFRESH_TOKEN_KEY, refreshToken)
  },

  setAccessToken: (accessToken) => safeSet(ACCESS_TOKEN_KEY, accessToken),

  clearTokens: () => {
    safeRemove(ACCESS_TOKEN_KEY)
    safeRemove(REFRESH_TOKEN_KEY)
  },
}
