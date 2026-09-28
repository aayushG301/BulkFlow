// The backend's error middleware always responds with
// { success: false, message, errors?: [{ field, message }] }. This pulls
// a single readable string out of that shape (or out of a network-level
// failure) so components never have to know the response format.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback

  const data = error.response?.data

  if (data?.errors?.length) {
    return data.errors.map((issue) => issue.message).join(' ')
  }

  if (data?.message) {
    return data.message
  }

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Could not reach the server. Check your connection and try again.'
  }

  if (error.message) {
    return error.message
  }

  return fallback
}

// Field-level validation errors, keyed by field name, for surfacing
// inline under form inputs.
export const getFieldErrors = (error) => {
  const issues = error?.response?.data?.errors
  if (!Array.isArray(issues)) return {}

  return issues.reduce((acc, issue) => {
    if (issue.field) acc[issue.field] = issue.message
    return acc
  }, {})
}
