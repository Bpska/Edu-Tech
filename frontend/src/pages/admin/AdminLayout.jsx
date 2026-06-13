import { useState } from 'react';
import './admin.css';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Users, BookOpen, ClipboardList, CreditCard, History, GraduationCap, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin',          label: 'Overview',        icon: LayoutDashboard, exact: true },
  { path: '/admin/users',    label: 'Users',            icon: Users },
  { path: '/admin/courses',  label: 'Courses',          icon: BookOpen },
  { path: '/admin/tests',    label: 'Tests & Questions', icon: ClipboardList },
  { path: '/admin/payments', label: 'Payments',         icon: CreditCard },
  { path: '/admin/history',  label: 'Exam History',     icon: History },
];

const AdminLayout = ({ children, title, subtitle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (location.pathname.startsWith(path) && path !== '/admin');
  };

  return (
    <div className="adm-root">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0C1829', color: '#333', border: '1px solid rgba(0,0,0,0.1)' },
        success: { iconTheme: { primary: '#E36A6A', secondary: '#060E1A' } },
      }} />

      {/* ── Sidebar ── */}
      <aside className={`adm-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        {/* Logo */}
        <div className="adm-sidebar-logo">
          <div className="adm-sidebar-logo-icon">
            <GraduationCap style={{ width: 20, height: 20, color: '#E36A6A' }} />
          </div>
          <div>
            <p className="adm-sidebar-brand">
              NEXUS<span style={{ color: '#E36A6A' }}>ADMIN</span>
            </p>
            <p className="adm-sidebar-sub">Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="adm-nav">
          <p className="adm-nav-label">Menu</p>
          {navItems.map(({ path, label, icon: Icon, exact }) => (
            <Link
              key={path}
              to={path}
              className={`adm-nav-link${isActive(path, exact) ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-sidebar-footer-btn">
            <LogOut style={{ width: 16, height: 16 }} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="adm-main">
        {/* Header */}
        <header className="adm-header">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="adm-btn-icon"
              style={{ color: '#475569', borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <Menu style={{ width: 18, height: 18 }} />
            </button>
            <div>
              <h1 className="adm-header-title">{title || 'Admin Panel'}</h1>
              {subtitle && <p className="adm-header-sub">{subtitle}</p>}
            </div>
          </div>
          <div className="adm-header-user" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="adm-avatar">{user ? (user.name || user.email)[0].toUpperCase() : 'A'}</div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', margin: 0 }}>{user?.name || 'Admin'}</p>
                <p style={{ fontSize: '11px', color: '#475569', margin: '1px 0 0' }}>{user?.role === 'ADMIN' ? 'Full Access' : 'Staff'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#E36A6A', fontSize: '13px', fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <motion.div
          className="adm-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLayout;
