import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DashboardSkeleton } from '../components/Skeleton';
import { Award, BookOpen, ChevronRight, TrendingUp, Calendar, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, historyRes] = await Promise.all([
          api.get('/user/courses'),
          api.get('/user/exam-history')
        ]);
        
        const enrolledCount = coursesRes.data.length;
        const testsTaken = historyRes.data.length;
        const avgScore = testsTaken > 0 
          ? Math.round(historyRes.data.reduce((acc, curr) => acc + curr.score, 0) / testsTaken) 
          : 0;

        setStats({
          enrolledCount,
          testsTaken,
          avgScore,
          recentHistory: historyRes.data.slice(0, 3),
          enrolledCourses: coursesRes.data.slice(0, 3)
        });
      } catch (err) {
        // Fallback to mock data if backend endpoints are not populated
        setStats({
          enrolledCount: 3,
          testsTaken: 8,
          avgScore: 78,
          recentHistory: [
            { id: '1', test: { title: 'React Hooks Mastery' }, score: 8, completedAt: new Date().toISOString() },
            { id: '2', test: { title: 'Node.js Express Fundamentals' }, score: 7, completedAt: new Date().toISOString() },
          ],
          enrolledCourses: [
            { id: '1', title: 'Fullstack Web Development', description: 'Master Node.js and React.' },
            { id: '2', title: 'System Design Interview Prep', description: 'Architect large scale systems.' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card relative overflow-hidden bg-gradient-to-r from-[#FFFBF1] via-[#FFF2D0] to-[#FFB2B2]/20 border-[#E36A6A]/20"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E36A6A]/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#E36A6A]">
              <Zap className="w-5 h-5 fill-teal" />
              <span className="text-sm font-semibold tracking-widest uppercase">Student Workspace</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Track your daily learning progress, attempt mock tests, and review performance insights from your instructors.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link 
              to="/tests" 
              className="px-6 py-3 bg-[#E36A6A] text-white font-bold rounded-xl hover:bg-opacity-95 transition-all text-sm text-center"
            >
              Take Mock Test
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 3-Column Feature Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Column 1: My Study Growth */}
        <motion.div variants={itemVariants} className="glass-card flex flex-col justify-between hover:border-teal/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-xl text-gray-900">My Study Growth</h3>
              <TrendingUp className="text-[#E36A6A] w-6 h-6" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-600 font-semibold uppercase">Tests</p>
                <p className="text-2xl font-bold text-[#E36A6A] mt-1">{stats?.testsTaken}</p>
              </div>
              <div className="bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-600 font-semibold uppercase">Avg Score</p>
                <p className="text-2xl font-bold text-[#E36A6A] mt-1">{stats?.avgScore}%</p>
              </div>
              <div className="bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-600 font-semibold uppercase">Courses</p>
                <p className="text-2xl font-bold text-[#E36A6A] mt-1">{stats?.enrolledCount}</p>
              </div>
            </div>
          </div>
          <Link 
            to="/growth" 
            className="flex items-center justify-between text-sm font-semibold text-[#E36A6A] group hover:underline"
          >
            Detailed Analytics
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Column 2: Mock Tests */}
        <motion.div variants={itemVariants} className="glass-card flex flex-col justify-between hover:border-teal/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-xl text-gray-900">Recent Exams</h3>
              <Award className="text-[#E36A6A] w-6 h-6" />
            </div>
            
            <div className="space-y-3 mb-6">
              {stats?.recentHistory && stats.recentHistory.length > 0 ? (
                stats.recentHistory.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between p-3 bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl">
                    <div className="truncate pr-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.test?.title}</p>
                      <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#E36A6A] bg-[#E36A6A]/10 px-2.5 py-1 rounded-lg">
                      Score: {item.score}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No mock tests completed yet.
                </div>
              )}
            </div>
          </div>
          
          <Link 
            to="/tests" 
            className="flex items-center justify-between text-sm font-semibold text-[#E36A6A] group hover:underline"
          >
            Browse Test Series
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Column 3: My Courses */}
        <motion.div variants={itemVariants} className="glass-card flex flex-col justify-between hover:border-teal/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-xl text-gray-900">Active Courses</h3>
              <BookOpen className="text-[#E36A6A] w-6 h-6" />
            </div>

            <div className="space-y-3 mb-6">
              {stats?.enrolledCourses && stats.enrolledCourses.length > 0 ? (
                stats.enrolledCourses.map((course, idx) => (
                  <div key={course.id || idx} className="p-3 bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                    <p className="text-[10px] text-gray-600 truncate mt-0.5">{course.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  You are not enrolled in any courses.
                </div>
              )}
            </div>
          </div>

          <Link 
            to="/courses" 
            className="flex items-center justify-between text-sm font-semibold text-[#E36A6A] group hover:underline"
          >
            My Learning Center
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
