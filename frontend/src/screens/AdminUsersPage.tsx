import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.data || []);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createAdmin(newAdmin);
      setUsers([res.data.data, ...users]);
      setNewAdmin({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      showToast('Admin account created!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create admin', 'error');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{users.length} total users</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px', background: 'var(--tertiary)', color: 'white',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
          + Create Admin
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateAdmin}
          style={{
            background: 'var(--surface-container)', borderRadius: 12, padding: 24,
            marginBottom: 24, border: '1px solid var(--border)',
          }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Admin Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Name</label>
              <input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--bg-white)', color: 'var(--text)' }}
                placeholder="Admin Name" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Email</label>
              <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--bg-white)', color: 'var(--text)' }}
                placeholder="admin@shop.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>Password</label>
              <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--bg-white)', color: 'var(--text)' }}
                placeholder="Min 6 chars" required minLength={6} />
            </div>
            <button type="submit"
              style={{ padding: '10px 24px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Create
            </button>
          </div>
        </form>
      )}

      <div style={{
        background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface-container-low)' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text)' }}>{user.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: user.role === 'admin' ? 'var(--tertiary-container)' : 'var(--surface-container-low)',
                    color: user.role === 'admin' ? 'var(--tertiary-dim)' : 'var(--text-secondary)',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {user.role === 'admin' ? (
                    <button onClick={() => handleRoleChange(user.id, 'user')}
                      style={{
                        padding: '6px 14px', background: 'var(--error-light)', color: 'var(--error)',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                      Demote to User
                    </button>
                  ) : (
                    <button onClick={() => handleRoleChange(user.id, 'admin')}
                      style={{
                        padding: '6px 14px', background: 'var(--tertiary-container)', color: 'var(--tertiary-dim)',
                        border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                      Promote to Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
