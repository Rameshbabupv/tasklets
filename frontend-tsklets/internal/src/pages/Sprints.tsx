import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'

interface Sprint {
  id: number
  name: string
  goal: string | null
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  velocity: number | null
  createdAt: string
}

interface VelocityData {
  sprints: { id: number; name: string; velocity: number }[]
  average: number
}

// Helper: Generate sprint name from date
function generateSprintName(startDate: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[startDate.getMonth()]
  const half = startDate.getDate() <= 15 ? 'I' : 'II'
  const year = String(startDate.getFullYear()).slice(-2)
  return `${month}-${half}-${year}`
}

// Helper: Calculate end date (2 weeks from start)
function calculateEndDate(startDate: Date): string {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 13)
  return endDate.toISOString().split('T')[0]
}

export default function Sprints() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { token } = useAuthStore()

  // Form state
  const [startDate, setStartDate] = useState('')
  const [sprintName, setSprintName] = useState('')
  const [goal, setGoal] = useState('')
  const [error, setError] = useState('')

  const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }
  const textPrimary = { color: 'var(--text-primary)' }
  const textSecondary = { color: 'var(--text-secondary)' }
  const textMuted = { color: 'var(--text-muted)' }

  useEffect(() => {
    fetchSprints()
  }, [])

  // Auto-generate sprint name when start date changes
  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate + 'T12:00:00') // Avoid timezone issues
      setSprintName(generateSprintName(date))
    }
  }, [startDate])

  const fetchSprints = async () => {
    try {
      const [sprintsRes, velocityRes] = await Promise.all([
        fetch('/api/sprints', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sprints/metrics/velocity', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const sprintsData = await sprintsRes.json()
      const velocityDataRes = await velocityRes.json()
      setSprints(sprintsData.sprints || [])
      setVelocityData(velocityDataRes)
    } catch (err) {
      console.error('Failed to fetch sprints', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStartDate('')
    setSprintName('')
    setGoal('')
    setError('')
  }

  const openModal = () => {
    resetForm()
    // Default to next Monday
    const today = new Date()
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    setStartDate(nextMonday.toISOString().split('T')[0])
    setShowModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sprintName,
          goal: goal || null,
          startDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create sprint')
      }

      setShowModal(false)
      resetForm()
      fetchSprints()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStart = async (sprintId: number) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to start sprint')
        return
      }

      fetchSprints()
    } catch (err) {
      console.error('Failed to start sprint', err)
    }
  }

  const handleComplete = async (sprintId: number) => {
    if (!confirm('Complete this sprint? Incomplete tasks will be moved to backlog.')) return

    try {
      const res = await fetch(`/api/sprints/${sprintId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moveIncompleteTo: 'backlog' }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to complete sprint')
        return
      }

      fetchSprints()
    } catch (err) {
      console.error('Failed to complete sprint', err)
    }
  }

  const getStatusBadge = (status: Sprint['status']) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      planning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Planning' },
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Active' },
      completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Completed' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
    }
    const s = styles[status]
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate + 'T23:59:59')
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-16 px-6 border-b flex items-center justify-between shrink-0"
          style={surfaceStyles}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold" style={textPrimary}>Sprints</h2>
            <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {sprints.filter(s => s.status === 'active').length > 0 ? '1 Active' : 'No Active Sprint'}
            </span>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Sprint
          </button>
        </header>

        {/* Sprint List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={textSecondary}>Loading...</div>
          ) : sprints.length === 0 ? (
            <div className="text-center py-12" style={textMuted}>
              No sprints yet. Click "New Sprint" to create your first sprint.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Sprint (highlighted) */}
              {sprints.filter(s => s.status === 'active').map((sprint) => (
                <div
                  key={sprint.id}
                  className="rounded-xl border-2 border-green-500 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[24px]">sprint</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg" style={textPrimary}>{sprint.name}</h3>
                        <p className="text-sm" style={textSecondary}>
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                          <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                            ({getDaysRemaining(sprint.endDate)} days left)
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(sprint.status)}
                      <Link
                        to={`/sprints/${sprint.id}`}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Open Board
                      </Link>
                      <button
                        onClick={() => handleComplete(sprint.id)}
                        className="px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                  {sprint.goal && (
                    <p className="text-sm mt-2 pl-15" style={textSecondary}>
                      <span className="font-medium">Goal:</span> {sprint.goal}
                    </p>
                  )}
                </div>
              ))}

              {/* Planning Sprints */}
              {sprints.filter(s => s.status === 'planning').length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={textMuted}>
                    Planning
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sprints.filter(s => s.status === 'planning').map((sprint) => (
                      <div
                        key={sprint.id}
                        className="rounded-xl border p-4 hover:shadow-md transition-all"
                        style={surfaceStyles}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="size-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                            <span className="material-symbols-outlined">edit_calendar</span>
                          </div>
                          {getStatusBadge(sprint.status)}
                        </div>
                        <h4 className="font-semibold mb-1" style={textPrimary}>{sprint.name}</h4>
                        <p className="text-sm mb-3" style={textSecondary}>
                          {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                        </p>
                        {sprint.goal && (
                          <p className="text-sm mb-3 line-clamp-2" style={textMuted}>{sprint.goal}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStart(sprint.id)}
                            className="flex-1 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Start Sprint
                          </button>
                          <Link
                            to={`/sprints/${sprint.id}`}
                            className="px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors hover:bg-primary/10"
                            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                          >
                            Plan
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Sprints */}
              {sprints.filter(s => s.status === 'completed').length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={textMuted}>
                    Completed
                  </h3>
                  <div className="rounded-xl border overflow-hidden" style={surfaceStyles}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={textSecondary}>Sprint</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold" style={textSecondary}>Dates</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold" style={textSecondary}>Velocity</th>
                          <th className="text-right px-4 py-3 text-sm font-semibold" style={textSecondary}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sprints.filter(s => s.status === 'completed').map((sprint) => (
                          <tr
                            key={sprint.id}
                            className="border-b last:border-b-0"
                            style={{ borderColor: 'var(--border-primary)' }}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium" style={textPrimary}>{sprint.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={textSecondary}>
                                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold">
                                {sprint.velocity ?? 0} pts
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`/sprints/${sprint.id}/retro`}
                                className="text-sm text-primary hover:underline"
                              >
                                View Retro
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Velocity Chart */}
              {velocityData?.sprints?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={textMuted}>
                    Velocity Trend
                  </h3>
                  <div className="rounded-xl border p-6" style={surfaceStyles}>
                    <div className="flex items-end justify-between gap-4 h-48">
                      {velocityData.sprints.map((sprint) => {
                        const maxVelocity = Math.max(...velocityData.sprints.map(s => s.velocity), 1)
                        const heightPercent = (sprint.velocity / maxVelocity) * 100
                        const isAboveAvg = sprint.velocity >= velocityData.average
                        return (
                          <div key={sprint.id} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-sm font-semibold" style={textPrimary}>
                              {sprint.velocity}
                            </span>
                            <div
                              className={`w-full rounded-t-lg transition-all ${
                                isAboveAvg
                                  ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                                  : 'bg-gradient-to-t from-blue-500 to-blue-400'
                              }`}
                              style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                            />
                            <span className="text-xs" style={textMuted}>{sprint.name}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-t from-green-500 to-emerald-400" />
                        <span className="text-xs" style={textSecondary}>Above Average</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-500 to-blue-400" />
                        <span className="text-xs" style={textSecondary}>Below Average</span>
                      </div>
                      <div className="text-xs font-semibold" style={textPrimary}>
                        Avg: {velocityData.average.toFixed(1)} pts/sprint
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Sprint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl w-full max-w-md mx-4" style={surfaceStyles}>
            <div className="p-6 border-b" style={surfaceStyles}>
              <h3 className="text-lg font-bold" style={textPrimary}>New Sprint</h3>
              <p className="text-sm mt-1" style={textSecondary}>
                Create a new 2-week sprint
              </p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div
                  className="p-3 border rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--error-bg)',
                    borderColor: 'var(--error-text)',
                    color: 'var(--error-text)',
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={textSecondary}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-sm py-2"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                  required
                />
                {startDate && (
                  <p className="text-xs mt-1" style={textMuted}>
                    Ends: {calculateEndDate(new Date(startDate + 'T12:00:00'))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={textSecondary}>
                  Sprint Name
                </label>
                <input
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="input-field text-sm py-2"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                  placeholder="Auto-generated from date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={textSecondary}>
                  Sprint Goal (optional)
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="input-field text-sm py-2 resize-none"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                  rows={3}
                  placeholder="What do you want to achieve this sprint?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={surfaceStyles}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !startDate}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
