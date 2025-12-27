import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'

interface Sprint {
  id: number
  name: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
}

interface RetroData {
  wentWell: string
  improvements: string
  actionItems: string
}

export default function SprintRetro() {
  const { id } = useParams<{ id: string }>()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [retro, setRetro] = useState<RetroData>({ wentWell: '', improvements: '', actionItems: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { token } = useAuthStore()

  const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }
  const textPrimary = { color: 'var(--text-primary)' }
  const textSecondary = { color: 'var(--text-secondary)' }
  const textMuted = { color: 'var(--text-muted)' }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [sprintRes, retroRes] = await Promise.all([
        fetch(`/api/sprints/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sprints/${id}/retro`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const sprintData = await sprintRes.json()
      const retroData = await retroRes.json()
      setSprint(sprintData.sprint)
      if (retroData.retro) {
        setRetro({
          wentWell: retroData.retro.wentWell || '',
          improvements: retroData.retro.improvements || '',
          actionItems: retroData.retro.actionItems || '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch retro', err)
    } finally {
      setLoading(false)
    }
  }

  const saveRetro = useCallback(async () => {
    if (!id) return
    setSaving(true)
    try {
      await fetch(`/api/sprints/${id}/retro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(retro),
      })
      setLastSaved(new Date())
    } catch (err) {
      console.error('Failed to save retro', err)
    } finally {
      setSaving(false)
    }
  }, [id, retro, token])

  const handleBlur = () => {
    saveRetro()
  }

  const columns = [
    {
      key: 'wentWell',
      title: 'What Went Well',
      icon: 'thumb_up',
      color: 'emerald',
      placeholder: 'What worked well this sprint?\n\n• Team collaboration\n• Technical decisions\n• Process improvements',
    },
    {
      key: 'improvements',
      title: 'What Could Improve',
      icon: 'construction',
      color: 'amber',
      placeholder: 'What could we do better?\n\n• Blockers encountered\n• Communication gaps\n• Technical debt',
    },
    {
      key: 'actionItems',
      title: 'Action Items',
      icon: 'task_alt',
      color: 'blue',
      placeholder: 'Concrete actions for next sprint:\n\n• [ ] Action item 1\n• [ ] Action item 2\n• [ ] Action item 3',
    },
  ]

  const getHeaderColor = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return colors[color] || colors.blue
  }

  const getBorderColor = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'border-emerald-200 dark:border-emerald-800',
      amber: 'border-amber-200 dark:border-amber-800',
      blue: 'border-blue-200 dark:border-blue-800',
    }
    return colors[color] || colors.blue
  }

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4" style={textSecondary}>Loading retrospective...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p style={textSecondary}>Sprint not found</p>
            <Link to="/sprints" className="text-primary hover:underline mt-2 block">
              Back to Sprints
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b shrink-0" style={surfaceStyles}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/sprints" className="p-2 hover:bg-primary/10 rounded-lg transition-colors" style={textSecondary}>
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold" style={textPrimary}>{sprint.name} Retrospective</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    sprint.status === 'completed'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {sprint.status}
                  </span>
                </div>
                <p className="text-sm" style={textSecondary}>
                  Reflect on what worked and what can be improved
                </p>
              </div>
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-sm flex items-center gap-2" style={textMuted}>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  Saving...
                </span>
              )}
              {!saving && lastSaved && (
                <span className="text-sm" style={textMuted}>
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={saveRetro}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save
              </button>
            </div>
          </div>
        </header>

        {/* Retro Columns */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
            {columns.map((column) => (
              <div
                key={column.key}
                className={`flex flex-col rounded-xl border-2 ${getBorderColor(column.color)} overflow-hidden`}
                style={surfaceStyles}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 ${getHeaderColor(column.color)} flex items-center gap-2`}>
                  <span className="material-symbols-outlined text-[20px]">{column.icon}</span>
                  <h3 className="font-bold text-sm">{column.title}</h3>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-4">
                  <textarea
                    value={retro[column.key as keyof RetroData]}
                    onChange={(e) => setRetro({ ...retro, [column.key]: e.target.value })}
                    onBlur={handleBlur}
                    placeholder={column.placeholder}
                    className="w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 rounded-xl border p-4" style={surfaceStyles}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">tips_and_updates</span>
              <div>
                <h4 className="font-semibold text-sm" style={textPrimary}>Retrospective Tips</h4>
                <ul className="mt-2 text-sm space-y-1" style={textSecondary}>
                  <li>Focus on specific, actionable feedback</li>
                  <li>Keep action items measurable and assignable</li>
                  <li>Changes auto-save when you click outside a text area</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
