import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/exam-history');
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to load history:', err);
        toast.error('Failed to load history');
        setHistory([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const avgScore = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + (h.score / (h.test?.totalQuestions || 10) * 100), 0) / history.length)
    : 0;

  const getColor = (score, total) => {
    const pct = (score / total) * 100;
    if (pct >= 75) return '#34D399';
    if (pct >= 50) return '#F59E0B';
    return '#FB7185';
  };

  return (
    <AdminLayout title="Exam History" subtitle="Review student test performance">

      {/* Summary Grid */}
      <div className="adm-summary-grid">
        <div className="adm-summary-card">
          <p className="adm-summary-label">Total Attempts</p>
          <p className="adm-summary-value" style={{ color: '#64FFDA' }}>{history.length}</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Avg Score</p>
          <p className="adm-summary-value" style={{ color: '#818CF8' }}>{avgScore}%</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Passed (≥75%)</p>
          <p className="adm-summary-value" style={{ color: '#34D399' }}>{history.filter(h => (h.score / (h.test?.totalQuestions || 10)) >= 0.75).length}</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Failed (&lt;50%)</p>
          <p className="adm-summary-value" style={{ color: '#FB7185' }}>{history.filter(h => (h.score / (h.test?.totalQuestions || 10)) < 0.50).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ marginTop: '1.5rem' }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Test</th>
                <th>Score</th>
                <th style={{ width: 140 }}>Percentage</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="adm-empty">Loading history…</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={5} className="adm-empty">No exam history found</td></tr>
              ) : history.map(h => {
                const total = h.test?.totalQuestions || 10;
                const pct = Math.round((h.score / total) * 100);
                const color = getColor(h.score, total);
                return (
                  <tr key={h.id}>
                    <td>
                      <div className="adm-user-cell">
                        <div>
                          <p className="adm-td-user name">{h.user?.name || '—'}</p>
                          <p className="adm-td-user email">{h.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{h.test?.title}</td>
                    <td>
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem', color }}>
                        {h.score} / {total}
                      </span>
                    </td>
                    <td>
                      <div className="adm-progress-wrap">
                        <div className="adm-progress-bar">
                          <div className="adm-progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="adm-progress-pct" style={{ color }}>{pct}%</span>
                      </div>
                    </td>
                    <td>{new Date(h.completedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminHistory;
