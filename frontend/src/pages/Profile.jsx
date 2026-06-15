import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Target, BookOpen, Brain, Clock, Zap, Star, BarChart2 } from 'lucide-react';
import api from '../utils/api';

const InfoRow = ({ icon: Icon, label, value, color = '#1D4ED8' }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 py-4 border-b last:border-b-0" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: `${color}10` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-medium mb-0.5" style={{ color: '#64748B' }}>{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfileData(res.data);
      } catch (err) {
        // Fallback to auth context user if profile fetch fails
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return null;

  const profile = profileData?.profile;
  const displayUser = profileData || user;

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border"
        style={{ borderColor: 'rgba(227,106,106,0.1)' }}
      >
        <div className="flex items-center gap-6 mb-8 pb-8 border-b" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0"
            style={{
              background: 'rgba(227,106,106,0.1)',
              border: '2px solid rgba(227,106,106,0.3)',
              color: '#E36A6A'
            }}
          >
            {(displayUser.name || displayUser.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayUser.name || 'Student'}</h1>
            <p className="font-medium" style={{ color: '#64748B' }}>
              {displayUser.role === 'ADMIN' ? 'Administrator' : 'Student Account'}
            </p>
            {displayUser.onboardingCompleted && (
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#E36A6A10', color: '#E36A6A' }}>
                <Star className="w-3 h-3" /> Profile Complete
              </span>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-2 uppercase tracking-wider text-xs" style={{ color: '#94A3B8' }}>Account Details</h2>
          <InfoRow icon={Mail} label="Email Address" value={displayUser.email} color="#1D4ED8" />
          <InfoRow icon={Shield} label="Account Role" value={displayUser.role} color="#818CF8" />
          <InfoRow icon={Calendar} label="Member Since" value={new Date(displayUser.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} color="#34D399" />
        </div>
      </motion.div>

      {/* Academic Profile Card */}
      {loading ? (
        <div className="glass rounded-2xl p-8 border text-center text-gray-500" style={{ borderColor: 'rgba(227,106,106,0.1)' }}>
          Loading profile details...
        </div>
      ) : profile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border"
          style={{ borderColor: 'rgba(227,106,106,0.1)' }}
        >
          <h2 className="text-base font-bold mb-4 uppercase tracking-wider text-xs" style={{ color: '#94A3B8' }}>Academic Profile</h2>
          <InfoRow icon={Target} label="Target Exam" value={profile.targetExam} color="#E36A6A" />
          <InfoRow icon={BookOpen} label="Class / Year" value={profile.classYear} color="#F59E0B" />
          <InfoRow icon={Calendar} label="Exam Attempt Year" value={profile.examAttemptYear} color="#818CF8" />
          <InfoRow icon={BarChart2} label="Current Prep Level" value={profile.currentSkillLevel} color="#34D399" />
          <InfoRow icon={Clock} label="Daily Study Hours" value={profile.dailyStudyHours} color="#60A5FA" />
          <InfoRow icon={Target} label="Target Score / Rank" value={profile.targetScoreRank} color="#FB7185" />
          <InfoRow icon={Star} label="Strong Subjects" value={profile.strongSubjects} color="#16A34A" />
          <InfoRow icon={Brain} label="Weak Subjects" value={profile.weakSubjects} color="#DC2626" />
          {profile.dateOfBirth && (
            <InfoRow icon={Calendar} label="Date of Birth" value={new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} color="#64748B" />
          )}
          <InfoRow icon={Zap} label="Preferred Language" value={profile.preferredLanguage} color="#1D4ED8" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border text-center"
          style={{ borderColor: 'rgba(227,106,106,0.1)' }}
        >
          <Brain className="w-10 h-10 mx-auto mb-3" style={{ color: '#E36A6A' }} />
          <p className="font-semibold text-gray-900 mb-1">No academic profile yet</p>
          <p className="text-sm text-gray-500">Complete the onboarding to personalize your profile.</p>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
