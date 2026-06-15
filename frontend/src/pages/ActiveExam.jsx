import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckSquare, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ActiveExam = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // Record<questionId, optionIndex>
  const [flagged, setFlagged] = useState([]); // Array<questionId>
  
  const [testDetails, setTestDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef(null);

  // 1. Fetch Questions & Test Details
  useEffect(() => {
    const startExamData = async () => {
      try {
        const detailsRes = await api.get(`/tests/${testId}`);
        const questionsRes = await api.get(`/tests/${testId}/questions`);
        
        setTestDetails(detailsRes.data);
        
        const parsedQuestions = questionsRes.data.map(q => {
          let opts = [];
          try {
            const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            opts = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
            if (!Array.isArray(opts)) opts = [];
          } catch (e) {
            opts = [];
          }
          return { ...q, options: opts };
        });
        setQuestions(parsedQuestions);

        // Notify backend we started
        await api.post('/exam/start', { testId });

        // Load saved progress from localStorage if exists
        const savedAnswers = localStorage.getItem(`exam_answers_${testId}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }

        const savedFlagged = localStorage.getItem(`exam_flagged_${testId}`);
        if (savedFlagged) {
          setFlagged(JSON.parse(savedFlagged));
        }

        // Initialize Timer
        const savedTime = localStorage.getItem(`exam_timer_${testId}`);
        if (savedTime) {
          setTimeLeft(parseInt(savedTime, 10));
        } else {
          setTimeLeft(detailsRes.data.duration * 60);
        }

        setLoading(false);
      } catch (err) {
        // Fallback Mock Data for testing
        const mockQuestions = [
          {
            id: 'q1',
            text: 'Which hook should be used to store a persistent mutable value that does not trigger a re-render when updated?',
            options: ['useState', 'useRef', 'useEffect', 'useMemo']
          },
          {
            id: 'q2',
            text: 'What is the correct syntax to import the tag "@import" in Tailwind CSS v4?',
            options: ['@import "tailwindcss";', '@tailwind base;', '@use "tailwindcss";', 'import "tailwindcss"']
          },
          {
            id: 'q3',
            text: 'In Node.js, which built-in module is used to resolve filesystem paths securely?',
            options: ['fs', 'url', 'path', 'http']
          },
          {
            id: 'q4',
            text: 'Which HTTP status code represents a resource that has been permanently redirected to a new URI?',
            options: ['301 Moved Permanently', '302 Found', '307 Temporary Redirect', '308 Permanent Redirect']
          },
          {
            id: 'q5',
            text: 'What does PWA stand for?',
            options: ['Programmed Web Assistant', 'Progressive Web Application', 'Private Web Authorization', 'Pixel Wide Alignment']
          }
        ];
        setQuestions(mockQuestions);
        setTestDetails({
          title: 'Fullstack Dev Evaluation Test',
          duration: 10,
        });
        
        const savedAnswers = localStorage.getItem(`exam_answers_${testId}`);
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        
        const savedFlagged = localStorage.getItem(`exam_flagged_${testId}`);
        if (savedFlagged) setFlagged(JSON.parse(savedFlagged));

        const savedTime = localStorage.getItem(`exam_timer_${testId}`);
        setTimeLeft(savedTime ? parseInt(savedTime, 10) : 10 * 60);
        setLoading(false);
      }
    };

    startExamData();
  }, [testId]);

  // 2. Countdown Timer Loop — uses a ref to avoid stale-closure / dep-array re-mount bug
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      const nextTime = timeLeftRef.current - 1;
      if (nextTime <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        handleAutoSubmit();
        return;
      }
      setTimeLeft(nextTime);
      timeLeftRef.current = nextTime;
      // Sync to localStorage every 5s
      if (nextTime % 5 === 0) {
        localStorage.setItem(`exam_timer_${testId}`, nextTime.toString());
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, testId]); // FIX: removed timeLeft from deps to stop interval re-creation every tick


  // 3. Sync Answers and Flagged status to LocalStorage
  const handleSelectOption = (qId, optIdx) => {
    const updated = { ...answers, [qId]: optIdx };
    setAnswers(updated);
    localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(updated));
  };

  const handleToggleFlag = (qId) => {
    let updated;
    if (flagged.includes(qId)) {
      updated = flagged.filter(id => id !== qId);
    } else {
      updated = [...flagged, qId];
    }
    setFlagged(updated);
    localStorage.setItem(`exam_flagged_${testId}`, JSON.stringify(updated));
  };

  // 4. Fullscreen Control
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => toast.error('Error enabling fullscreen mode'));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 5. Submit Exam
  const handleAutoSubmit = () => {
    toast.error('Time is up! Submitting your responses.');
    submitExam();
  };

  const submitExam = async () => {
    clearInterval(timerRef.current);
    const loadingToast = toast.loading('Evaluating answers...');
    try {
      const res = await api.post('/exam/submit', { testId, responses: answers });
      toast.dismiss(loadingToast);
      toast.success('Exam submitted successfully!');
      
      // Clear localStorage progress
      localStorage.removeItem(`exam_timer_${testId}`);
      localStorage.removeItem(`exam_answers_${testId}`);
      localStorage.removeItem(`exam_flagged_${testId}`);
      
      // Navigate to score analytics
      navigate(`/score/${res.data.historyId || 'mock-id'}`, { state: { scoreDetails: res.data } });
    } catch (err) {
      toast.dismiss(loadingToast);
      // Fallback submission score for mock review
      const correctCount = questions.reduce((acc, curr, idx) => {
        // Mock correct answer is 1 for testing
        return acc + (answers[curr.id] === 1 ? 1 : 0);
      }, 0);
      
      localStorage.removeItem(`exam_timer_${testId}`);
      localStorage.removeItem(`exam_answers_${testId}`);
      localStorage.removeItem(`exam_flagged_${testId}`);
      
      navigate(`/score/mock-history`, { 
        state: { 
          scoreDetails: {
            score: correctCount,
            total: questions.length,
            responses: answers
          }
        } 
      });
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading exam interface...</div>;
  }

  const currentQuestion = questions[currentIdx];
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col min-h-screen bg-[#FFFBF1] text-gray-200 ${isFullscreen ? 'fixed inset-0 z-50 p-6' : ''}`}>
      {/* Distraction-Free Header */}
      <div className="flex items-center justify-between border-b border-[#E36A6A]/20 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">{testDetails?.title}</h2>
          <span className="text-xs text-gray-500">Attempt all questions before submitting.</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-mono font-bold">
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>

          {/* Fullscreen Button */}
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 bg-[#FFF2D0] border border-[#E36A6A]/20 rounded-xl hover:bg-[#FFB2B2]/20 text-gray-600 hover:text-gray-900 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 Cols: Active Question Area */}
        <div className="lg:col-span-3 glass-card flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-[#E36A6A] tracking-widest uppercase">
                Question {currentIdx + 1} of {questions.length}
              </span>
              
              <button 
                onClick={() => handleToggleFlag(currentQuestion?.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  flagged.includes(currentQuestion?.id)
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    : 'bg-[#FFF2D0] border-[#E36A6A]/20 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {flagged.includes(currentQuestion?.id) ? 'Flagged' : 'Flag for Review'}
              </button>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
              {currentQuestion?.text}
            </h3>

            {/* Custom Radios (A/B/C/D) */}
            <div className="space-y-4">
              {currentQuestion?.options.map((opt, oIdx) => {
                const label = ['A', 'B', 'C', 'D'][oIdx];
                const isSelected = answers[currentQuestion.id] === oIdx;
                
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                      isSelected
                        ? 'bg-[#E36A6A]/10 border-teal text-gray-900 shadow-lg shadow-teal/5'
                        : 'bg-[#FFF2D0] border-[#E36A6A]/20 text-gray-700 hover:bg-[#FFB2B2]/20 hover:border-white/20'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                      isSelected ? 'bg-[#E36A6A] text-white' : 'bg-[#FFB2B2]/20 text-gray-600'
                    }`}>
                      {label}
                    </span>
                    <span className="font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex justify-between items-center border-t border-[#E36A6A]/20 pt-6 mt-8">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 px-4 py-2.5 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 border border-[#E36A6A]/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-1 px-5 py-2.5 bg-[#E36A6A] text-white font-bold rounded-xl text-sm transition-all hover:bg-opacity-95"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submitExam}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E36A6A] text-white font-bold rounded-xl text-sm transition-all hover:bg-opacity-95 shadow-lg shadow-[#E36A6A]/20"
              >
                <CheckSquare className="w-4 h-4" /> Submit Test
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Question Palette Sidebar */}
        <div className="glass-card">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-6">Question Palette</h3>
          
          <div className="grid grid-cols-5 gap-3 mb-6">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = flagged.includes(q.id);
              const isCurrent = idx === currentIdx;

              let style = 'bg-[#FFF2D0] text-gray-600 border border-[#E36A6A]/10';
              if (isAnswered) style = 'bg-[#E36A6A]/20 text-[#E36A6A] border border-teal/30';
              if (isFlagged) style = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
              if (isCurrent) style += ' ring-2 ring-teal ring-offset-2 ring-offset-navy';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`aspect-square rounded-xl font-bold text-sm flex items-center justify-center transition-all ${style}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#E36A6A]/20 pt-4 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#FFF2D0] border border-[#E36A6A]/20" />
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#E36A6A]/20 border border-teal/30" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30" />
              <span>Flagged for Review</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActiveExam;
