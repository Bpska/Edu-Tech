import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import {
  Users, BookOpen, ClipboardList, CreditCard,
  History, TrendingUp, Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';

const STAT_CARDS = [
  { key: 'userCount',    label: 'Total Users',  icon: Users,       color: '#E36A6A' },
  { key: 'courseCount',  label: 'Courses',      icon: BookOpen,    color: '#818CF8' },
  { key: 'testCount',    label: 'Tests',        icon: ClipboardList, color: '#F59E0B' },
  { key: 'purchaseCount',label: 'Purchases',    icon: CreditCard,  color: '#34D399' },
  { key: 'examCount',    label: 'Exams Taken',  icon: History,     color: '#60A5FA' },
  { key: 'totalRevenue', label: 'Revenue',      icon: TrendingUp,  color: '#FB7185' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, h] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/exam-history'),
        ]);
        setStats(s.data);
        setHistory(h.data.slice(0, 8));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setStats(null);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmtVal = (key, stats) => {
    if (!stats) return '—';
    if (key === 'totalRevenue') return `₹${Number(stats[key]).toLocaleString()}`;
    return stats[key] ?? '—';
  };

  return (
    <AdminLayout title="Overview" subtitle="Platform analytics and activity summary">

      {/* ── Stat Cards ── */}
      <div className="adm-stats-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }, i) => (
          <motion.div
            key={key}
            className="adm-stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.28 }}
          >
            <div
              className="adm-stat-icon"
              style={{ background: `${color}14`, border: `1px solid ${color}28` }}
            >
              <Icon style={{ width: 22, height: 22, color }} />
            </div>
            <div>
              <p className="adm-stat-label">{label}</p>
              <p className="adm-stat-value">
                {loading ? '—' : fmtVal(key, stats)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Recent Activity Table ── */}
      <div className="adm-card">
        <div className="adm-card-header">
          <div>
            <h3 className="adm-card-title">Recent Exam Activity</h3>
            <p className="adm-card-sub">Latest student submissions</p>
          </div>
          <Activity style={{ width: 18, height: 18, color: '#E36A6A' }} />
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="adm-empty">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={4} className="adm-empty">No exam history yet</td></tr>
              ) : history.map(h => (
                <tr key={h.id}>
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-user-avatar">
                        {(h.user?.name || h.user?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="adm-td-user name">{h.user?.name || '—'}</p>
                        <p className="adm-td-user email">{h.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{h.test?.title}</td>
                  <td>
                    <span className="adm-badge adm-badge-teal">
                      {h.score} / {h.test?.totalQuestions}
                    </span>
                  </td>
                  <td>{new Date(h.completedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminDashboard;
