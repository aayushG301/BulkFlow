import { api } from '@/services/api'

export const exportApi = {
  create: (jobId) => api.post(`/exports/jobs/${jobId}`, { format: 'csv' }),

  listByJob: (jobId) => api.get(`/exports/jobs/${jobId}`),

  getById: (exportId) => api.get(`/exports/${exportId}`),

  // The download route requires a Bearer token, so a plain <a href>
  // can't be used - fetch the file as a blob (auth header attached by
  // the shared api instance) and hand the browser a local object URL.
  download: async (exportId, fileName = 'export.csv') => {
    const response = await api.get(`/exports/${exportId}/download`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
