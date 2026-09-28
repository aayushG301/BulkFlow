const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (value) => EMAIL_RE.test(String(value || '').trim())

// Mirrors validateRegisterUser (name: min 3, password: min 8)
export const validateRegisterForm = ({ name, email, password }) => {
  const errors = {}

  if (!name || name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters'
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  return errors
}

export const validateLoginForm = ({ email, password }) => {
  const errors = {}

  if (!email || !isValidEmail(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return errors
}

export const validatePasswordChangeForm = ({ currentPassword, newPassword }) => {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required'
  }

  if (!newPassword || newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters'
  }

  return errors
}

export const hasErrors = (errors) => Object.keys(errors).length > 0
