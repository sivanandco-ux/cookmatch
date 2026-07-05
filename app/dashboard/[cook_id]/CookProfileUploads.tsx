'use client'

import { useEffect, useRef, useState } from 'react'
import type { CookDish } from '@/lib/types'

const MAX_DISHES = 10

export default function CookProfileUploads({
  cookId,
  idUploaded,
  initialDishes,
}: {
  cookId: string
  idUploaded: boolean
  initialDishes: CookDish[]
}) {
  const [hasId, setHasId] = useState(idUploaded)
  const [dishes, setDishes] = useState(initialDishes)
  const [idUploading, setIdUploading] = useState(false)
  const [idError, setIdError] = useState('')
  const [idSavedNotice, setIdSavedNotice] = useState(false)

  const [showAddDish, setShowAddDish] = useState(false)
  const [dishFile, setDishFile] = useState<File | null>(null)
  const [dishDescription, setDishDescription] = useState('')
  const [dishUploading, setDishUploading] = useState(false)
  const [dishError, setDishError] = useState('')
  const [dishSavedNotice, setDishSavedNotice] = useState(false)

  const idInputRef = useRef<HTMLInputElement>(null)
  const dishInputRef = useRef<HTMLInputElement>(null)

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

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
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

  async function handleAddDish() {
    if (!dishFile) return
    setDishUploading(true)
    setDishError('')
    const formData = new FormData()
    formData.append('photo', dishFile)
    formData.append('cook_id', cookId)
    formData.append('description', dishDescription)
    const res = await fetch('/api/upload-dish-photo', { method: 'POST', body: formData })
    setDishUploading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDishError(data.error || 'Upload failed. Please try again.')
      return
    }
    const data = await res.json()
    setDishes(prev => [...prev, data.dish])
    setDishFile(null)
    setDishDescription('')
    setShowAddDish(false)
    setDishSavedNotice(true)
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

  const profileComplete = hasId && dishes.length > 0

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
        {profileComplete && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-4">Everything here saves automatically as soon as you upload it — there's nothing else to submit.</p>

      {/* ID document */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">Government-issued ID</p>
        {hasId ? (
          <p className="text-sm text-green-700 mb-2">✓ ID on file</p>
        ) : (
          <p className="text-sm text-gray-500 mb-2">Upload a driver's license, passport, or state ID to complete verification.</p>
        )}
        <input ref={idInputRef} type="file" accept="image/*,.pdf" onChange={handleIdUpload} className="hidden" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => idInputRef.current?.click()}
            disabled={idUploading}
            className="text-xs text-orange-600 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-50 disabled:opacity-40"
          >
            {idUploading ? 'Uploading...' : hasId ? 'Replace ID' : 'Upload ID'}
          </button>
          {idSavedNotice && <span className="text-xs text-green-600">✓ Saved</span>}
        </div>
        {idError && <p className="text-xs text-red-600 mt-1.5">{idError}</p>}
      </div>

      {/* Dish photos */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Dish photos ({dishes.length}/{MAX_DISHES})</p>
          {dishes.length < MAX_DISHES && !showAddDish && (
            <button
              type="button"
              onClick={() => setShowAddDish(true)}
              className="text-xs text-orange-600 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-50"
            >
              + Add a dish
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Add photos of dishes you've cooked in the past — this is what clients see on your profile to decide if they want to book you.
        </p>
        {dishSavedNotice && <p className="text-xs text-green-600 mb-3">✓ Dish photo saved to your profile</p>}

        {dishes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {dishes.map(dish => (
              <div key={dish.id} className="relative group">
                <img src={dish.photo_url} alt={dish.description || 'Dish photo'} className="w-full aspect-square object-cover rounded-lg" />
                {dish.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{dish.description}</p>}
                <button
                  type="button"
                  onClick={() => handleDeleteDish(dish.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove dish photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddDish && (
          <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
            <input
              ref={dishInputRef}
              type="file"
              accept="image/*"
              onChange={e => setDishFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dishInputRef.current?.click()}
                className="text-xs text-orange-600 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-50 shrink-0"
              >
                Choose photo
              </button>
              <span className="text-xs text-gray-500 truncate">{dishFile ? dishFile.name : 'No photo selected'}</span>
            </div>
            <input
              type="text"
              value={dishDescription}
              onChange={e => setDishDescription(e.target.value)}
              placeholder="e.g. Chettinad chicken curry"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {dishError && <p className="text-xs text-red-600">{dishError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAddDish(false); setDishFile(null); setDishDescription(''); setDishError('') }}
                className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddDish}
                disabled={!dishFile || dishUploading}
                className="flex-1 bg-orange-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {dishUploading ? 'Uploading...' : 'Save dish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
