import { Link, useLocation } from 'react-router-dom';
import { Bell, BookOpen, GraduationCap, BarChart2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from './InstallPrompt';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: GraduationCap },
    { path: '/courses', label: 'My Courses', icon: BookOpen },
    { path: '/tests', label: 'Practice Tests', icon: BookOpen },
    { path: '/growth', label: 'My Growth', icon: BarChart2 },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-cream)', color: '#333333', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Toast provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-cream)',
            color: '#333333',
            border: '1px solid rgba(227, 106, 106, 0.2)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-coral)',
              secondary: 'var(--color-cream)',
            },
          },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8" style={{ color: 'var(--color-coral)' }} />
          <Link to="/" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-navy)', textDecoration: 'none', letterSpacing: '0.1em' }}>
            NEXUS<span style={{ color: 'var(--color-coral)', fontWeight: 300 }}>ACADEMY</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? 'var(--color-coral)' : '#555555',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bell icon */}
          <div className="flex items-center gap-4" style={{ borderLeft: '1px solid rgba(227,106,106,0.2)', paddingLeft: '1.5rem' }}>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                background: 'rgba(227,106,106,0.1)', border: '1px solid rgba(227,106,106,0.2)',
                borderRadius: '8px', color: 'var(--color-coral)', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none', letterSpacing: '0.04em',
              }}>⚙ Admin</Link>
            )}
            <button className="relative" style={{ color: '#555555', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Bell className="w-5 h-5" />
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', background: 'var(--color-coral)', borderRadius: '50%' }} />
            </button>

            {/* Avatar / Profile */}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(227,106,106,0.1)', border: '1px solid rgba(227,106,106,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-coral)', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer'
              }} title="Profile">
                {user ? (user.name || user.email)[0].toUpperCase() : 'U'}
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#555555', fontSize: '13px', fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t px-6 py-3 flex justify-around" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', fontSize: '10px', fontWeight: 600, textDecoration: 'none',
                color: isActive ? 'var(--color-coral)' : '#555555', transition: 'color 0.2s',
              }}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* PWA Install Banner */}
      <InstallPrompt />
    </div>
  );
};

export default Layout;
