'use client'

import { useState } from 'react'

export function useFileDrop(onFile: (file: File) => void) {
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
        const file = e.dataTransfer.files?.[0]
        if (file) onFile(file)
      },
    },
  }
}
