import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { toast } from 'sonner'

interface Product {
  id: number
  name: string
  code: string
  description: string | null
  defaultImplementorId: number | null
  defaultDeveloperId: number | null
  defaultTesterId: number | null
}

interface User {
  id: number
  name: string
  email: string
}

interface Module {
  id: number
  productId: number
  name: string
  description: string | null
}

interface Component {
  id: number
  moduleId: number
  name: string
  description: string | null
}

interface Addon {
  id: number
  productId: number
  name: string
  description: string | null
}

interface ProductModalProps {
  product: Product | null
  onClose: () => void
  onSave: () => void
}

type TabId = 'general' | 'modules' | 'addons' | 'team'

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'info' },
  { id: 'modules', label: 'Modules', icon: 'view_module' },
  { id: 'addons', label: 'Addons', icon: 'extension' },
  { id: 'team', label: 'Team', icon: 'group' },
]

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const { token } = useAuthStore()
  const [isClosing, setIsClosing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [saving, setSaving] = useState(false)

  // General tab state
  const [name, setName] = useState(product?.name || '')
  const [code, setCode] = useState(product?.code || '')
  const [description, setDescription] = useState(product?.description || '')

  // Team tab state
  const [internalUsers, setInternalUsers] = useState<User[]>([])
  const [defaultImplementorId, setDefaultImplementorId] = useState<number | ''>(product?.defaultImplementorId || '')
  const [defaultDeveloperId, setDefaultDeveloperId] = useState<number | ''>(product?.defaultDeveloperId || '')
  const [defaultTesterId, setDefaultTesterId] = useState<number | ''>(product?.defaultTesterId || '')

  // Modules tab state
  const [modules, setModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [moduleComponents, setModuleComponents] = useState<Record<number, Component[]>>({})
  const [editingModule, setEditingModule] = useState<number | null>(null)
  const [editingModuleName, setEditingModuleName] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const [editingComponent, setEditingComponent] = useState<{ moduleId: number; componentId: number } | null>(null)
  const [editingComponentName, setEditingComponentName] = useState('')
  const [addingComponentTo, setAddingComponentTo] = useState<number | null>(null)
  const [newComponentName, setNewComponentName] = useState('')

  // Addons tab state
  const [addons, setAddons] = useState<Addon[]>([])
  const [editingAddon, setEditingAddon] = useState<number | null>(null)
  const [editingAddonName, setEditingAddonName] = useState('')
  const [addingAddon, setAddingAddon] = useState(false)
  const [newAddonName, setNewAddonName] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    loadData()

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const loadData = async () => {
    // Load internal users for Team tab (systech.com users)
    try {
      const res = await fetch('/api/users/internal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setInternalUsers(data || [])
    } catch (err) {
      console.error('Failed to fetch users', err)
    }

    // Load modules and addons if editing existing product
    if (product?.id) {
      try {
        const [modulesRes, addonsRes] = await Promise.all([
          fetch(`/api/products/${product.id}/modules`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/products/${product.id}/addons`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const modulesData = await modulesRes.json()
        const addonsData = await addonsRes.json()
        setModules(modulesData || [])
        setAddons(addonsData || [])
      } catch (err) {
        console.error('Failed to fetch product data', err)
      }
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 200)
  }

  // Toggle module expansion and load components
  const toggleModule = async (moduleId: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
      // Load components if not already loaded
      if (!moduleComponents[moduleId]) {
        try {
          const res = await fetch(`/api/products/modules/${moduleId}/components`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()
          setModuleComponents(prev => ({ ...prev, [moduleId]: data || [] }))
        } catch (err) {
          console.error('Failed to fetch components', err)
        }
      }
    }
    setExpandedModules(newExpanded)
  }

  // Module CRUD
  const handleAddModule = async () => {
    if (!newModuleName.trim() || !product?.id) return
    try {
      const res = await fetch(`/api/products/${product.id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newModuleName.trim() }),
      })
      if (res.ok) {
        const newModule = await res.json()
        setModules([...modules, newModule])
        setNewModuleName('')
        setAddingModule(false)
        toast.success('Module added')
      }
    } catch (err) {
      toast.error('Failed to add module')
    }
  }

  const handleUpdateModule = async (moduleId: number) => {
    if (!editingModuleName.trim()) return
    try {
      const res = await fetch(`/api/products/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingModuleName.trim() }),
      })
      if (res.ok) {
        setModules(modules.map(m => m.id === moduleId ? { ...m, name: editingModuleName.trim() } : m))
        setEditingModule(null)
        toast.success('Module updated')
      }
    } catch (err) {
      toast.error('Failed to update module')
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm('Delete this module and all its components?')) return
    try {
      const res = await fetch(`/api/products/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setModules(modules.filter(m => m.id !== moduleId))
        toast.success('Module deleted')
      }
    } catch (err) {
      toast.error('Failed to delete module')
    }
  }

  // Component CRUD
  const handleAddComponent = async (moduleId: number) => {
    if (!newComponentName.trim()) return
    try {
      const res = await fetch(`/api/products/modules/${moduleId}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newComponentName.trim() }),
      })
      if (res.ok) {
        const newComponent = await res.json()
        setModuleComponents(prev => ({
          ...prev,
          [moduleId]: [...(prev[moduleId] || []), newComponent],
        }))
        setNewComponentName('')
        setAddingComponentTo(null)
        toast.success('Component added')
      }
    } catch (err) {
      toast.error('Failed to add component')
    }
  }

  const handleUpdateComponent = async (moduleId: number, componentId: number) => {
    if (!editingComponentName.trim()) return
    try {
      const res = await fetch(`/api/products/components/${componentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingComponentName.trim() }),
      })
      if (res.ok) {
        setModuleComponents(prev => ({
          ...prev,
          [moduleId]: (prev[moduleId] || []).map(c =>
            c.id === componentId ? { ...c, name: editingComponentName.trim() } : c
          ),
        }))
        setEditingComponent(null)
        toast.success('Component updated')
      }
    } catch (err) {
      toast.error('Failed to update component')
    }
  }

  const handleDeleteComponent = async (moduleId: number, componentId: number) => {
    try {
      const res = await fetch(`/api/products/components/${componentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setModuleComponents(prev => ({
          ...prev,
          [moduleId]: (prev[moduleId] || []).filter(c => c.id !== componentId),
        }))
        toast.success('Component deleted')
      }
    } catch (err) {
      toast.error('Failed to delete component')
    }
  }

  // Addon CRUD
  const handleAddAddon = async () => {
    if (!newAddonName.trim() || !product?.id) return
    try {
      const res = await fetch(`/api/products/${product.id}/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newAddonName.trim() }),
      })
      if (res.ok) {
        const newAddon = await res.json()
        setAddons([...addons, newAddon])
        setNewAddonName('')
        setAddingAddon(false)
        toast.success('Addon added')
      }
    } catch (err) {
      toast.error('Failed to add addon')
    }
  }

  const handleUpdateAddon = async (addonId: number) => {
    if (!editingAddonName.trim()) return
    try {
      const res = await fetch(`/api/products/addons/${addonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingAddonName.trim() }),
      })
      if (res.ok) {
        setAddons(addons.map(a => a.id === addonId ? { ...a, name: editingAddonName.trim() } : a))
        setEditingAddon(null)
        toast.success('Addon updated')
      }
    } catch (err) {
      toast.error('Failed to update addon')
    }
  }

  const handleDeleteAddon = async (addonId: number) => {
    try {
      const res = await fetch(`/api/products/addons/${addonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAddons(addons.filter(a => a.id !== addonId))
        toast.success('Addon deleted')
      }
    } catch (err) {
      toast.error('Failed to delete addon')
    }
  }

  // Save product (General + Team tabs)
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Product name is required')
      return
    }

    setSaving(true)
    try {
      const url = product?.id ? `/api/products/${product.id}` : '/api/products'
      const method = product?.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || null,
          defaultImplementorId: defaultImplementorId || null,
          defaultDeveloperId: defaultDeveloperId || null,
          defaultTesterId: defaultTesterId || null,
        }),
      })

      if (res.ok) {
        toast.success(product?.id ? 'Product updated' : 'Product created')
        onSave()
        handleClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save product')
      }
    } catch (err) {
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const isEditMode = !!product?.id

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        {/* Header Content */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-xl text-white">inventory_2</span>
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {isEditMode ? 'Edit Product' : 'New Product'}
              </h3>
              {isEditMode && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-mono font-medium text-violet-600 dark:text-violet-400">{product.code}</span>
                  <span className="mx-1.5">•</span>
                  {product.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 border-b flex gap-1" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
          {tabs.map((tab) => {
            // Disable Modules/Addons tabs for new products
            const disabled = !isEditMode && (tab.id === 'modules' || tab.id === 'addons')
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setActiveTab(tab.id)}
                disabled={disabled}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : disabled
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'hover:text-violet-500'
                  }`}
                style={{ color: activeTab === tab.id ? undefined : disabled ? undefined : 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-tab-in">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CRM Sales, HRM Core"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Code {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && <span className="font-normal text-slate-400 ml-1">(read-only)</span>}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CRM, HRM"
                  disabled={isEditMode}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Used for issue keys like CRM-B001
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the product..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-3 animate-tab-in">
              {modules.length === 0 && !addingModule && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-muted)' }}>view_module</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No modules yet</p>
                </div>
              )}

              {modules.map((module) => (
                <div
                  key={module.id}
                  className="border rounded-xl overflow-hidden"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  {/* Module Header */}
                  <div
                    className="group flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    style={{ backgroundColor: expandedModules.has(module.id) ? 'var(--bg-tertiary)' : undefined }}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span
                      className={`material-symbols-outlined text-lg transition-transform ${expandedModules.has(module.id) ? 'rotate-90' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      chevron_right
                    </span>

                    {editingModule === module.id ? (
                      <input
                        type="text"
                        value={editingModuleName}
                        onChange={(e) => setEditingModuleName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateModule(module.id)
                          if (e.key === 'Escape') setEditingModule(null)
                        }}
                        className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {module.name}
                      </span>
                    )}

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {editingModule === module.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateModule(module.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                          >
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                          <button
                            onClick={() => setEditingModule(null)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingModule(module.id)
                              setEditingModuleName(module.name)
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteModule(module.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Components List */}
                  {expandedModules.has(module.id) && (
                    <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                      {(moduleComponents[module.id] || []).map((comp) => (
                        <div
                          key={comp.id}
                          className="flex items-center gap-2 py-1.5 pl-6 group"
                        >
                          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-muted)' }}>subdirectory_arrow_right</span>

                          {editingComponent?.componentId === comp.id ? (
                            <input
                              type="text"
                              value={editingComponentName}
                              onChange={(e) => setEditingComponentName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateComponent(module.id, comp.id)
                                if (e.key === 'Escape') setEditingComponent(null)
                              }}
                              className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                              autoFocus
                            />
                          ) : (
                            <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {comp.name}
                            </span>
                          )}

                          <div className="flex items-center gap-0.5">
                            {editingComponent?.componentId === comp.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateComponent(module.id, comp.id)}
                                  className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                                >
                                  <span className="material-symbols-outlined text-base">check</span>
                                </button>
                                <button
                                  onClick={() => setEditingComponent(null)}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <span className="material-symbols-outlined text-base">close</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingComponent({ moduleId: module.id, componentId: comp.id })
                                    setEditingComponentName(comp.name)
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteComponent(module.id, comp.id)}
                                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add Component Form */}
                      {addingComponentTo === module.id ? (
                        <div className="flex items-center gap-2 py-1.5 pl-6">
                          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-muted)' }}>subdirectory_arrow_right</span>
                          <input
                            type="text"
                            value={newComponentName}
                            onChange={(e) => setNewComponentName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComponent(module.id)
                              if (e.key === 'Escape') {
                                setAddingComponentTo(null)
                                setNewComponentName('')
                              }
                            }}
                            placeholder="Component name..."
                            className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddComponent(module.id)}
                            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                          >
                            <span className="material-symbols-outlined text-base">check</span>
                          </button>
                          <button
                            onClick={() => {
                              setAddingComponentTo(null)
                              setNewComponentName('')
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingComponentTo(module.id)}
                          className="flex items-center gap-2 py-1.5 pl-6 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                          Add Component
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Module Form */}
              {addingModule ? (
                <div className="flex items-center gap-2 p-3 border rounded-xl" style={{ borderColor: 'var(--border-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-violet-500">view_module</span>
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddModule()
                      if (e.key === 'Escape') {
                        setAddingModule(false)
                        setNewModuleName('')
                      }
                    }}
                    placeholder="Module name..."
                    className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddModule}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                  </button>
                  <button
                    onClick={() => {
                      setAddingModule(false)
                      setNewModuleName('')
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingModule(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Module
                </button>
              )}
            </div>
          )}

          {/* Addons Tab */}
          {activeTab === 'addons' && (
            <div className="space-y-3 animate-tab-in">
              {addons.length === 0 && !addingAddon && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-muted)' }}>extension</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No addons yet</p>
                </div>
              )}

              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center gap-3 px-4 py-3 border rounded-xl group hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <span className="material-symbols-outlined text-lg text-orange-500">extension</span>

                  {editingAddon === addon.id ? (
                    <input
                      type="text"
                      value={editingAddonName}
                      onChange={(e) => setEditingAddonName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateAddon(addon.id)
                        if (e.key === 'Escape') setEditingAddon(null)
                      }}
                      className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {addon.name}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {editingAddon === addon.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateAddon(addon.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                        </button>
                        <button
                          onClick={() => setEditingAddon(null)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingAddon(addon.id)
                            setEditingAddonName(addon.name)
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAddon(addon.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Addon Form */}
              {addingAddon ? (
                <div className="flex items-center gap-3 px-4 py-3 border rounded-xl" style={{ borderColor: 'var(--border-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-orange-500">extension</span>
                  <input
                    type="text"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddAddon()
                      if (e.key === 'Escape') {
                        setAddingAddon(false)
                        setNewAddonName('')
                      }
                    }}
                    placeholder="Addon name..."
                    className="flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-violet-500"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddAddon}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                  </button>
                  <button
                    onClick={() => {
                      setAddingAddon(false)
                      setNewAddonName('')
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingAddon(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Addon
                </button>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-5 animate-tab-in">
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <span className="material-symbols-outlined text-lg text-blue-500 mt-0.5">info</span>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Set default team members for this product. These will pre-fill role assignments when creating dev tasks.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Default Implementor
                  <span className="font-normal text-slate-400 ml-1">(optional)</span>
                </label>
                <select
                  value={defaultImplementorId}
                  onChange={(e) => setDefaultImplementorId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select user...</option>
                  {internalUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Overall responsible for the task
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Default Developer
                  <span className="font-normal text-slate-400 ml-1">(optional)</span>
                </label>
                <select
                  value={defaultDeveloperId}
                  onChange={(e) => setDefaultDeveloperId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select user...</option>
                  {internalUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Writes the code
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Default Tester
                  <span className="font-normal text-slate-400 ml-1">(optional)</span>
                </label>
                <select
                  value={defaultTesterId}
                  onChange={(e) => setDefaultTesterId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select user...</option>
                  {internalUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Tests the fix
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                Save Product
              </>
            )}
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.98); }
        }
        @keyframes tabIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-out { animation: fadeOut 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.2s ease-out forwards; }
        .animate-tab-in { animation: tabIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
