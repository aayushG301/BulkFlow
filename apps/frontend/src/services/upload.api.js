import { api } from '@/services/api'

export const uploadApi = {
  create: ({ file, enrichmentEnabled, enrichmentProvider, onUploadProgress }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('enrichmentEnabled', String(enrichmentEnabled))
    if (enrichmentEnabled && enrichmentProvider) {
      formData.append('enrichmentProvider', enrichmentProvider)
    }

    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  },

  list: ({ page = 1, limit = 10, status } = {}) =>
    api.get('/uploads', { params: { page, limit, status: status || undefined } }),

  getById: (uploadId) => api.get(`/uploads/${uploadId}`),

  cancel: (uploadId) => api.patch(`/uploads/${uploadId}/cancel`),

  retry: (uploadId) => api.patch(`/uploads/${uploadId}/retry`),

  remove: (uploadId) => api.delete(`/uploads/${uploadId}`),
}
