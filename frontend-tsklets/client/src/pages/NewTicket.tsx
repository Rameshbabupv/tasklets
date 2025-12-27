import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import ImageModal from '../components/ImageModal'

interface Product {
  id: number
  name: string
  description: string | null
}

export default function NewTicket() {
  const { token, user } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [modalImage, setModalImage] = useState<{ url: string; name: string; size: number } | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    productId: 0,
    clientPriority: 3,
    clientSeverity: 3,
  })

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id || !user?.tenantId || !token) return

      try {
        // First try to fetch user's assigned products
        const userProductsRes = await fetch(`/api/users/${user.id}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (userProductsRes.ok) {
          const userProducts = await userProductsRes.json()

          // If user has assigned products, use those
          if (userProducts.length > 0) {
            setProducts(userProducts)

            // If only 1 product, auto-select it
            if (userProducts.length === 1) {
              setForm({ ...form, productId: userProducts[0].id })
            }

            setLoadingProducts(false)
            return
          }
        }

        // Fallback: fetch all tenant products if user has no assigned products
        const res = await fetch(`/api/products/tenant/${user.tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Failed to fetch products')

        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [user?.id, user?.tenantId, token])

  // Create and cleanup preview URLs
  useEffect(() => {
    // Create preview URLs
    const urls = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)

    // Cleanup function to revoke URLs
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Only JPG, PNG, GIF, and SVG are allowed.`)
        return false
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}: File too large. Maximum size is 5MB.`)
        return false
      }
      return true
    })

    // Check total count
    if (selectedFiles.length + validFiles.length > 5) {
      alert('Maximum 5 files allowed')
      return
    }

    setSelectedFiles([...selectedFiles, ...validFiles])
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.productId || form.productId === 0) {
      alert('Please select a product')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create ticket
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to create ticket')

      const data = await res.json()
      const ticketId = data.ticket.id

      // Step 2: Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        const uploadRes = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!uploadRes.ok) {
          console.error('Failed to upload attachments')
          // Continue anyway - ticket was created
        }
      }

      navigate(`/tickets/${ticketId}`)
    } catch (err) {
      console.error('Failed to create ticket:', err)
      alert('Failed to create ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header
        className="border-b"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Support Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Support Ticket</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Submit a new issue to our engineering team.</p>
          </div>
          <Link to="/" className="text-primary hover:text-blue-600">
            Cancel
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border shadow-card p-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Briefly summarize the issue (e.g. Login page timeout)"
              required
              className="input-field py-3 text-sm"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
              }}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Please provide detailed steps to reproduce the issue..."
              rows={6}
              className="input-field py-3 text-sm"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
              }}
            />
          </div>

          {/* Product */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Product *</label>
            {loadingProducts ? (
              <div
                className="block w-full rounded-lg border py-3 px-4 text-sm"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div
                className="block w-full rounded-lg border py-3 px-4 text-sm"
                style={{
                  backgroundColor: 'var(--error-bg)',
                  borderColor: 'var(--error-text)',
                  color: 'var(--error-text)',
                }}
              >
                No products available. Please contact support.
              </div>
            ) : (
              <>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: parseInt(e.target.value) })}
                  required
                  disabled={products.length === 1}
                  className={`input-field py-3 text-sm ${products.length === 1 ? 'cursor-not-allowed' : ''}`}
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: products.length === 1 ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  <option value={0}>Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.description ? `- ${product.description}` : ''}
                    </option>
                  ))}
                </select>
                {products.length === 1 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    ℹ️ Auto-selected based on your account
                  </p>
                )}
              </>
            )}
          </div>

          {/* Priority & Severity */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Priority</label>
              <select
                value={form.clientPriority}
                onChange={(e) => setForm({ ...form, clientPriority: parseInt(e.target.value) })}
                className="input-field py-3 text-sm"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <option value={1}>P1 - Critical - Business blocked</option>
                <option value={2}>P2 - High - Major impact</option>
                <option value={3}>P3 - Medium - Workaround exists</option>
                <option value={4}>P4 - Low - Minor issue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Severity</label>
              <select
                value={form.clientSeverity}
                onChange={(e) => setForm({ ...form, clientSeverity: parseInt(e.target.value) })}
                className="input-field py-3 text-sm"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <option value={1}>S1 - Critical - System down</option>
                <option value={2}>S2 - Major - Feature broken</option>
                <option value={3}>S3 - Minor - Degraded</option>
                <option value={4}>S4 - Cosmetic - Visual glitch</option>
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Attachments</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/svg+xml"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-muted)' }}>cloud_upload</span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to upload</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SVG, PNG, JPG or GIF (max. 5 files, 5MB each)</p>
            </div>

            {/* Selected Files - Thumbnail Grid */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {/* Thumbnail */}
                    <div
                      onClick={() => setModalImage({ url: previewUrls[index], name: file.name, size: file.size })}
                      className="aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                      }}
                    >
                      <img
                        src={previewUrls[index]}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>

                    {/* File info */}
                    <div className="mt-1">
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-4 pt-4 border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          fileName={modalImage.name}
          fileSize={modalImage.size}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
