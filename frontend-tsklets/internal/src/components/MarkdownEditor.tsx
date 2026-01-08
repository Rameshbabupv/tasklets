import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  height?: number
}

export default function MarkdownEditor({ value, onChange, label, placeholder = 'Enter markdown...', height = 200 }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
        {!showPreview ? (
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm leading-relaxed"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', height: `${height}px` }}
            />
            <div className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              Markdown supported
            </div>
          </div>
        ) : (
          <div
            className="p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', minHeight: `${height}px` }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="italic" style={{ color: 'var(--text-secondary)' }}>No content</p>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="mt-2 text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="material-symbols-outlined text-[16px]">
          {showPreview ? 'edit' : 'visibility'}
        </span>
        {showPreview ? 'Edit Mode' : 'Preview Mode'}
      </button>
    </div>
  )
}
