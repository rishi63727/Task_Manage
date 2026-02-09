import React, { useCallback, useState } from 'react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSizeBytes?: number
  disabled?: boolean
}

const DEFAULT_MAX = 10 * 1024 * 1024 // 10MB

export function FileUpload({
  onUpload,
  accept,
  maxSizeBytes = DEFAULT_MAX,
  disabled,
}: FileUploadProps) {
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setError(null)
      if (file.size > maxSizeBytes) {
        setError(`File must be under ${Math.round(maxSizeBytes / 1024 / 1024)}MB`)
        return
      }
      setUploading(true)
      try {
        await onUpload(file)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [onUpload, maxSizeBytes]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDrag(false)
      const file = e.dataTransfer.files?.[0]
      handleFile(file || null)
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0] || null)
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '1.5rem',
        textAlign: 'center',
        background: drag ? 'var(--bg-hover)' : 'var(--bg-elevated)',
        cursor: disabled || uploading ? 'not-allowed' : 'pointer',
        opacity: disabled || uploading ? 0.7 : 1,
      }}
    >
      <input
        type="file"
        accept={accept}
        onChange={onInputChange}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
        id="file-upload-input"
      />
      <label htmlFor="file-upload-input" style={{ cursor: disabled || uploading ? 'not-allowed' : 'pointer' }}>
        {uploading ? (
          <span>Uploading…</span>
        ) : (
          <span>{drag ? 'Drop file here' : 'Drag and drop a file, or click to select'}</span>
        )}
      </label>
      {error && <p className="form-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
    </div>
  )
}
