import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Zap } from 'lucide-react'

import { useUploads } from '@/hooks/useUploads'
import { useToast } from '@/context/ToastContext'
import { FileDropzone } from '@/components/uploads/FileDropzone'
import { FilePreview } from '@/components/uploads/FilePreview'
import { ProcessingOptions } from '@/components/uploads/ProcessingOptions'
import { UploadReview } from '@/components/uploads/UploadReview'
import { UploadProgress } from '@/components/uploads/UploadProgress'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { jobDetailsPath, ROUTES } from '@/constants/routes'

export function NewUpload() {
  const { setPageHeader } = useOutletContext()
  const { uploadAndCreateJob, uploadProgress, isUploading, isCreatingJob } = useUploads()
  const toast = useToast()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [jobName, setJobName] = useState('')
  const [enrichmentEnabled, setEnrichmentEnabled] = useState(false)
  const [enrichmentProvider, setEnrichmentProvider] = useState('gemini')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setPageHeader({
      breadcrumb: [{ label: 'New Upload' }],
    })
  }, [setPageHeader])

  const handleFileAccepted = (selectedFile) => {
    setFile(selectedFile)
    if (!jobName) setJobName(selectedFile.name.replace(/\.[^.]+$/, ''))
  }

  const isSubmitting = isUploading || isCreatingJob

  const handleSubmit = async () => {
    const validationErrors = {}
    if (!jobName.trim()) validationErrors.name = 'Give this job a name'
    if (enrichmentEnabled && !enrichmentProvider) {
      validationErrors.enrichmentProvider = 'Choose a provider'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      const job = await uploadAndCreateJob({
        file,
        name: jobName.trim(),
        enrichmentEnabled,
        enrichmentProvider: enrichmentEnabled ? enrichmentProvider : undefined,
      })
      toast.success('Upload received - ingestion has started.')
      navigate(jobDetailsPath(job._id))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start this job.'))
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New Upload</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Upload a CSV or XLSX file to queue a new ingestion job.
        </p>
      </div>

      {!file ? (
        <FileDropzone onFileAccepted={handleFileAccepted} disabled={isSubmitting} />
      ) : (
        <div className="flex flex-col gap-5">
          <FilePreview file={file} onRemove={() => setFile(null)} disabled={isSubmitting} />

          <ProcessingOptions
            jobName={jobName}
            onJobNameChange={setJobName}
            enrichmentEnabled={enrichmentEnabled}
            onEnrichmentEnabledChange={setEnrichmentEnabled}
            enrichmentProvider={enrichmentProvider}
            onEnrichmentProviderChange={setEnrichmentProvider}
            errors={errors}
          />

          <UploadReview
            file={file}
            jobName={jobName.trim() || file.name}
            enrichmentEnabled={enrichmentEnabled}
            enrichmentProvider={enrichmentProvider}
          />

          {isSubmitting && <UploadProgress progress={isUploading ? uploadProgress : 100} />}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(ROUTES.DASHBOARD)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Zap}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Start processing
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
