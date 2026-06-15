import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BADGE_MAP = {
  SUCCESS: 'adm-badge adm-badge-green',
  PENDING: 'adm-badge adm-badge-yellow',
  FAILED:  'adm-badge adm-badge-red',
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/payments');
        setPayments(res.data);
        setTotal(res.data.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + (p.course?.price || 0), 0));
      } catch (err) {
        console.error('Failed to load payments:', err);
        toast.error('Failed to load payments');
        setPayments([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const success = payments.filter(p => p.status === 'SUCCESS').length;
  const pending = payments.filter(p => p.status === 'PENDING').length;

  return (
    <AdminLayout title="Transactions" subtitle="Purchase records and revenue tracking">

      {/* Summary Grid */}
      <div className="adm-summary-grid">
        <div className="adm-summary-card">
          <p className="adm-summary-label">Total Revenue</p>
          <p className="adm-summary-value" style={{ color: '#34D399' }}>₹{total.toLocaleString()}</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Successful</p>
          <p className="adm-summary-value" style={{ color: '#64FFDA' }}>{success}</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Pending</p>
          <p className="adm-summary-value" style={{ color: '#F59E0B' }}>{pending}</p>
        </div>
        <div className="adm-summary-card">
          <p className="adm-summary-label">Total Orders</p>
          <p className="adm-summary-value" style={{ color: '#818CF8' }}>{payments.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="adm-card" style={{ marginTop: '1.5rem' }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="adm-empty">Loading transactions…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="adm-empty">No transactions found</td></tr>
              ) : payments.map(p => (
                <tr key={p.id}>
                  <td>
                    <code style={{ fontSize: 11, color: '#64748B', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6 }}>
                      {(p.razorpayOrderId || 'N/A').slice(0, 20)}
                    </code>
                  </td>
                  <td>
                    <div className="adm-user-cell">
                      <div>
                        <p className="adm-td-user name">{p.user?.name || '—'}</p>
                        <p className="adm-td-user email">{p.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{p.course?.title}</td>
                  <td className="primary">
                    {p.course?.price === 0 ? 'Free' : `₹${p.course?.price}`}
                  </td>
                  <td>
                    <span className={BADGE_MAP[p.status] || 'adm-badge adm-badge-gray'}>
                      {p.status}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminPayments;
