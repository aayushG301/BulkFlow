import { useCallback, useState } from 'react'

import { uploadApi } from '@/services/upload.api'
import { jobApi } from '@/services/job.api'

export function useUploads() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingJob, setIsCreatingJob] = useState(false)

  const uploadFile = useCallback(async ({ file, enrichmentEnabled, enrichmentProvider }) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await uploadApi.create({
        file,
        enrichmentEnabled,
        enrichmentProvider,
        onUploadProgress: (event) => {
          if (!event.total) return
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        },
      })

      return response.data.data
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Uploads then immediately creates the job that kicks off ingestion -
  // this is the single action the "Start processing" button triggers.
  const uploadAndCreateJob = useCallback(
    async ({ file, name, enrichmentEnabled, enrichmentProvider }) => {
      const upload = await uploadFile({ file, enrichmentEnabled, enrichmentProvider })

      setIsCreatingJob(true)
      try {
        const jobResponse = await jobApi.create({
          uploadId: upload._id,
          name: name || file.name,
        })
        return jobResponse.data.data
      } finally {
        setIsCreatingJob(false)
      }
    },
    [uploadFile],
  )

  return {
    uploadFile,
    uploadAndCreateJob,
    uploadProgress,
    isUploading,
    isCreatingJob,
  }
}
