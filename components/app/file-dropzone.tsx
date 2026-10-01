'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'

type FileDropzoneProps = {
  accept: string
  maxSize: number
  onFile: (file: File) => void
  title: string
  description: string
}

export function FileDropzone({
  accept,
  maxSize,
  onFile,
  title,
  description,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const validateAndSend = (file?: File) => {
    if (!file) return

    if (file.size > maxSize) {
      setError(
        `File must be smaller than ${Math.round(maxSize / 1024 / 1024)} MB.`,
      )
      return
    }

    const allowed = accept
      .split(',')
      .map((item) => item.trim().toLowerCase())

    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`

    if (!allowed.includes(file.type.toLowerCase()) &&
        !allowed.includes(extension)) {
      setError('This file type is not supported.')
      return
    }

    setError('')
    onFile(file)
  }

  return (
    <div
      className={[
        'mt-8 rounded-2xl border-2 border-dashed p-12 text-center transition-colors',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border',
      ].join(' ')}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)

        const file = event.dataTransfer.files?.[0]
        validateAndSend(file)
      }}
    >
      <Upload className="mx-auto h-10 w-10" />

      <h2 className="mt-4 text-xl font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Drag & drop your file here
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        {description}
      </p>

      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}