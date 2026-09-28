import { api } from '@/services/api'

export const resultApi = {
  listByJob: (jobId, { page = 1, pageSize = 25, status } = {}) =>
    api.get(`/results/jobs/${jobId}`, { params: { page, pageSize, status: status || undefined } }),

  listFailedByJob: (jobId, { page = 1, pageSize = 25 } = {}) =>
    api.get(`/results/jobs/${jobId}/failed`, { params: { page, pageSize } }),

  statsByJob: (jobId) => api.get(`/results/jobs/${jobId}/stats`),

  getById: (resultId) => api.get(`/results/${resultId}`),
}
