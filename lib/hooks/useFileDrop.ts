'use client'

import { useState } from 'react'

export function useFileDrop(onFiles: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false)

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
      },
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files || [])
        if (files.length > 0) onFiles(files)
      },
    },
  }
}
