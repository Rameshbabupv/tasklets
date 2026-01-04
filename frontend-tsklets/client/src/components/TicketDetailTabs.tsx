import { useState } from 'react'
import { motion } from 'framer-motion'
import TicketChangelog from './TicketChangelog'

interface Tab {
  id: string
  label: string
  icon: string
  badge?: number
}

interface TicketDetailTabsProps {
  ticketId: string
  detailsContent: React.ReactNode
  commentCount?: number
  attachmentCount?: number
}

export default function TicketDetailTabs({
  ticketId,
  detailsContent,
  commentCount = 0,
  attachmentCount = 0,
}: TicketDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('details')

  const tabs: Tab[] = [
    {
      id: 'details',
      label: 'Details',
      icon: 'description',
      badge: commentCount + attachmentCount > 0 ? commentCount + attachmentCount : undefined,
    },
    {
      id: 'changelog',
      label: 'Changelog',
      icon: 'history',
    },
  ]

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
      {/* Tab Header */}
      <div className="relative border-b" style={{ borderColor: 'var(--border-primary)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50" />

        {/* Tabs */}
        <div className="relative flex gap-1 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                    style={{ borderColor: 'var(--border-primary)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}

                {/* Tab content */}
                <span className="relative flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`
                      min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold
                      ${isActive
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }
                    `}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {detailsContent}
          </motion.div>
        )}

        {activeTab === 'changelog' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TicketChangelog ticketId={ticketId} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
