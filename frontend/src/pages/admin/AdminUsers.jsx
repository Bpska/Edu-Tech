import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  ADMIN:   'adm-badge adm-badge-red',
  STUDENT: 'adm-badge adm-badge-teal',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data); setFiltered(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
      setUsers([]); setFiltered([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q)
    ));
  }, [search, users]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetch();
    } catch { toast.error('Failed to delete user'); }
    finally { setDeleting(null); }
  };

  return (
    <AdminLayout title="Users" subtitle={`${filtered.length} registered accounts`}>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search className="adm-search-icon" style={{ width: 15, height: 15 }} />
          <input
            className="adm-search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Purchases</th>
                <th>Exams</th>
                <th>Joined</th>
                <th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="adm-empty">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="adm-empty">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-user-avatar">
                        {(u.name || u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color: '#333', fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>{u.name || '—'}</p>
                        <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={ROLE_BADGE[u.role] || 'adm-badge adm-badge-gray'}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>{u._count?.purchases ?? 0}</td>
                  <td style={{ color: '#cbd5e1' }}>{u._count?.examHistories ?? 0}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="adm-btn-icon adm-btn-delete"
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      title="Delete user"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminUsers;
