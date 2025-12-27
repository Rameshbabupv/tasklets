import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth'
import ImageModal from './ImageModal'

interface Product {
  id: number
  name: string
  description: string | null
}

interface NewTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
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
    if (!isOpen) return

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
              setForm((prev) => ({ ...prev, productId: userProducts[0].id }))
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
        toast.error('Failed to load products')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [isOpen, user?.id, user?.tenantId, token])

  // Create and cleanup preview URLs
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        title: '',
        description: '',
        productId: products.length === 1 ? products[0].id : 0,
        clientPriority: 3,
        clientSeverity: 3,
      })
      setSelectedFiles([])
      setPreviewUrls([])
    }
  }, [isOpen, products])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPG, PNG, GIF, and SVG are allowed.`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File too large. Maximum size is 5MB.`)
        return false
      }
      return true
    })

    if (selectedFiles.length + validFiles.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }

    setSelectedFiles([...selectedFiles, ...validFiles])
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
      toast.error('Please select a product')
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
          toast.warning('Ticket created but some attachments failed to upload')
        }
      }

      toast.success('🎫 Ticket created successfully!')
      onClose()
      navigate(`/tickets/${ticketId}`)
    } catch (err) {
      console.error('Failed to create ticket:', err)
      toast.error('Failed to create ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.3 }}
                style={{ backgroundColor: 'var(--bg-card)' }}
                className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div style={{ borderBottomColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }} className="px-6 py-4 border-b bg-gradient-to-r from-white to-purple-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-xl" aria-hidden="true">confirmation_number</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                          New Support Ticket
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Submit a new issue to our team</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      style={{ color: 'var(--text-muted)' }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </motion.button>
                  </div>
                </div>

                {/* Form Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <form onSubmit={handleSubmit} id="new-ticket-form" className="space-y-6">
                    {/* Subject */}
                    <div>
                      <label htmlFor="title" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                        Subject *
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Briefly summarize the issue (e.g. Login page timeout)"
                        required
                        style={{
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-primary)'
                        }}
                        className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Please provide detailed steps to reproduce the issue..."
                        rows={5}
                        style={{
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-primary)'
                        }}
                        className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    {/* Product */}
                    <div>
                      <label htmlFor="product" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                        Product *
                      </label>
                      {loadingProducts ? (
                        <div style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }} className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset text-sm">
                          Loading products...
                        </div>
                      ) : products.length === 0 ? (
                        <div className="block w-full rounded-lg border-0 py-3 px-4 text-red-600 ring-1 ring-inset ring-red-300 bg-red-50 text-sm">
                          No products available. Please contact support.
                        </div>
                      ) : (
                        <select
                          id="product"
                          value={form.productId}
                          onChange={(e) => setForm({ ...form, productId: parseInt(e.target.value) })}
                          required
                          disabled={products.length === 1}
                          style={{
                            color: 'var(--text-primary)',
                            backgroundColor: products.length === 1 ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                            borderColor: 'var(--border-primary)'
                          }}
                          className={`block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm ${
                            products.length === 1 ? 'cursor-not-allowed' : ''
                          }`}
                        >
                          <option value={0}>Select a product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} {product.description ? `- ${product.description}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {products.length === 1 && (
                        <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-1">
                          ℹ️ Auto-selected based on your account
                        </p>
                      )}
                    </div>

                    {/* Priority & Severity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="priority" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                          Priority
                        </label>
                        <select
                          id="priority"
                          value={form.clientPriority}
                          onChange={(e) => setForm({ ...form, clientPriority: parseInt(e.target.value) })}
                          style={{
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)'
                          }}
                          className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm"
                        >
                          <option value={1}>P1 - Critical</option>
                          <option value={2}>P2 - High</option>
                          <option value={3}>P3 - Medium</option>
                          <option value={4}>P4 - Low</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="severity" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">
                          Severity
                        </label>
                        <select
                          id="severity"
                          value={form.clientSeverity}
                          onChange={(e) => setForm({ ...form, clientSeverity: parseInt(e.target.value) })}
                          style={{
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)'
                          }}
                          className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm"
                        >
                          <option value={1}>S1 - Critical</option>
                          <option value={2}>S2 - Major</option>
                          <option value={3}>S3 - Minor</option>
                          <option value={4}>S4 - Cosmetic</option>
                        </select>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-2">Attachments</label>
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
                        style={{ borderColor: 'var(--border-primary)' }}
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-all"
                      >
                        <span style={{ color: 'var(--text-muted)' }} className="material-symbols-outlined text-3xl mb-2" aria-hidden="true">cloud_upload</span>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">Click to upload</p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">PNG, JPG, GIF, SVG (max. 5 files, 5MB each)</p>
                      </div>

                      {/* Selected Files */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div
                                onClick={() => setModalImage({ url: previewUrls[index], name: file.name, size: file.size })}
                                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                                className="aspect-square rounded-lg overflow-hidden border-2 cursor-pointer hover:border-primary transition-colors"
                              >
                                <img src={previewUrls[index]} alt={file.name} className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
                              </button>
                              <p style={{ color: 'var(--text-secondary)' }} className="text-xs truncate mt-1" title={file.name}>
                                {file.name}
                              </p>
                              <p style={{ color: 'var(--text-muted)' }} className="text-xs">{formatFileSize(file.size)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div style={{ borderTopColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }} className="px-6 py-4 border-t flex items-center justify-end gap-3">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ color: 'var(--text-secondary)' }}
                    className="px-4 py-2.5 text-sm font-semibold hover:bg-white rounded-lg transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    form="new-ticket-form"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">send</span>
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          fileName={modalImage.name}
          fileSize={modalImage.size}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  )
}
