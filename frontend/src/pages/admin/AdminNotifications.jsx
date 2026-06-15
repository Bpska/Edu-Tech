import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Bell, Send, Users, User, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const AdminNotifications = () => {
  const [mode, setMode] = useState('all'); // 'all' | 'single'
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const loadData = async () => {
    try {
      const [uRes, nRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/notifications')
      ]);
      setUsers(uRes.data);
      setHistory(nRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return toast.error('Title and message are required');
    if (mode === 'single' && !selectedUser) return toast.error('Select a user');
    setSending(true);
    try {
      const body = { title, message };
      if (mode === 'single') body.userId = selectedUser.id;
      await api.post('/admin/notifications', body);
      toast.success(mode === 'all' ? `Sent to all users!` : `Sent to ${selectedUser.name || selectedUser.email}`);
      setTitle(''); setMessage(''); setSelectedUser(null);
      loadData();
    } catch { toast.error('Failed to send notification'); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      setHistory(h => h.filter(n => n.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <AdminLayout title="Notifications" subtitle="Send announcements to users">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── Compose Panel ── */}
        <div className="adm-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Compose Notification
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>Send to all users or a specific user</p>
          </div>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setMode('all'); setSelectedUser(null); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                border: mode === 'all' ? '2px solid #1D4ED8' : '1px solid #E2E8F0',
                background: mode === 'all' ? '#EFF6FF' : '#F8FAFC',
                color: mode === 'all' ? '#1D4ED8' : '#64748B',
                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
              }}
            >
              <Users style={{ width: 14, height: 14 }} /> All Users
            </button>
            <button
              onClick={() => setMode('single')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                border: mode === 'single' ? '2px solid #1D4ED8' : '1px solid #E2E8F0',
                background: mode === 'single' ? '#EFF6FF' : '#F8FAFC',
                color: mode === 'single' ? '#1D4ED8' : '#64748B',
                fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
              }}
            >
              <User style={{ width: 14, height: 14 }} /> Single User
            </button>
          </div>

          {/* User Search (single mode) */}
          <AnimatePresence>
            {mode === 'single' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div className="adm-field">
                  <label className="adm-label">Select User</label>
                  <div className="adm-search-wrap" style={{ maxWidth: '100%' }}>
                    <Search className="adm-search-icon" style={{ width: 14, height: 14 }} />
                    <input
                      className="adm-search-input"
                      placeholder="Search by name or email…"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setSelectedUser(null); }}
                    />
                  </div>
                  {search && !selectedUser && (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredUsers.slice(0, 8).map(u => (
                        <div
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setSearch(''); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFF'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        >
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>{u.name || '(no name)'}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{u.email}</p>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p style={{ padding: '12px 14px', color: '#94A3B8', margin: 0, fontSize: '0.875rem' }}>No users found</p>
                      )}
                    </div>
                  )}
                  {selectedUser && (
                    <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1D4ED8' }}>{selectedUser.name || '(no name)'}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#3B82F6' }}>{selectedUser.email}</p>
                      </div>
                      <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <div className="adm-field">
            <label className="adm-label">Notification Title</label>
            <input className="adm-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. New Test Available!" />
          </div>

          {/* Message */}
          <div className="adm-field">
            <label className="adm-label">Message</label>
            <textarea className="adm-input adm-textarea" style={{ minHeight: '100px' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your notification message…" />
          </div>

          {/* Send Button */}
          <button className="adm-submit-btn" onClick={handleSend} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send style={{ width: 15, height: 15 }} />
            {sending ? 'Sending…' : mode === 'all' ? `Send to All Users` : `Send to ${selectedUser?.name || selectedUser?.email || 'User'}`}
          </button>
        </div>

        {/* ── History Panel ── */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="adm-card-header">
            <div>
              <p className="adm-card-title">Sent Notifications</p>
              <p className="adm-card-sub">{history.length} total</p>
            </div>
            <Bell style={{ width: 18, height: 18, color: '#1D4ED8' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px' }}>
            {loadingHistory ? (
              <p className="adm-empty">Loading…</p>
            ) : history.length === 0 ? (
              <p className="adm-empty">No notifications sent yet.</p>
            ) : (
              history.map(n => (
                <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>{n.title}</p>
                    <p style={{ margin: '3px 0 4px', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>{n.message}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 7px', borderRadius: '99px', border: '1px solid #BFDBFE' }}>
                        → {n.user?.name || n.user?.email || 'User'}
                      </span>
                      {n.isRead && <span style={{ fontSize: '11px', background: '#F0FDF4', color: '#16A34A', padding: '1px 7px', borderRadius: '99px', border: '1px solid #BBF7D0' }}>Read</span>}
                    </div>
                  </div>
                  <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDelete(n.id)}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
