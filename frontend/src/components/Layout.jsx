import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, BookOpen, GraduationCap, BarChart2, X, CheckCheck } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from './InstallPrompt';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import FeedbackButton from './FeedbackButton';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: GraduationCap },
    { path: '/courses', label: 'My Courses', icon: BookOpen },
    { path: '/tests', label: 'Practice Tests', icon: BookOpen },
    { path: '/growth', label: 'My Growth', icon: BarChart2 },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/user/notifications');
      setNotifications(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/user/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/user/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    } catch (_) {}
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F8FAFF', color: '#1E293B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#1D4ED8', secondary: '#EFF6FF' },
          },
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8" style={{ color: '#1D4ED8' }} />
          <Link to="/" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#0F172A', textDecoration: 'none', letterSpacing: '0.08em' }}>
            NEXUS<span style={{ color: '#1D4ED8', fontWeight: 400 }}>ACADEMY</span>
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
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.875rem', fontWeight: 500,
                    color: isActive ? '#1D4ED8' : '#64748B',
                    textDecoration: 'none', transition: 'color 0.2s',
                    borderBottom: isActive ? '2px solid #1D4ED8' : '2px solid transparent',
                    paddingBottom: '2px',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1.5rem' }}>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '8px', color: '#1D4ED8', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none', letterSpacing: '0.04em',
              }}>⚙ Admin</Link>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); }}
                className="relative"
                style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    minWidth: '18px', height: '18px', padding: '0 4px',
                    background: '#1D4ED8', borderRadius: '99px',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                      width: '360px', background: '#FFFFFF',
                      border: '1px solid #E2E8F0', borderRadius: '16px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100,
                    }}
                  >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>
                        Notifications
                        {unreadCount > 0 && (
                          <span style={{ marginLeft: '8px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px' }}>{unreadCount} new</span>
                        )}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} title="Mark all read" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                            <CheckCheck style={{ width: 14, height: 14 }} /> All read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                          <X style={{ width: 16, height: 16 }} />
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 20px', margin: 0, fontSize: '0.875rem' }}>No notifications yet</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            style={{
                              padding: '14px 20px', borderBottom: '1px solid #F8FAFF',
                              background: n.isRead ? '#FFFFFF' : '#F0F7FF',
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              {!n.isRead && <span style={{ width: '8px', height: '8px', background: '#1D4ED8', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }} />}
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>{n.title}</p>
                                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>{n.message}</p>
                                <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#94A3B8' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar / Profile */}
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#EFF6FF', border: '2px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1D4ED8', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer'
              }} title="Profile">
                {user ? (user.name || user.email)[0].toUpperCase() : 'U'}
              </div>
            </Link>

            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: '13px', fontWeight: 600,
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-6 py-3 flex justify-around" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
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
                color: isActive ? '#1D4ED8' : '#94A3B8', transition: 'color 0.2s',
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

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Layout;
