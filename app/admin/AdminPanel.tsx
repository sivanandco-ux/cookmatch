'use client'

import { useState } from 'react'

interface Job {
  id: string
  job_category: string
  request_type: string
  specific_dishes: string | null
  occasion: string
  city: string
  requested_date: string
  status: string
  created_at: string
  client_name: string
  client_email: string
}

interface Cook {
  id: string
  name: string
  email: string
  status: string
  service_areas: string[]
  created_at: string
}

interface WaitlistEntry {
  id: string
  name: string | null
  email: string
  city: string | null
  state: string | null
  cooking_interest: string | null
  created_at: string
}

const CATEGORY: Record<string, string> = {
  family_cooking: 'Family',
  small_event: 'Small Event',
  medium_event: 'Medium Event',
}

function jobLabel(job: Job) {
  if (job.request_type === 'item') return job.specific_dishes?.trim() || 'Item Order'
  return CATEGORY[job.job_category] ?? job.job_category
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    taken: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-500',
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    dormant: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function Section<T extends { id: string }>({
  title,
  items,
  selected,
  onToggle,
  onSelectAll,
  onDelete,
  deleting,
  renderRow,
  headers,
}: {
  title: string
  items: T[]
  selected: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDelete: () => void
  deleting: boolean
  renderRow: (item: T) => React.ReactNode
  headers: string[]
}) {
  const allSelected = items.length > 0 && selected.size === items.length
  const someSelected = selected.size > 0

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title} <span className="text-gray-400 font-normal text-base">({items.length})</span></h2>
        {someSelected && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : `Delete selected (${selected.size})`}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">None.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded"
                  />
                </th>
                {headers.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className={selected.has(item.id) ? 'bg-red-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => onToggle(item.id)}
                      className="rounded"
                    />
                  </td>
                  {renderRow(item)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function AdminPanel({ jobs: initialJobs, cooks: initialCooks, waitlist: initialWaitlist, adminKey }: {
  jobs: Job[]
  cooks: Cook[]
  waitlist: WaitlistEntry[]
  adminKey: string
}) {
  const [jobs, setJobs] = useState(initialJobs)
  const [cooks, setCooks] = useState(initialCooks)
  const [waitlist, setWaitlist] = useState(initialWaitlist)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [selectedCooks, setSelectedCooks] = useState<Set<string>>(new Set())
  const [selectedWaitlist, setSelectedWaitlist] = useState<Set<string>>(new Set())
  const [deletingJobs, setDeletingJobs] = useState(false)
  const [deletingCooks, setDeletingCooks] = useState(false)
  const [deletingWaitlist, setDeletingWaitlist] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [error, setError] = useState('')

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    setter(next)
  }

  function selectAll<T extends { id: string }>(items: T[], set: Set<string>, setter: (s: Set<string>) => void) {
    setter(set.size === items.length ? new Set() : new Set(items.map(i => i.id)))
  }

  async function deleteJobs() {
    if (!confirm(`Permanently delete ${selectedJobs.size} job(s)?`)) return
    setDeletingJobs(true)
    setError('')
    const res = await fetch('/api/admin/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ ids: [...selectedJobs] }),
    })
    setDeletingJobs(false)
    if (res.ok) {
      setJobs(j => j.filter(x => !selectedJobs.has(x.id)))
      setSelectedJobs(new Set())
    } else {
      const d = await res.json()
      setError(d.error || 'Delete failed')
    }
  }

  async function activateCook(id: string) {
    setActivating(id)
    setError('')
    const res = await fetch('/api/admin/cooks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    })
    setActivating(null)
    if (res.ok) {
      setCooks(c => c.map(x => x.id === id ? { ...x, status: 'active' } : x))
    } else {
      const d = await res.json()
      setError(d.error || 'Activation failed')
    }
  }

  async function deleteCooks() {
    if (!confirm(`Permanently delete ${selectedCooks.size} cook(s)? This removes all their data.`)) return
    setDeletingCooks(true)
    setError('')
    const res = await fetch('/api/admin/cooks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ ids: [...selectedCooks] }),
    })
    setDeletingCooks(false)
    if (res.ok) {
      setCooks(c => c.filter(x => !selectedCooks.has(x.id)))
      setSelectedCooks(new Set())
    } else {
      const d = await res.json()
      setError(d.error || 'Delete failed')
    }
  }

  async function deleteWaitlist() {
    if (!confirm(`Remove ${selectedWaitlist.size} waitlist entr${selectedWaitlist.size === 1 ? 'y' : 'ies'}?`)) return
    setDeletingWaitlist(true)
    setError('')
    const res = await fetch('/api/admin/waitlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ ids: [...selectedWaitlist] }),
    })
    setDeletingWaitlist(false)
    if (res.ok) {
      setWaitlist(w => w.filter(x => !selectedWaitlist.has(x.id)))
      setSelectedWaitlist(new Set())
    } else {
      const d = await res.json()
      setError(d.error || 'Delete failed')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage jobs and cooks. Deletions are permanent.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <Section
        title="Open Jobs"
        items={jobs.filter(j => j.status === 'open')}
        selected={selectedJobs}
        onToggle={id => toggle(selectedJobs, id, setSelectedJobs)}
        onSelectAll={() => selectAll(jobs.filter(j => j.status === 'open'), selectedJobs, setSelectedJobs)}
        onDelete={deleteJobs}
        deleting={deletingJobs}
        headers={['Posted', 'Client', 'Job', 'City', 'Event Date', 'Status']}
        renderRow={job => (
          <>
            <td className="px-4 py-3 text-gray-500">{fmtDate(job.created_at)}</td>
            <td className="px-4 py-3">
              <p className="font-medium text-gray-900">{job.client_name}</p>
              <p className="text-xs text-gray-400">{job.client_email}</p>
            </td>
            <td className="px-4 py-3 text-gray-700">{jobLabel(job)} · {job.occasion}</td>
            <td className="px-4 py-3 text-gray-700">{job.city}</td>
            <td className="px-4 py-3 text-gray-700">{fmtDate(job.requested_date)}</td>
            <td className="px-4 py-3">{statusBadge(job.status)}</td>
          </>
        )}
      />

      <Section
        title="Taken / Closed Jobs"
        items={jobs.filter(j => j.status !== 'open')}
        selected={selectedJobs}
        onToggle={id => toggle(selectedJobs, id, setSelectedJobs)}
        onSelectAll={() => selectAll(jobs.filter(j => j.status !== 'open'), selectedJobs, setSelectedJobs)}
        onDelete={deleteJobs}
        deleting={deletingJobs}
        headers={['Posted', 'Client', 'Job', 'City', 'Event Date', 'Status']}
        renderRow={job => (
          <>
            <td className="px-4 py-3 text-gray-500">{fmtDate(job.created_at)}</td>
            <td className="px-4 py-3">
              <p className="font-medium text-gray-900">{job.client_name}</p>
              <p className="text-xs text-gray-400">{job.client_email}</p>
            </td>
            <td className="px-4 py-3 text-gray-700">{jobLabel(job)} · {job.occasion}</td>
            <td className="px-4 py-3 text-gray-700">{job.city}</td>
            <td className="px-4 py-3 text-gray-700">{fmtDate(job.requested_date)}</td>
            <td className="px-4 py-3">{statusBadge(job.status)}</td>
          </>
        )}
      />

      <Section
        title="Cooks"
        items={cooks}
        selected={selectedCooks}
        onToggle={id => toggle(selectedCooks, id, setSelectedCooks)}
        onSelectAll={() => selectAll(cooks, selectedCooks, setSelectedCooks)}
        onDelete={deleteCooks}
        deleting={deletingCooks}
        headers={['Joined', 'Name', 'Email', 'Areas', 'Status', '']}
        renderRow={cook => (
          <>
            <td className="px-4 py-3 text-gray-500">{fmtDate(cook.created_at)}</td>
            <td className="px-4 py-3 font-medium text-gray-900">{cook.name}</td>
            <td className="px-4 py-3 text-gray-600">{cook.email}</td>
            <td className="px-4 py-3 text-gray-600">{(cook.service_areas || []).join(', ')}</td>
            <td className="px-4 py-3">{statusBadge(cook.status)}</td>
            <td className="px-4 py-3">
              {cook.status === 'pending' && (
                <button
                  onClick={() => activateCook(cook.id)}
                  disabled={activating === cook.id}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {activating === cook.id ? 'Activating...' : 'Activate'}
                </button>
              )}
            </td>
          </>
        )}
      />

      <Section
        title="Cook Waitlist"
        items={waitlist}
        selected={selectedWaitlist}
        onToggle={id => toggle(selectedWaitlist, id, setSelectedWaitlist)}
        onSelectAll={() => selectAll(waitlist, selectedWaitlist, setSelectedWaitlist)}
        onDelete={deleteWaitlist}
        deleting={deletingWaitlist}
        headers={['Joined', 'Name', 'Email', 'Location', 'Cooking Interest']}
        renderRow={entry => (
          <>
            <td className="px-4 py-3 text-gray-500">{fmtDate(entry.created_at)}</td>
            <td className="px-4 py-3 font-medium text-gray-900">{entry.name}</td>
            <td className="px-4 py-3 text-gray-600">{entry.email}</td>
            <td className="px-4 py-3 text-gray-600">{[entry.city, entry.state].filter(Boolean).join(', ')}</td>
            <td className="px-4 py-3 text-gray-600">{entry.cooking_interest}</td>
          </>
        )}
      />
    </div>
  )
}
