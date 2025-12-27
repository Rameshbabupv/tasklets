import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'

interface Product {
  id: number
  name: string
  description: string | null
  createdAt: string
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('products-view-mode') as 'card' | 'list') || 'card'
  })
  const { token } = useAuthStore()

  const toggleViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('products-view-mode', mode)
  }

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }
  const textPrimary = { color: 'var(--text-primary)' }
  const textSecondary = { color: 'var(--text-secondary)' }
  const textMuted = { color: 'var(--text-muted)' }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setError('')
    setEditingProduct(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setDescription(product.description || '')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (editingProduct) {
        // Update existing product
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update product')
        }
      } else {
        // Create new product
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create product')
        }
      }

      // Success
      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
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
          <h2 className="text-lg font-bold" style={textPrimary}>Products</h2>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg border" style={{ borderColor: 'var(--border-primary)' }}>
              <button
                onClick={() => toggleViewMode('card')}
                className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : ''}`}
                style={viewMode !== 'card' ? textMuted : {}}
                title="Card view"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => toggleViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : ''}`}
                style={viewMode !== 'list' ? textMuted : {}}
                title="List view"
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={textSecondary}>Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12" style={textMuted}>
              No products found. Click "Add Product" to create one.
            </div>
          ) : viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
                  style={surfaceStyles}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="size-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <button
                      onClick={() => openEditModal(product)}
                      className="hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      style={textMuted}
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </div>
                  <h3 className="font-semibold mb-1" style={textPrimary}>{product.name}</h3>
                  <p className="text-sm line-clamp-2 mb-3" style={textSecondary}>
                    {product.description || 'No description'}
                  </p>
                  <Link
                    to={`/products/${product.id}/dashboard`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    View Dashboard
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="rounded-xl border overflow-hidden" style={surfaceStyles}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <th className="text-left px-4 py-3 text-sm font-semibold" style={textSecondary}>Product</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold hidden md:table-cell" style={textSecondary}>Description</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold" style={textSecondary}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0 hover:bg-primary/5 transition-colors group"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                          </div>
                          <span className="font-medium" style={textPrimary}>{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm line-clamp-1" style={textSecondary}>
                          {product.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                            style={textMuted}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <Link
                            to={`/products/${product.id}/dashboard`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">dashboard</span>
                            Dashboard
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl w-full max-w-md mx-4" style={surfaceStyles}>
            <div className="p-6 border-b" style={surfaceStyles}>
              <h3 className="text-lg font-bold" style={textPrimary}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-sm mt-1" style={textSecondary}>
                {editingProduct ? 'Update product details' : 'Create a new product offering'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <label className={`block text-sm font-medium mb-1 ${name ? 'text-green-600' : 'text-red-500'}`}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field text-sm py-2"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                  placeholder="e.g., HRM, Payroll, Attendance"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={textSecondary}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field text-sm py-2 resize-none"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                  rows={3}
                  placeholder="Brief description of the product"
                />
              </div>

              {/* Actions */}
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
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
