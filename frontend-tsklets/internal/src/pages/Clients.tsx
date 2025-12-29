import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { UserManagementModal, ProductSelector } from '@tsklets/ui'

interface Client {
  id: number
  name: string
  domain: string | null
  type: 'owner' | 'customer' | 'partner'
  tier: 'enterprise' | 'business' | 'starter'
  gatekeeperEnabled: boolean
  isActive: boolean
  createdAt: string
  products?: Array<{ id: number; name: string }>
}

interface Product {
  id: number
  name: string
  description: string | null
}

const tierColors: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  business: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  starter: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600',
}

const typeConfig: Record<string, { label: string; className: string; icon: string }> = {
  owner: { label: 'Owner', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', icon: 'star' },
  customer: { label: 'Customer', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: 'business' },
  partner: { label: 'Partner', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'handshake' },
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userModalClient, setUserModalClient] = useState<Client | null>(null)
  const { token } = useAuthStore()

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [domain, setDomain] = useState('')
  const [clientType, setClientType] = useState<'owner' | 'customer' | 'partner'>('customer')
  const [tier, setTier] = useState<'enterprise' | 'business' | 'starter'>('starter')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClients()
    fetchProducts()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Failed to fetch clients', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error('Failed to fetch products', err)
    }
  }

  const fetchClientProducts = async (clientId: number) => {
    try {
      const res = await fetch(`/api/products/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setSelectedProducts(data.map((p: Product) => p.id))
    } catch (err) {
      console.error('Failed to fetch client products', err)
    }
  }

  const resetForm = () => {
    setCompanyName('')
    setDomain('')
    setClientType('customer')
    setTier('starter')
    setSelectedProducts([])
    setAdminEmail('')
    setAdminName('')
    setError('')
    setEditingClient(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = async (client: Client) => {
    setEditingClient(client)
    setCompanyName(client.name)
    setDomain(client.domain || '')
    setClientType(client.type || 'customer')
    setTier(client.tier)
    await fetchClientProducts(client.id)
    setShowModal(true)
  }

  const openUserModal = (client: Client) => {
    setUserModalClient(client)
    setShowUserModal(true)
  }

  const toggleClientActive = async (client: Client) => {
    try {
      const res = await fetch(`/api/clients/${client.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchClients()
      }
    } catch (err) {
      console.error('Toggle client error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (editingClient) {
        // Update existing client
        const clientRes = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: companyName, domain: domain || null, type: clientType, tier }),
        })

        if (!clientRes.ok) {
          const data = await clientRes.json()
          throw new Error(data.error || 'Failed to update client')
        }

        // Update product assignments
        await fetch(`/api/products/client/${editingClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds: selectedProducts }),
        })
      } else {
        // Create new client
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: companyName, domain: domain || null, type: clientType, tier }),
        })

        if (!clientRes.ok) {
          const data = await clientRes.json()
          throw new Error(data.error || 'Failed to create client')
        }

        const { client } = await clientRes.json()

        // Assign products
        if (selectedProducts.length > 0) {
          await fetch('/api/products/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              clientId: client.id,
              productIds: selectedProducts,
            }),
          })
        }

        // Create admin user
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: adminEmail,
            name: adminName,
            role: 'company_admin',
            clientId: client.id,
          }),
        })

        if (!userRes.ok) {
          const data = await userRes.json()
          throw new Error(data.error || 'Failed to create admin user')
        }
      }

      // Success
      setShowModal(false)
      resetForm()
      fetchClients()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background-light">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b flex items-center justify-between shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Clients</h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Client
          </button>
        </header>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <table className="w-full">
                <thead className="border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Type</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Domain</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Tier</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Products</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!client.isActive ? 'opacity-50' : ''}`}
                      style={!client.isActive ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-sm">
                            {client.name.charAt(0)}
                          </div>
                          <button
                            onClick={() => openEditModal(client)}
                            className="font-medium text-primary hover:text-blue-700 hover:underline"
                          >
                            {client.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const cfg = typeConfig[client.type] || typeConfig.customer
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${cfg.className}`}>
                              <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {client.domain || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${tierColors[client.tier]}`}>
                          {client.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {client.products && client.products.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {client.products.map((product) => (
                              <span
                                key={product.id}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              >
                                {product.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No products</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleClientActive(client)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            client.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                          title={client.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              client.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openUserModal(client)}
                            className="text-slate-500 dark:text-slate-400 hover:text-primary"
                            title="Manage Users"
                          >
                            <span className="material-symbols-outlined">group</span>
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="text-slate-500 dark:text-slate-400 hover:text-primary"
                            title="Edit Client"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {clients.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No clients found</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {editingClient
                  ? `Client ID: ${editingClient.id}`
                  : 'Onboard a new client company'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 border rounded-lg text-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-bg)', color: 'var(--error-text)' }}>
                  {error}
                </div>
              )}

              {/* Company Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined text-[18px]">business</span>
                  Company Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${companyName ? 'text-green-600' : 'text-red-500'}`}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                      required
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Enter the client company name</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Domain</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                      placeholder="e.g., acme.com"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Email domain for user matching</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Client Type</label>
                    <select
                      value={clientType}
                      onChange={(e) => setClientType(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <option value="customer">Customer</option>
                      <option value="partner">Partner</option>
                      <option value="owner">Owner</option>
                    </select>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Owner = tenant company, Customer = paying client</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <option value="starter">Starter</option>
                      <option value="business">Business</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  Products
                </h4>
                <ProductSelector
                  products={products}
                  selectedIds={selectedProducts}
                  onChange={setSelectedProducts}
                  placeholder="Select products for this client..."
                />
              </div>

              {/* Admin User - only for new clients */}
              {!editingClient && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Admin User
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${adminName ? 'text-green-600' : 'text-red-500'}`}>
                        Admin Name *
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                        required
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Company admin name</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${adminEmail ? 'text-green-600' : 'text-red-500'}`}>
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20" style={{ borderColor: 'var(--border-primary)' }}
                        required
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Client admin email ID</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">Note:</span> An email will be sent to verify this email address.
                      Default password: <span className="font-mono font-medium">Systech@123</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="px-4 py-2 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingClient ? 'Save Changes' : 'Create Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {userModalClient && (
        <UserManagementModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          client={userModalClient}
          token={token!}
          showResetPassword={true}
          isInternal={true}
          maxProducts={2}
        />
      )}
    </div>
  )
}
