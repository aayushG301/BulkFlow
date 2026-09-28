import { useCallback, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import clsx from 'clsx'

import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/constants/upload.constants'
import { formatFileSize } from '@/utils/formatFileSize'

const validateFile = (file) => {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`

  if (!ACCEPTED_FILE_EXTENSIONS.includes(extension) && !ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `${extension || 'This file type'} isn't supported. Upload a CSV or XLSX file.`
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
  }

  return null
}

export function FileDropzone({ onFileAccepted, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0]
      if (!file) return

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      setError(null)
      onFileAccepted(file)
    },
    [onFileAccepted],
  )

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) handleFiles(event.dataTransfer.files)
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          isDragging ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface hover:border-accent/50',
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-active">
          <UploadCloud className="size-5 text-accent" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            Drop a file here, or <span className="text-accent">browse</span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            CSV or XLSX, up to {formatFileSize(MAX_FILE_SIZE_BYTES)}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
          disabled={disabled}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-status-failed">{error}</p>}
    </div>
  )
}
