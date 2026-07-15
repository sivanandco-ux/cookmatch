'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  onUploaded: (url: string) => void
}

export default function VoiceMemoRecorder({ onUploaded }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      mimeTypeRef.current = mimeType

      const recorder = new MediaRecorder(stream, { mimeType })
      chunks.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType })
        blobRef.current = blob
        setAudioUrl(URL.createObjectURL(blob))
        setState('recorded')
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      mediaRecorder.current = recorder
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorder.current?.stop()
  }

  function reRecord() {
    setAudioUrl(null)
    blobRef.current = null
    setState('idle')
    setSeconds(0)
    setError('')
  }

  async function upload() {
    if (!blobRef.current) return
    setState('uploading')

    const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm'
    const formData = new FormData()
    formData.append('audio', blobRef.current, `memo.${ext}`)

    const res = await fetch('/api/upload-voice-memo', { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(`Upload failed: ${data.error || res.statusText}`)
      setState('recorded')
      return
    }

    const { url } = await res.json()
    onUploaded(url)
    setState('done')
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <p className="text-sm font-medium text-gray-700 mb-1">
        Voice memo <span className="text-red-500">*</span>
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Describe what you need — the cook listens to this before deciding to accept.
      </p>

      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 bg-copper-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-copper-700"
        >
          <span className="w-2 h-2 rounded-full bg-white inline-block" />
          Start Recording
        </button>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block" />
            Recording — {formatTime(seconds)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900"
          >
            Stop
          </button>
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div className="flex flex-col gap-3">
          <audio src={audioUrl} controls className="w-full h-10" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={upload}
              className="bg-copper-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-copper-700"
            >
              Use this recording
            </button>
            <button
              type="button"
              onClick={reRecord}
              className="text-gray-600 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:border-gray-400"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {state === 'uploading' && (
        <p className="text-sm text-gray-500">Uploading your memo...</p>
      )}

      {state === 'done' && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-600 font-medium">Voice memo saved</span>
          <button
            type="button"
            onClick={reRecord}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Re-record
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
