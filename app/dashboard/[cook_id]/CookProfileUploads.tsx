'use client'

import { useEffect, useRef, useState } from 'react'
import type { CookDish } from '@/lib/types'
import { useFileDrop } from '@/lib/hooks/useFileDrop'

const MAX_DISHES = 10
// ID verification is on hold indefinitely — flip this back on when it resumes.
const SHOW_ID_UPLOAD = false

export default function CookProfileUploads({
  cookId,
  idUploaded,
  initialDishes,
  initialName,
  initialPhotoUrl,
  initialBio,
  initialInstagramUrl,
  initialYoutubeUrl,
  initialWhatsappGroupLink,
}: {
  cookId: string
  idUploaded: boolean
  initialDishes: CookDish[]
  initialName: string
  initialPhotoUrl: string | null
  initialBio: string
  initialInstagramUrl: string | null
  initialYoutubeUrl: string | null
  initialWhatsappGroupLink: string | null
}) {
  const [hasId, setHasId] = useState(idUploaded)
  const [dishes, setDishes] = useState(initialDishes)
  const [idUploading, setIdUploading] = useState(false)
  const [idError, setIdError] = useState('')
  const [idSavedNotice, setIdSavedNotice] = useState(false)

  const [dishUploading, setDishUploading] = useState(false)
  const [dishUploadProgress, setDishUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [dishErrors, setDishErrors] = useState<string[]>([])
  const [dishSavedNotice, setDishSavedNotice] = useState(false)

  const [editingDishId, setEditingDishId] = useState<string | null>(null)
  const [editDishFile, setEditDishFile] = useState<File | null>(null)
  const [editDishDescription, setEditDishDescription] = useState('')
  const [editDishSaving, setEditDishSaving] = useState(false)
  const [editDishError, setEditDishError] = useState('')

  const [name, setName] = useState(initialName)
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [bio, setBio] = useState(initialBio)
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl || '')
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl || '')
  const [whatsappGroupLink, setWhatsappGroupLink] = useState(initialWhatsappGroupLink || '')
  const [polishing, setPolishing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSavedNotice, setProfileSavedNotice] = useState(false)

  const idInputRef = useRef<HTMLInputElement>(null)
  const dishInputRef = useRef<HTMLInputElement>(null)
  const editDishInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!idSavedNotice) return
    const t = setTimeout(() => setIdSavedNotice(false), 3000)
    return () => clearTimeout(t)
  }, [idSavedNotice])

  useEffect(() => {
    if (!dishSavedNotice) return
    const t = setTimeout(() => setDishSavedNotice(false), 3000)
    return () => clearTimeout(t)
  }, [dishSavedNotice])

  useEffect(() => {
    if (!profileSavedNotice) return
    const t = setTimeout(() => setProfileSavedNotice(false), 3000)
    return () => clearTimeout(t)
  }, [profileSavedNotice])

  async function uploadIdFile(file: File) {
    setIdUploading(true)
    setIdError('')
    const formData = new FormData()
    formData.append('document', file)
    formData.append('cook_id', cookId)
    const res = await fetch('/api/upload-id-document', { method: 'POST', body: formData })
    setIdUploading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setIdError(data.error || 'Upload failed. Please try again.')
      return
    }
    setHasId(true)
    setIdSavedNotice(true)
    if (idInputRef.current) idInputRef.current.value = ''
  }

  function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadIdFile(file)
  }

  const idDrag = useFileDrop(files => uploadIdFile(files[0]))
  const editDishDrag = useFileDrop(files => setEditDishFile(files[0]))

  // Uploads every dropped/selected photo one after another, no per-photo
  // confirmation step — a cook adding several dishes shouldn't have to
  // click "add" once per photo. Descriptions can be added afterward via the
  // edit pencil on each thumbnail.
  const dishDrag = useFileDrop(files => uploadDishFiles(files))

  async function uploadDishFiles(files: File[]) {
    if (dishUploading) return
    const slotsLeft = MAX_DISHES - dishes.length
    const toUpload = files.slice(0, slotsLeft)
    const skippedCount = files.length - toUpload.length
    if (toUpload.length === 0) {
      setDishErrors([`You're at the ${MAX_DISHES}-photo limit — remove one before adding more.`])
      return
    }

    setDishUploading(true)
    setDishErrors([])
    setDishSavedNotice(false)
    setDishUploadProgress({ done: 0, total: toUpload.length })

    const errors: string[] = []
    for (const file of toUpload) {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('cook_id', cookId)
      formData.append('description', '')
      const res = await fetch('/api/upload-dish-photo', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setDishes(prev => [...prev, data.dish])
      } else {
        const data = await res.json().catch(() => ({}))
        errors.push(`${file.name}: ${data.error || 'Upload failed'}`)
      }
      setDishUploadProgress(prev => (prev ? { ...prev, done: prev.done + 1 } : prev))
    }
    if (skippedCount > 0) {
      errors.push(`${skippedCount} photo${skippedCount > 1 ? 's' : ''} skipped — you're at the ${MAX_DISHES}-photo limit.`)
    }

    setDishUploading(false)
    setDishUploadProgress(null)
    setDishErrors(errors)
    if (errors.length === 0) setDishSavedNotice(true)
    if (dishInputRef.current) dishInputRef.current.value = ''
  }

  async function handleDeleteDish(dishId: string) {
    const res = await fetch(`/api/dishes/${dishId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId }),
    })
    if (res.ok) {
      setDishes(prev => prev.filter(d => d.id !== dishId))
    }
  }

  function startEditDish(dish: CookDish) {
    setEditingDishId(dish.id)
    setEditDishFile(null)
    setEditDishDescription(dish.description || '')
    setEditDishError('')
  }

  function cancelEditDish() {
    setEditingDishId(null)
    setEditDishFile(null)
    setEditDishDescription('')
    setEditDishError('')
    if (editDishInputRef.current) editDishInputRef.current.value = ''
  }

  async function handleSaveEditDish(dishId: string) {
    setEditDishSaving(true)
    setEditDishError('')
    const formData = new FormData()
    formData.append('cook_id', cookId)
    formData.append('description', editDishDescription)
    if (editDishFile) formData.append('photo', editDishFile)
    const res = await fetch(`/api/dishes/${dishId}`, { method: 'PATCH', body: formData })
    setEditDishSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setEditDishError(data.error || 'Update failed. Please try again.')
      return
    }
    const data = await res.json()
    setDishes(prev => prev.map(d => (d.id === dishId ? data.dish : d)))
    cancelEditDish()
  }

  async function handlePolish() {
    if (!bio.trim()) return
    setPolishing(true)
    try {
      const res = await fetch('/api/polish-intro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: bio }) })
      const data = await res.json()
      if (data.polished) setBio(data.polished)
    } finally {
      setPolishing(false)
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be under 5MB.')
      return
    }
    setPhotoError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSaveProfile() {
    setProfileSaving(true)
    setProfileError('')

    // A newly chosen photo is uploaded to storage first — /api/upload-photo
    // just stores the blob and hands back a URL, same helper the apply page
    // uses. Only once we have that URL does the profile save persist it.
    let nextPhotoUrl = photoUrl
    if (photoFile) {
      setPhotoUploading(true)
      const formData = new FormData()
      formData.append('photo', photoFile)
      const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: formData })
      setPhotoUploading(false)
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}))
        setProfileSaving(false)
        setPhotoError(data.error || 'Photo upload failed. Please try again.')
        return
      }
      const uploadData = await uploadRes.json()
      nextPhotoUrl = uploadData.url
    }

    const res = await fetch('/api/update-cook-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cook_id: cookId,
        name,
        photo_url: nextPhotoUrl,
        bio,
        instagram_url: instagramUrl,
        youtube_url: youtubeUrl,
        whatsapp_group_link: whatsappGroupLink,
      }),
    })
    setProfileSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setProfileError(data.error || 'Update failed. Please try again.')
      return
    }
    setPhotoUrl(nextPhotoUrl)
    setPhotoFile(null)
    setPhotoPreview(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
    setProfileSavedNotice(true)
  }

  const profileComplete = (!SHOW_ID_UPLOAD || hasId) && dishes.length > 0

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
        {profileComplete && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4">ID and dish photos save automatically. Your introduction and links need a Save.</p>

      {/* About you */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">About you</p>

        <div className="flex items-center gap-4 mb-4">
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          <div
            onClick={() => photoInputRef.current?.click()}
            className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-copper-400 overflow-hidden shrink-0"
          >
            {photoPreview || photoUrl ? (
              <img src={photoPreview || photoUrl || ''} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400 text-center leading-tight px-1">Add photo</span>
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="text-xs text-copper-600 hover:text-copper-700 mt-1"
            >
              {photoUrl || photoPreview ? 'Change photo' : 'Add a profile photo'}
            </button>
            {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">Introduction</label>
          <button
            type="button"
            onClick={handlePolish}
            disabled={polishing || !bio.trim()}
            className="text-xs text-copper-600 hover:text-copper-700 disabled:opacity-40 transition-opacity"
          >
            {polishing ? 'Polishing...' : '✨ Polish'}
          </button>
        </div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none mb-3"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Instagram link</label>
            <input
              type="url"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">YouTube link</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 block mb-1">WhatsApp group invite link</label>
            <input
              type="url"
              value={whatsappGroupLink}
              onChange={e => setWhatsappGroupLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">If you run a WhatsApp group, share the invite link here so interested clients can join.</p>
          </div>
        </div>
        {profileError && <p className="text-xs text-red-600 mb-2">{profileError}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={profileSaving || !bio.trim() || !name.trim()}
            className="text-xs text-white bg-copper-600 rounded-lg px-3 py-1.5 hover:bg-copper-700 disabled:opacity-40"
          >
            {profileSaving || photoUploading ? 'Saving...' : 'Save'}
          </button>
          {profileSavedNotice && <span className="text-xs text-green-600">✓ Saved</span>}
        </div>
      </div>

      {/* ID document */}
      {SHOW_ID_UPLOAD && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Government-issued ID</p>
          {hasId ? (
            <p className="text-sm text-green-700 mb-2">✓ ID on file</p>
          ) : (
            <p className="text-sm text-gray-500 mb-2">Upload a driver's license, passport, or state ID to keep on file with your profile.</p>
          )}
          <input ref={idInputRef} type="file" accept="image/*,.pdf" onChange={handleIdUpload} className="hidden" />
          <div
            {...idDrag.dragHandlers}
            className={`rounded-lg border-2 border-dashed p-2 -m-2 transition-colors ${idDrag.isDragging ? 'border-copper-400 bg-copper-50' : 'border-transparent'}`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                disabled={idUploading}
                className="text-xs text-copper-600 border border-copper-300 rounded-lg px-3 py-1.5 hover:bg-copper-50 disabled:opacity-40"
              >
                {idUploading ? 'Uploading...' : hasId ? 'Replace ID' : 'Upload ID'}
              </button>
              <span className="text-xs text-gray-400">or drag a file here</span>
              {idSavedNotice && <span className="text-xs text-green-600">✓ Saved</span>}
            </div>
          </div>
          {idError && <p className="text-xs text-red-600 mt-1.5">{idError}</p>}
        </div>
      )}

      {/* Dish photos */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Dish photos ({dishes.length}/{MAX_DISHES})</p>
        <p className="text-sm text-gray-500 mb-3">
          Add photos of dishes you've cooked in the past — this is what clients see on your profile to decide if they want to book you.
        </p>
        {dishSavedNotice && <p className="text-xs text-green-600 mb-3">✓ Dish photos saved to your profile</p>}

        {dishes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {dishes.map(dish => (
              editingDishId === dish.id ? (
                <div key={dish.id} className="col-span-2 sm:col-span-3 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img src={dish.photo_url} alt={dish.description || 'Dish photo'} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <input
                      ref={editDishInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => setEditDishFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div
                      {...editDishDrag.dragHandlers}
                      className={`flex flex-col gap-1 rounded-lg border-2 border-dashed p-2 -m-2 transition-colors ${editDishDrag.isDragging ? 'border-copper-400 bg-copper-50' : 'border-transparent'}`}
                    >
                      <button
                        type="button"
                        onClick={() => editDishInputRef.current?.click()}
                        className="text-xs text-copper-600 border border-copper-300 rounded-lg px-3 py-1.5 hover:bg-copper-50 w-fit"
                      >
                        Replace photo
                      </button>
                      <span className="text-xs text-gray-500">{editDishFile ? editDishFile.name : 'Keep current photo, or drag a new one here'}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editDishDescription}
                    onChange={e => setEditDishDescription(e.target.value)}
                    placeholder="e.g. Chettinad chicken curry"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {editDishError && <p className="text-xs text-red-600">{editDishError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEditDish}
                      className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditDish(dish.id)}
                      disabled={editDishSaving}
                      className="flex-1 bg-copper-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-copper-700 disabled:opacity-50"
                    >
                      {editDishSaving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={dish.id} className="relative group">
                  <img src={dish.photo_url} alt={dish.description || 'Dish photo'} className="w-full aspect-square object-cover rounded-lg" />
                  {dish.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{dish.description}</p>}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEditDish(dish)}
                      className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      aria-label="Edit dish photo"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish.id)}
                      className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      aria-label="Remove dish photo"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {dishes.length < MAX_DISHES && (
          <div
            {...dishDrag.dragHandlers}
            className={`rounded-lg border-2 border-dashed p-4 flex flex-col items-center gap-2 text-center transition-colors ${dishDrag.isDragging ? 'border-copper-400 bg-copper-50' : 'border-gray-200'}`}
          >
            <input
              ref={dishInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => { const files = Array.from(e.target.files || []); if (files.length > 0) uploadDishFiles(files) }}
              className="hidden"
              disabled={dishUploading}
            />
            <button
              type="button"
              onClick={() => dishInputRef.current?.click()}
              disabled={dishUploading}
              className="text-xs text-copper-600 border border-copper-300 rounded-lg px-3 py-1.5 hover:bg-copper-50 disabled:opacity-40"
            >
              {dishUploading
                ? `Uploading ${dishUploadProgress ? dishUploadProgress.done + 1 : 1} of ${dishUploadProgress?.total ?? 1}...`
                : '+ Add dish photos'}
            </button>
            <span className="text-xs text-gray-400">or drag photos here — select or drop several at once, they upload automatically</span>
          </div>
        )}
        {dishErrors.length > 0 && (
          <div className="mt-2 flex flex-col gap-0.5">
            {dishErrors.map((err, i) => <p key={i} className="text-xs text-red-600">{err}</p>)}
          </div>
        )}
      </div>
    </section>
  )
}
