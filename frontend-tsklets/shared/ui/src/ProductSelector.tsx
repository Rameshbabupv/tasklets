import { useState, useRef, useEffect } from 'react'

interface Product {
  id: number
  name: string
  description?: string | null
}

interface ProductSelectorProps {
  products: Product[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  maxProducts?: number
  placeholder?: string
  label?: string
  disabled?: boolean
}

// Extract category from product name (e.g., "CRM Sales" -> "CRM", "HRM v2" -> "HRM")
const getCategory = (name: string): string => {
  const match = name.match(/^([A-Z]+)/i)
  if (match) {
    const prefix = match[1].toUpperCase()
    // Group common categories
    if (['CRM', 'HRM', 'MMS', 'TMS', 'SDMS', 'EXIM'].includes(prefix)) {
      return prefix
    }
    if (name.toLowerCase().includes('finance')) return 'Finance'
    if (name.toLowerCase().includes('tasklet')) return 'Tasklets'
  }
  return 'Other'
}

// Group products by category
const groupProducts = (products: Product[]): Record<string, Product[]> => {
  const groups: Record<string, Product[]> = {}

  products.forEach(product => {
    const category = getCategory(product.name)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(product)
  })

  // Sort categories alphabetically, but put "Other" last
  const sortedGroups: Record<string, Product[]> = {}
  Object.keys(groups)
    .sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })
    .forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
    })

  return sortedGroups
}

export function ProductSelector({
  products,
  selectedIds,
  onChange,
  maxProducts = 0,
  placeholder = 'Select products...',
  label,
  disabled = false,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const selectedProducts = products.filter(p => selectedIds.includes(p.id))
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const groupedProducts = groupProducts(filteredProducts)
  const isMaxReached = maxProducts > 0 && selectedIds.length >= maxProducts

  const handleToggle = (productId: number) => {
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter(id => id !== productId))
    } else if (!isMaxReached) {
      onChange([...selectedIds, productId])
    }
  }

  const handleRemove = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter(id => id !== productId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {maxProducts > 0 && (
            <span className="ml-1 text-xs font-normal opacity-70">
              (max {maxProducts})
            </span>
          )}
        </label>
      )}

      {/* Trigger / Selected chips container */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`
          min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
          ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-400' : ''}
        `}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: isOpen ? 'var(--primary, #3b82f6)' : 'var(--border-primary)'
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {selectedProducts.length === 0 ? (
            <span className="text-sm py-0.5" style={{ color: 'var(--text-muted)' }}>
              {placeholder}
            </span>
          ) : (
            <>
              {selectedProducts.map(product => (
                <span
                  key={product.id}
                  className="
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                    bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300
                    transition-colors group
                  "
                >
                  {product.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(product.id, e)}
                      className="
                        ml-0.5 rounded-full p-0.5 -mr-1
                        hover:bg-blue-200 dark:hover:bg-blue-500/30
                        opacity-60 group-hover:opacity-100 transition-opacity
                      "
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </span>
              ))}
            </>
          )}

          {/* Dropdown indicator */}
          <span
            className={`
              material-symbols-outlined text-[18px] ml-auto transition-transform
              ${isOpen ? 'rotate-180' : ''}
            `}
            style={{ color: 'var(--text-muted)' }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Dropdown panel */}
      {isOpen && !disabled && (
        <div
          className="
            absolute z-50 left-0 right-0 mt-1 rounded-lg border shadow-lg
            overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150
          "
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)'
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="p-2 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]"
                style={{ color: 'var(--text-muted)' }}
              >
                search
              </span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="
                  w-full pl-9 pr-3 py-2 text-sm rounded-md border-0
                  bg-slate-100 dark:bg-slate-800
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30
                "
                style={{ color: 'var(--text-primary)' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--text-muted)' }}>
                    close
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Max limit indicator */}
          {isMaxReached && (
            <div
              className="px-3 py-2 text-xs font-medium border-b flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              <span className="material-symbols-outlined text-[14px] text-amber-500">info</span>
              Maximum {maxProducts} products selected
            </div>
          )}

          {/* Grouped product list */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {Object.keys(groupedProducts).length === 0 ? (
              <div className="px-3 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No products found
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category}>
                  {/* Category header */}
                  <div
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sticky top-0"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {category}
                    <span className="ml-1 opacity-60">({categoryProducts.length})</span>
                  </div>

                  {/* Products in category */}
                  {categoryProducts.map(product => {
                    const isSelected = selectedIds.includes(product.id)
                    const isDisabled = !isSelected && isMaxReached

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => !isDisabled && handleToggle(product.id)}
                        disabled={isDisabled}
                        className={`
                          w-full px-3 py-2 text-left flex items-center gap-2 transition-colors
                          ${isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                          }
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : ''}
                        `}
                      >
                        {/* Checkbox indicator */}
                        <span
                          className={`
                            flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center
                            transition-colors
                            ${isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-300 dark:border-slate-600'
                            }
                          `}
                        >
                          {isSelected && (
                            <span className="material-symbols-outlined text-[12px] text-white font-bold">
                              check
                            </span>
                          )}
                        </span>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: isSelected ? 'var(--primary, #3b82f6)' : 'var(--text-primary)' }}
                          >
                            {product.name}
                          </div>
                          {product.description && (
                            <div
                              className="text-xs truncate"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {product.description}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer with selection count */}
          <div
            className="px-3 py-2 border-t text-xs flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            <span>
              {selectedIds.length} selected
              {maxProducts > 0 && ` of ${maxProducts}`}
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
