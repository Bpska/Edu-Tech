import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, Send } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const FeedbackButton = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;
  if (location.pathname !== '/profile') return null;

  const handleSubmit = async () => {
    if (!message.trim()) return toast.error('Please write a message');
    setSending(true);
    try {
      await api.post('/user/feedback', { rating, message });
      setSent(true);
      toast.success('Feedback sent! Thank you 🙏');
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage('');
        setRating(5);
      }, 1800);
    } catch {
      toast.error('Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: '80px', right: '20px',
          zIndex: 49, background: '#1D4ED8', color: '#FFFFFF',
          border: 'none', borderRadius: '14px',
          padding: '10px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        aria-label="Send Feedback"
      >
        <MessageSquare style={{ width: 16, height: 16 }} />
        Feedback
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(4px)', zIndex: 9999,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
              padding: '20px',
            }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#FFFFFF', borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
                width: '340px', overflow: 'hidden',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 20px 14px',
                background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>Share Feedback</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Help us improve Nexus Academy</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>

              {sent ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Thank you!</p>
                  <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '0.875rem' }}>Your feedback has been sent to the admin.</p>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  {/* Star Rating */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Rate your experience</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.1s' }}
                        >
                          <Star
                            style={{
                              width: 28, height: 28, transition: 'all 0.15s',
                              fill: (hoverRating || rating) >= star ? '#FBBF24' : 'none',
                              stroke: (hoverRating || rating) >= star ? '#FBBF24' : '#CBD5E1',
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Your message</p>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Share your thoughts, suggestions, or issues…"
                      rows={4}
                      style={{
                        width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                        border: '1px solid #E2E8F0', borderRadius: '10px',
                        background: '#F8FAFF', color: '#0F172A', fontSize: '0.875rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none',
                        resize: 'none', lineHeight: 1.5, transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#93C5FD'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={sending || !message.trim()}
                    style={{
                      width: '100%', padding: '11px', border: 'none',
                      borderRadius: '10px', background: '#1D4ED8', color: '#FFFFFF',
                      fontWeight: 700, fontSize: '0.9rem', cursor: sending ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      opacity: (!message.trim() || sending) ? 0.6 : 1, transition: 'opacity 0.15s',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    <Send style={{ width: 15, height: 15 }} />
                    {sending ? 'Sending…' : 'Send Feedback'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;
