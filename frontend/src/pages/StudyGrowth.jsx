import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Award, BookOpen, Clock, Flame, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const StudyGrowth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrowthData = async () => {
      try {
        const [coursesRes, historyRes] = await Promise.all([
          api.get('/user/courses'),
          api.get('/user/exam-history')
        ]);
        
        // Calculate average accuracy percentage
        const totalAccuracySum = historyRes.data.reduce((acc, curr) => {
          const totalQ = curr.test?.totalQuestions || 1;
          const accuracy = (curr.score / totalQ) * 100;
          return acc + accuracy;
        }, 0);
        const avgScore = historyRes.data.length > 0
          ? Math.round(totalAccuracySum / historyRes.data.length)
          : 0;

        // Calculate dynamic streak (consecutive days with test attempts)
        const completedDates = historyRes.data.map(h => new Date(h.completedAt).toDateString());
        const uniqueDates = [...new Set(completedDates)].map(d => new Date(d));
        uniqueDates.sort((a, b) => b - a);

        let streak = 0;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (uniqueDates.length > 0) {
          const mostRecent = new Date(uniqueDates[0]);
          mostRecent.setHours(0,0,0,0);
          
          if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
            streak = 1;
            let checkDate = mostRecent;
            for (let i = 1; i < uniqueDates.length; i++) {
              const prevDate = new Date(uniqueDates[i]);
              prevDate.setHours(0,0,0,0);
              
              const expectedDate = new Date(checkDate);
              expectedDate.setDate(expectedDate.getDate() - 1);
              
              if (prevDate.getTime() === expectedDate.getTime()) {
                streak++;
                checkDate = prevDate;
              } else {
                break;
              }
            }
          }
        }

        // Generate dynamic 35-day activity calendar
        const studyDays = [];
        const completedTimestamps = new Set(
          historyRes.data.map(h => {
            const d = new Date(h.completedAt);
            d.setHours(0,0,0,0);
            return d.getTime();
          })
        );

        for (let i = 34; i >= 0; i--) {
          const day = new Date();
          day.setDate(day.getDate() - i);
          day.setHours(0,0,0,0);
          studyDays.push(completedTimestamps.has(day.getTime()));
        }

        setData({
          coursesCount: coursesRes.data.length,
          testsCount: historyRes.data.length,
          avgScore,
          streak,
          studyDays,
          history: historyRes.data
        });
      } catch (err) {
        setData({
          coursesCount: 0,
          testsCount: 0,
          avgScore: 0,
          streak: 0,
          studyDays: Array(35).fill(false),
          history: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchGrowthData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading growth analytics...</div>;
  }

  // Circular progress configuration
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.avgScore / 100) * circumference;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">My Study Growth</h1>
        <p className="text-gray-600 mt-2">Personal performance insights and learning activity streak tracker.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 bg-[#E36A6A]/10 rounded-xl text-[#E36A6A] border border-[#E36A6A]/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Tests Attempted</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.testsCount}</h4>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 bg-[#E36A6A]/10 rounded-xl text-[#E36A6A] border border-[#E36A6A]/20">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Average Accuracy</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.avgScore}%</h4>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 bg-[#E36A6A]/10 rounded-xl text-[#E36A6A] border border-[#E36A6A]/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Active Courses</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.coursesCount}</h4>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 bg-[#E36A6A]/10 rounded-xl text-[#E36A6A] border border-[#E36A6A]/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold">Current Streak</p>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{data.streak} Days</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SVG Circular Progress Ring */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-6">Cumulative Accuracy</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                stroke="rgba(0,0,0,0.05)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
              />
              {/* Foreground circle */}
              <motion.circle
                stroke="#E36A6A"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius + strokeWidth}
                cy={radius + strokeWidth}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-bold text-gray-900">{data.avgScore}</span>
              <span className="text-[#E36A6A] font-semibold text-sm">%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Keep aiming for above <span className="text-[#E36A6A] font-semibold">80%</span> to achieve certification status.
          </p>
        </div>

        {/* Streak Heatmap */}
        <div className="glass-card md:col-span-2 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-gray-900">Study Calendar Streak</h3>
            <span className="text-xs text-[#E36A6A] font-semibold bg-[#E36A6A]/10 px-2.5 py-1 rounded-lg">Last 35 Days</span>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-6">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-xs text-gray-500 font-bold">{day}</div>
            ))}
            {data.studyDays.map((studied, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.15 }}
                className={`aspect-square rounded-lg border border-[#E36A6A]/10 transition-all ${
                  studied 
                    ? 'bg-[#E36A6A]/80 border-teal shadow-lg shadow-[#E36A6A]/20' 
                    : 'bg-[#FFF2D0]'
                }`}
                title={studied ? `Study session recorded` : 'No study activity'}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#FFF2D0] border border-[#E36A6A]/10 rounded" />
              <span>Rest Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#E36A6A]/80 border border-teal rounded" />
              <span>Study Session Recorded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGrowth;
