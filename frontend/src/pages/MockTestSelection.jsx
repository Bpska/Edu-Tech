import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ExamSelectionSkeleton } from '../components/Skeleton';
import { BookOpen, Clock, Lock, Play, CheckCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MockTestSelection = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestsAndPurchases = async () => {
      try {
        const [coursesRes, purchasesRes] = await Promise.all([
          api.get('/courses'),
          api.get('/user/courses').catch(() => ({ data: [] })) // fallback if empty
        ]);
        
        // Organize tests by course
        const courses = coursesRes.data;
        const purchasedIds = purchasesRes.data.map(c => c.id);
        
        setPurchasedCourseIds(purchasedIds);
        setSeriesList(courses);
      } catch (err) {
        // Mock fallback if endpoints are empty or fail
        setSeriesList([
          {
            id: 'course-1',
            title: 'Frontend Mastery Series',
            price: 0,
            tests: [
              { id: 't1', title: 'React Hooks Deep Dive', duration: 30, totalQuestions: 15, progress: 'Completed' },
              { id: 't2', title: 'Tailwind CSS Grid & Flex', duration: 20, totalQuestions: 10, progress: 'In Progress' }
            ]
          },
          {
            id: 'course-2',
            title: 'Backend Systems Series',
            price: 499,
            tests: [
              { id: 't3', title: 'SQL & Database Optimization', duration: 45, totalQuestions: 25, progress: 'Not Started' },
              { id: 't4', title: 'REST API Best Practices', duration: 30, totalQuestions: 20, progress: 'Not Started' }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestsAndPurchases();
  }, []);

  const handleStartTest = (test, course) => {
    const isLocked = course.price > 0 && !purchasedCourseIds.includes(course.id);
    if (isLocked) {
      toast.error(`Please purchase "${course.title}" to unlock this test.`);
      navigate('/courses');
      return;
    }
    navigate(`/exam/${test.id}`);
  };

  if (loading) {
    return <ExamSelectionSkeleton />;
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Practice Mock Tests</h1>
        <p className="text-gray-600 mt-2">Choose a test series below. Select tests to start your mock evaluation.</p>
      </div>

      {seriesList.map((series) => {
        const isLocked = series.price > 0 && !purchasedCourseIds.includes(series.id);
        
        return (
          <div key={series.id} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-gray-900">{series.title}</h2>
                <p className="text-xs text-gray-700 mt-1">
                  {series.price === 0 ? 'Free Series' : `Premium Series • ₹${series.price}`}
                </p>
              </div>
            </div>

            {/* Horizontal Scroll Wrapper */}
            <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
              {series.tests && series.tests.length > 0 ? (
                series.tests.map((test) => {
                  const progressColor = 
                    test.progress === 'Completed' ? 'text-[#E36A6A] border-[#E36A6A]/20 bg-[#E36A6A]/10' :
                    test.progress === 'In Progress' ? 'text-amber-700 border-amber-500/20 bg-amber-500/10' :
                    'text-gray-700 border-[#E36A6A]/10 bg-[#FFF2D0]';
                  
                  return (
                    <div
                      key={test.id}
                      className="min-w-[300px] max-w-[300px] glass-card relative overflow-hidden group snap-start border border-[#E36A6A]/20 hover:border-teal/30 transition-all flex flex-col justify-between"
                    >
                      {/* Locked Overlay */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-[#FFFBF1]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                          <div className="p-3 bg-[#FFF2D0] border border-[#E36A6A]/20 rounded-full text-gray-700 mb-3">
                            <Lock className="w-6 h-6" />
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">Premium Test</p>
                          <p className="text-xs text-gray-800 mt-1">Unlock this series in courses</p>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <span className={`text-[10px] font-bold border rounded px-2 py-0.5 uppercase tracking-wide ${progressColor}`}>
                            {test.progress || 'Not Started'}
                          </span>
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {test.duration} mins
                          </span>
                        </div>

                        <h3 className="font-display font-semibold text-lg text-gray-900 mt-4 line-clamp-2 min-h-[56px]">
                          {test.title}
                        </h3>

                        <div className="flex gap-4 mt-4 text-xs text-gray-700">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {test.totalQuestions} Questions
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-between items-center">
                        <span className="text-xs text-[#E36A6A] font-semibold">Ready to begin</span>
                        <button
                          onClick={() => handleStartTest(test, series)}
                          className="w-10 h-10 rounded-xl bg-[#E36A6A]/10 group-hover:bg-[#E36A6A] text-[#E36A6A] group-hover:text-white border border-[#E36A6A]/20 flex items-center justify-center transition-all duration-300"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-sm py-4">No practice exams in this series.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MockTestSelection;
