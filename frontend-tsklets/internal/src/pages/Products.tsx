import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import ProductModal from '../components/ProductModal'

interface Product {
  id: number
  name: string
  code: string
  description: string | null
  defaultImplementorId: number | null
  defaultDeveloperId: number | null
  defaultTesterId: number | null
  createdAt: string
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('products-view-mode') as 'card' | 'list') || 'card'
  })
  const { token } = useAuthStore()

  const toggleViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('products-view-mode', mode)
  }

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

  const openAddModal = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleModalSave = () => {
    fetchProducts()
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

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
