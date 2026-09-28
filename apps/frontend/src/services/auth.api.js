import { api } from '@/services/api'

export const authApi = {
  register: ({ name, email, password }) => api.post('/users', { name, email, password }),

  login: ({ email, password }) => api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: ({ token, newPassword }) =>
    api.post('/auth/reset-password', { token, newPassword }),

  verifyEmail: (token) => api.post('/auth/verify-email', { token }),

  resendVerificationEmail: (email) => api.post('/auth/resend-verification-email', { email }),

  getMe: () => api.get('/users/me'),

  updateMe: (payload) => api.patch('/users/me', payload),

  changePassword: ({ currentPassword, newPassword }) =>
    api.patch('/users/me/password', { currentPassword, newPassword }),

  deleteMe: () => api.delete('/users/me'),
}
