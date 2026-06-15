import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import { Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StarDisplay = ({ rating }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        style={{
          width: 13, height: 13,
          fill: s <= rating ? '#FBBF24' : 'none',
          stroke: s <= rating ? '#FBBF24' : '#CBD5E1',
        }}
      />
    ))}
  </div>
);

const RATING_COLOR = { 5: '#16A34A', 4: '#65A30D', 3: '#CA8A04', 2: '#EA580C', 1: '#DC2626' };

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/admin/feedback');
      setFeedback(res.data);
    } catch { toast.error('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      setFeedback(f => f.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '—';

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    r, count: feedback.filter(f => f.rating === r).length
  }));

  return (
    <AdminLayout title="User Feedback" subtitle="Messages submitted by students">

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: '#EFF6FF' }}>
            <Star style={{ width: 22, height: 22, fill: '#FBBF24', stroke: '#FBBF24' }} />
          </div>
          <div>
            <p className="adm-stat-label">Avg. Rating</p>
            <p className="adm-stat-value">{avgRating}</p>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: '#F0FDF4' }}>
            <Star style={{ width: 22, height: 22, color: '#16A34A' }} />
          </div>
          <div>
            <p className="adm-stat-label">Total Feedback</p>
            <p className="adm-stat-value">{feedback.length}</p>
          </div>
        </div>
        <div className="adm-stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <p className="adm-stat-label" style={{ marginBottom: 0 }}>Rating Breakdown</p>
          {ratingCounts.map(({ r, count }) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: RATING_COLOR[r], minWidth: '14px' }}>{r}★</span>
              <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: feedback.length ? `${(count / feedback.length) * 100}%` : '0%',
                  height: '100%', background: RATING_COLOR[r], borderRadius: '99px', transition: 'width 0.5s'
                }} />
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8', minWidth: '18px', textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="adm-card">
        <div className="adm-card-header">
          <p className="adm-card-title">All Feedback ({feedback.length})</p>
        </div>
        {loading ? (
          <p className="adm-empty">Loading feedback…</p>
        ) : feedback.length === 0 ? (
          <p className="adm-empty">No feedback submitted yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {feedback.map((f, i) => (
              <div
                key={f.id}
                style={{
                  padding: '16px 24px', borderBottom: i < feedback.length - 1 ? '1px solid #F1F5F9' : 'none',
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div className="adm-user-avatar" style={{ flexShrink: 0, marginTop: '2px' }}>
                  {(f.user?.name || f.user?.email || 'U')[0].toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                      {f.user?.name || '(no name)'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{f.user?.email}</span>
                    <StarDisplay rating={f.rating} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>{f.message}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94A3B8' }}>
                    {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Rating Badge */}
                <div style={{
                  minWidth: '36px', height: '36px', borderRadius: '10px',
                  background: `${RATING_COLOR[f.rating]}15`, border: `1px solid ${RATING_COLOR[f.rating]}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', color: RATING_COLOR[f.rating], flexShrink: 0,
                }}>
                  {f.rating}
                </div>

                {/* Delete */}
                <button className="adm-btn-icon adm-btn-delete" onClick={() => handleDelete(f.id)}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
