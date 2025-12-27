import { useNavigate } from 'react-router-dom'

interface TenantCardProps {
  tenant: {
    id: number
    name: string
    tier: 'enterprise' | 'business' | 'starter'
    isActive: boolean
    userCount: number
    ticketCount: number
  }
}

const tierColors: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  business: 'bg-blue-100 text-blue-700 border-blue-200',
  starter: 'bg-slate-100 text-slate-700 border-slate-200',
}

const gradients = [
  'from-blue-50 to-indigo-50',
  'from-orange-50 to-red-50',
  'from-gray-50 to-gray-100',
  'from-emerald-50 to-teal-50',
  'from-cyan-50 to-sky-50',
  'from-fuchsia-50 to-pink-50',
]

export default function TenantCard({ tenant }: TenantCardProps) {
  const navigate = useNavigate()
  const gradient = gradients[tenant.id % gradients.length]

  return (
    <div
      className="group rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
    >
      {/* Header with gradient */}
      <div className={`h-24 bg-gradient-to-r ${gradient} relative`}>
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
            tenant.isActive
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-red-100 text-red-800 border-red-200'
          }`}>
            {tenant.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col">
        {/* Logo placeholder */}
        <div className="relative -mt-10 mb-3">
          <div
            className="size-16 rounded-xl p-1 shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div
              className="w-full h-full rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-xl border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
            >
              {tenant.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Tenant name */}
        <div className="flex items-center gap-2 mb-1">
          <h3
            className="text-lg font-bold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {tenant.name}
          </h3>
        </div>

        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${tierColors[tenant.tier]}`}>
            {tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1)}
          </span>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-4 py-4 border-t mb-4"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="flex flex-col gap-1">
            <span
              className="text-xs uppercase font-semibold tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Users
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ color: 'var(--text-muted)' }}
              >
                group
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {tenant.userCount}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span
              className="text-xs uppercase font-semibold tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Tickets
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ color: 'var(--text-muted)' }}
              >
                confirmation_number
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {tenant.ticketCount}
              </span>
            </div>
          </div>
        </div>

        {/* Configure button */}
        <div className="mt-auto">
          <button
            onClick={() => navigate('/clients')}
            className="w-full flex items-center justify-center gap-2 rounded-lg border bg-transparent py-2 px-4 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Configure
          </button>
        </div>
      </div>
    </div>
  )
}
