import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'

interface Client {
  id: number
  name: string
  tier: 'enterprise' | 'business' | 'starter'
  gatekeeperEnabled: boolean
  isActive: boolean
  createdAt: string
}

interface Product {
  id: number
  name: string
  description: string | null
}

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt?: string
}

const tierColors: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  business: 'bg-blue-100 text-blue-700 border-blue-200',
  starter: 'bg-slate-100 text-slate-700 border-slate-200',
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
  const [clientUsers, setClientUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<'user' | 'company_admin'>('user')
  const [savingUser, setSavingUser] = useState(false)
  const [userError, setUserError] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [clientProducts, setClientProducts] = useState<Product[]>([])
  const [userSelectedProducts, setUserSelectedProducts] = useState<number[]>([])
  const { token } = useAuthStore()

  // Form state
  const [companyName, setCompanyName] = useState('')
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

  const toggleProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const resetForm = () => {
    setCompanyName('')
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
    setTier(client.tier)
    await fetchClientProducts(client.id)
    setShowModal(true)
  }

  const fetchClientUsers = async (clientId: number) => {
    setLoadingUsers(true)
    try {
      const res = await fetch(`/api/users/client/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setClientUsers(data)
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const openUserModal = async (client: Client) => {
    setUserModalClient(client)
    setEditingUser(null)
    setUserName('')
    setUserEmail('')
    setUserRole('user')
    setUserError('')
    setUserSearchQuery('')
    setUserSelectedProducts([])
    setShowUserModal(true)
    await fetchClientUsers(client.id)

    // Fetch client's products
    try {
      const res = await fetch(`/api/products/client/${client.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setClientProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch client products:', err)
    }
  }

  const startEditUser = async (user: User) => {
    setEditingUser(user)
    setUserName(user.name)
    setUserEmail(user.email)
    setUserRole(user.role as 'user' | 'company_admin')
    setUserError('')

    // Fetch user's assigned products
    try {
      const res = await fetch(`/api/users/${user.id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const productIds = data.map((p: Product) => p.id)
        setUserSelectedProducts(productIds)
      }
    } catch (err) {
      console.error('Failed to fetch user products:', err)
      setUserSelectedProducts([])
    }
  }

  const cancelEditUser = () => {
    setEditingUser(null)
    setUserName('')
    setUserEmail('')
    setUserRole('user')
    setUserError('')
    setUserSelectedProducts([])
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userModalClient) return
    setUserError('')
    setSavingUser(true)

    try {
      let userId: number

      if (editingUser) {
        // Update existing user
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: userName, role: userRole }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update user')
        }
        userId = editingUser.id
      } else {
        // Create new user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: userName,
            email: userEmail,
            role: userRole,
            clientId: userModalClient.id,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create user')
        }
        const data = await res.json()
        userId = data.id
      }

      // Update user's product assignments
      const productsRes = await fetch(`/api/users/${userId}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: userSelectedProducts }),
      })
      if (!productsRes.ok) {
        throw new Error('Failed to update product assignments')
      }

      // Refresh user list
      await fetchClientUsers(userModalClient.id)
      cancelEditUser()
    } catch (err: any) {
      setUserError(err.message)
    } finally {
      setSavingUser(false)
    }
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

  const toggleUserActive = async (user: User) => {
    if (!userModalClient) return
    try {
      const res = await fetch(`/api/users/${user.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchClientUsers(userModalClient.id)
      }
    } catch (err) {
      console.error('Toggle user error:', err)
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
          body: JSON.stringify({ name: companyName, tier }),
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
          body: JSON.stringify({ name: companyName, tier }),
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
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Tier</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Gatekeeper</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Created</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className={`hover:bg-slate-50 ${!client.isActive ? 'opacity-50' : ''}`}
                      style={!client.isActive ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
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
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${tierColors[client.tier]}`}>
                          {client.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          client.gatekeeperEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {client.gatekeeperEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleClientActive(client)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            client.isActive ? 'bg-green-500' : 'bg-slate-300'
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
                            className="text-slate-400 hover:text-primary"
                            title="Manage Users"
                          >
                            <span className="material-symbols-outlined">group</span>
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="text-slate-400 hover:text-primary"
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
                <div className="flex flex-wrap gap-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        selectedProducts.includes(product.id)
                          ? 'bg-primary text-white border-primary'
                          : 'hover:border-slate-300'
                      }`}
                      style={!selectedProducts.includes(product.id) ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' } : undefined}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
                {products.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No products available</p>
                )}
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
                      Default password: <span className="font-mono font-medium">systech@123</span>
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
      {showUserModal && userModalClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Users - {userModalClient.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Manage users for this client
                </p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {userError && (
                <div className="p-3 border rounded-lg text-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-bg)', color: 'var(--error-text)' }}>
                  {userError}
                </div>
              )}

              {/* Add/Edit User Form */}
              {userModalClient.isActive ? (
                <form onSubmit={handleUserSubmit} className="p-4 rounded-lg space-y-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userName ? 'text-green-600' : 'text-red-500'}`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--border-primary)' }}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${userEmail || editingUser ? 'text-green-600' : 'text-red-500'}`}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100" style={{ borderColor: 'var(--border-primary)' }}
                      required={!editingUser}
                      disabled={!!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <option value="user">User</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                  </div>
                </div>

                {/* Product Assignment */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Assigned Products (1-2 products)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    {clientProducts.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No products available for this client</p>
                    ) : (
                      clientProducts.map((product) => (
                        <label
                          key={product.id}
                          className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={userSelectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (userSelectedProducts.length < 2) {
                                  setUserSelectedProducts([...userSelectedProducts, product.id])
                                } else {
                                  alert('Maximum 2 products can be assigned')
                                }
                              } else {
                                setUserSelectedProducts(userSelectedProducts.filter(id => id !== product.id))
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</div>
                            {product.description && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.description}</div>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Select 1-2 products this user will work on. Leave empty for all client products.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {savingUser ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
                  </button>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={cancelEditUser}
                      className="px-4 py-2 hover:bg-slate-200 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                  )}
                  {!editingUser && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Default password: <span className="font-mono">systech@123</span>
                    </p>
                  )}
                </div>
              </form>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    <p className="text-sm font-medium">
                      Client is inactive. Activate the client to manage users.
                    </p>
                  </div>
                </div>
              )}

              {/* User List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Existing Users ({clientUsers.filter(u =>
                      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).length})
                  </h4>
                  {clientUsers.length > 0 && (
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary" style={{ borderColor: 'var(--border-primary)' }}
                      />
                    </div>
                  )}
                </div>
                {loadingUsers ? (
                  <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>Loading users...</div>
                ) : clientUsers.length === 0 ? (
                  <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>No users found</div>
                ) : clientUsers.filter(u =>
                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  ).length === 0 ? (
                  <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    No users match "{userSearchQuery}"
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                    <table className="w-full">
                      <thead className="border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Name</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Email</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Role</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Status</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                        {clientUsers
                          .filter(u =>
                            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                          )
                          .map((user) => (
                          <tr
                            key={user.id}
                            className={`hover:bg-slate-50 ${!user.isActive ? 'opacity-50' : ''}`}
                            style={!user.isActive ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                          >
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'company_admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {user.role === 'company_admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleUserActive(user)}
                                disabled={!userModalClient.isActive}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  user.isActive ? 'bg-green-500' : 'bg-slate-300'
                                } ${!userModalClient.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={
                                  !userModalClient.isActive
                                    ? 'Client is inactive - Cannot modify users'
                                    : user.isActive
                                    ? 'Active - Click to deactivate'
                                    : 'Inactive - Click to activate'
                                }
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                                    user.isActive ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => startEditUser(user)}
                                disabled={!userModalClient.isActive}
                                className={`text-slate-400 hover:text-primary ${!userModalClient.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!userModalClient.isActive ? 'Client is inactive - Cannot edit users' : 'Edit user'}
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
