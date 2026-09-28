import { api } from '@/services/api'

export const jobApi = {
  create: ({ uploadId, name, processingOptions }) =>
    api.post('/jobs', { uploadId, name, processingOptions }),

  list: ({ page = 1, pageSize = 25, status } = {}) =>
    api.get('/jobs', { params: { page, pageSize, status: status || undefined } }),

  getById: (jobId) => api.get(`/jobs/${jobId}`),

  update: (jobId, payload) => api.patch(`/jobs/${jobId}`, payload),

  cancel: (jobId) => api.patch(`/jobs/${jobId}/cancel`),

  retry: (jobId) => api.post(`/jobs/${jobId}/retry`),

  remove: (jobId) => api.delete(`/jobs/${jobId}`),
}
