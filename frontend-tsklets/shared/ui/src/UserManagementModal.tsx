import { useState, useEffect } from 'react'

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  requirePasswordChange?: boolean
  createdAt?: string
}

interface Product {
  id: number
  name: string
  description?: string | null
}

interface Client {
  id: number
  name: string
  isActive: boolean
}

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  token: string
  showResetPassword?: boolean
  maxProducts?: number
  onUserChange?: () => void
}

export function UserManagementModal({
  isOpen,
  onClose,
  client,
  token,
  showResetPassword = false,
  maxProducts = 2,
  onUserChange,
}: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Form state
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<'user' | 'company_admin'>('user')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])

  useEffect(() => {
    if (isOpen && client) {
      fetchUsers()
      fetchProducts()
    }
  }, [isOpen, client?.id])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/client/${client.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products/client/${client.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setUserName('')
    setUserEmail('')
    setUserRole('user')
    setSelectedProducts([])
    setError('')
  }

  const startEditUser = async (user: User) => {
    setEditingUser(user)
    setUserName(user.name)
    setUserEmail(user.email)
    setUserRole(user.role as 'user' | 'company_admin')
    setError('')

    // Fetch user's assigned products
    try {
      const res = await fetch(`/api/users/${user.id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedProducts(data.map((p: Product) => p.id))
      }
    } catch (err) {
      console.error('Failed to fetch user products:', err)
      setSelectedProducts([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

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
            clientId: client.id,
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
        body: JSON.stringify({ productIds: selectedProducts }),
      })
      if (!productsRes.ok) {
        throw new Error('Failed to update product assignments')
      }

      // Refresh and reset
      await fetchUsers()
      resetForm()
      onUserChange?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleUserActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchUsers()
        onUserChange?.()
      }
    } catch (err) {
      console.error('Toggle user error:', err)
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.name}? They will receive the default password: Systech@123`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to reset password')

      const data = await res.json()
      alert(data.message)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleProductToggle = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      if (selectedProducts.length < maxProducts) {
        setSelectedProducts([...selectedProducts, productId])
      } else {
        alert(`Maximum ${maxProducts} products can be assigned`)
      }
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-center justify-between sticky top-0"
          style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}
        >
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Users - {client.name}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Manage users for this organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 border rounded-lg text-sm bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Add/Edit User Form */}
          {client.isActive ? (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-lg space-y-4"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${userName ? 'text-green-600' : 'text-red-500'}`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    style={{ borderColor: 'var(--border-primary)' }}
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
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--border-primary)' }}
                    required={!editingUser}
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as 'user' | 'company_admin')}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <option value="user">User</option>
                    <option value="company_admin">Company Admin</option>
                  </select>
                </div>
              </div>

              {/* Product Assignment */}
              {products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Assigned Products {maxProducts > 0 && `(max ${maxProducts})`}
                  </label>
                  <div
                    className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    {products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                )}
                {!editingUser && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Default password: <span className="font-mono">Systech@123</span>
                  </p>
                )}
              </div>
            </form>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <p className="text-sm font-medium">
                  Organization is inactive. Activate to manage users.
                </p>
              </div>
            </div>
          )}

          {/* User List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Existing Users ({filteredUsers.length})
              </h4>
              {users.length > 0 && (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-8 pr-3 py-1.5 border rounded-lg text-sm w-48 sm:w-64 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    style={{ borderColor: 'var(--border-primary)' }}
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                No users found
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                No users match "{searchQuery}"
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                <table className="w-full">
                  <thead
                    className="border-b bg-slate-100 dark:bg-slate-700"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!user.isActive ? 'opacity-50' : ''}`}
                        style={!user.isActive ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {user.name}
                            </span>
                            {user.requirePasswordChange && (
                              <span className="block text-xs text-yellow-600 dark:text-yellow-400">
                                Password change required
                              </span>
                            )}
                            <span className="sm:hidden block text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'company_admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300'
                            }`}
                          >
                            {user.role === 'company_admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleUserActive(user)}
                            disabled={!client.isActive}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              user.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                            } ${!client.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={
                              !client.isActive
                                ? 'Organization is inactive'
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditUser(user)}
                              disabled={!client.isActive}
                              className={`text-slate-400 hover:text-primary ${!client.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Edit user"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            {showResetPassword && (
                              <button
                                onClick={() => handleResetPassword(user)}
                                disabled={!client.isActive}
                                className={`text-slate-400 hover:text-orange-500 ${!client.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Reset password"
                              >
                                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                              </button>
                            )}
                          </div>
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
  )
}
