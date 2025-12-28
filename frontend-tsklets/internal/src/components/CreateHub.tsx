import { motion, AnimatePresence } from 'framer-motion'
import { useCreateHub } from '../store/createHub'
import QuickMode from './CreateHub/QuickMode'
import FlowMode from './CreateHub/FlowMode'
import CreateForm from './CreateHub/CreateForm'

export default function CreateHub() {
  const { isOpen, mode, selectedType, close, setMode } = useCreateHub()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-4xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass morphism card */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">

                {/* Header with mode toggle */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 bg-clip-text text-transparent">
                        Create New
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        ⌘K to quick create
                      </p>
                    </div>
                  </div>

                  {/* Mode toggle */}
                  {!selectedType && (
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        onClick={() => setMode('quick')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          mode === 'quick'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ⚡ Quick
                      </button>
                      <button
                        onClick={() => setMode('flow')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          mode === 'flow'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        🗺️ Flow
                      </button>
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={close}
                    className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Content area with animated transitions */}
                <div className="relative min-h-[500px]">
                  <AnimatePresence mode="wait">
                    {selectedType ? (
                      <CreateForm key="form" type={selectedType} />
                    ) : mode === 'quick' ? (
                      <QuickMode key="quick" />
                    ) : (
                      <FlowMode key="flow" />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
