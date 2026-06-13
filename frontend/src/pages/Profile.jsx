import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border"
        style={{ borderColor: 'rgba(227,106,106,0.1)' }}
      >
        <div className="flex items-center gap-6 mb-8 pb-8 border-b" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
            style={{
              background: 'rgba(227,106,106,0.1)',
              border: '2px solid rgba(227,106,106,0.3)',
              color: 'var(--color-coral)'
            }}
          >
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name || 'Student'}</h1>
            <p className="text-gray-500 font-medium">{user.role === 'ADMIN' ? 'Administrator' : 'Student Account'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(227,106,106,0.05)' }}>
              <Mail className="w-6 h-6" style={{ color: 'var(--color-coral)' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Email Address</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.05)' }}>
              <Shield className="w-6 h-6" style={{ color: '#818CF8' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Account Role</p>
              <p className="text-gray-900 font-medium">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.05)' }}>
              <Calendar className="w-6 h-6" style={{ color: '#34D399' }} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Member Since</p>
              <p className="text-gray-900 font-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
