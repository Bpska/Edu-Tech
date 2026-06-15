import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, BookOpen, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const ScoreCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const scoreDetails = location.state?.scoreDetails || { score: 0, total: 0, responses: {} };
  const { score = 0, total = 0, responses = {} } = scoreDetails;
  
  const [animatedScore, setAnimatedScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loadingQs, setLoadingQs] = useState(false);

  // Count up animation
  useEffect(() => {
    let start = 0;
    const end = score;
    if (end === 0) return;
    const duration = 1000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setAnimatedScore(end);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  // Fetch the full test questions (with correct answers) via exam history
  // The historyId (id param) gives us the testId to look up
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!id || id === 'mock-history') return;
      setLoadingQs(true);
      try {
        // Fetch exam history record to get the testId
        const historyRes = await api.get('/user/exam-history');
        const record = historyRes.data.find(h => h.id === id);
        if (!record) return;
        
        // Now fetch full test (admin endpoint includes correct answers)
        // Use the user-facing test details and parse questions from record.responses
        const testRes = await api.get(`/tests/${record.testId}`);
        const testQuestionsRes = await api.get(`/admin/tests/${record.testId}/questions`);
        
        const parsedQs = testQuestionsRes.data.map(q => {
          let opts = [];
          try {
            const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            opts = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
            if (!Array.isArray(opts)) opts = [];
          } catch { opts = []; }
          return { ...q, options: opts };
        });
        setQuestions(parsedQs);
      } catch (err) {
        // Questions can't be loaded — show partial review
        setQuestions([]);
      } finally {
        setLoadingQs(false);
      }
    };
    fetchQuestions();
  }, [id]);

  // Donut Chart calculations
  const correctCount = score;
  const skippedCount = total - Object.keys(responses || {}).length;
  const wrongCount = Math.max(0, total - correctCount - skippedCount);

  const correctPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const wrongPct = total > 0 ? Math.round((wrongCount / total) * 100) : 0;
  const skippedPct = total > 0 ? Math.round((skippedCount / total) * 100) : 0;

  // SVG parameters for donut chart
  const size = 180;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const getStrokeOffset = (pct) => circ - (pct / 100) * circ;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/tests')}
          className="p-2 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 border border-[#E36A6A]/20 rounded-xl text-gray-600 hover:text-gray-900 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Exam Analysis</h1>
          <p className="text-gray-600 text-sm">Detailed performance breakdown and answers evaluation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Animated Score Card */}
        <div className="glass-card flex flex-col justify-center items-center text-center p-8 border-[#E36A6A]/20">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-6">Your Score</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-[#E36A6A]/5 border border-teal/10 shadow-2xl">
            <div className="text-center">
              <motion.span 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-5xl font-display font-bold text-[#E36A6A]"
              >
                {animatedScore}
              </motion.span>
              <span className="text-gray-500 font-medium text-lg"> / {total}</span>
              <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mt-1">
                {total > 0 ? Math.round((score / total) * 100) : 0}% Accuracy
              </p>
            </div>
          </div>

          <p className="text-gray-600 text-sm mt-6">
            {correctPct >= 80 ? 'Excellent job! You have fully mastered this topic.' : 'Good attempt. Review the concepts and try again.'}
          </p>
        </div>

        {/* Donut Chart Analytics */}
        <div className="glass-card md:col-span-2 p-8 flex flex-col md:flex-row items-center justify-around gap-8">
          <div>
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-4 text-center md:text-left">Performance Ratio</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#E36A6A]" />
                <span className="text-sm text-gray-700 w-24">Correct</span>
                <span className="text-sm font-bold text-gray-900">{correctPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-sm text-gray-700 w-24">Incorrect</span>
                <span className="text-sm font-bold text-gray-900">{wrongPct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm text-gray-700 w-24">Skipped</span>
                <span className="text-sm font-bold text-gray-900">{skippedPct}%</span>
              </div>
            </div>
          </div>

          {/* SVG Donut */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Skipped segment */}
              <circle
                stroke="#6B7280"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={r}
                cx={size / 2}
                cy={size / 2}
              />
              {/* Incorrect segment */}
              <circle
                stroke="#F87171"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circ}
                strokeDashoffset={getStrokeOffset(wrongPct + correctPct)}
                r={r}
                cx={size / 2}
                cy={size / 2}
              />
              {/* Correct segment */}
              <circle
                stroke="#E36A6A"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circ}
                strokeDashoffset={getStrokeOffset(correctPct)}
                r={r}
                cx={size / 2}
                cy={size / 2}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <span className="text-2xl font-bold text-gray-900">{correctCount}</span>
                <p className="text-[10px] text-gray-600 font-semibold uppercase">Correct</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Review Table — uses real questions + responses when available */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-lg text-gray-900 mb-6">Question Review</h3>
        
        {loadingQs ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading question details...</div>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = responses[q.id]; // undefined if skipped
              const isSkipped = userAnswer === undefined;
              const isCorrect = !isSkipped && userAnswer === q.correctAnswerIndex;
              const correctOptionText = q.options[q.correctAnswerIndex];
              const chosenOptionText = !isSkipped ? q.options[userAnswer] : null;

              return (
                <div key={q.id} className="p-4 bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl flex items-start gap-4 justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-bold">Q{idx + 1}</span>
                      <p className="text-sm font-semibold text-gray-900">{q.text}</p>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>Correct answer: <span className="text-[#E36A6A] font-medium">{correctOptionText}</span></p>
                      {!isCorrect && !isSkipped && (
                        <p>Your answer: <span className="text-red-400 font-medium">{chosenOptionText}</span></p>
                      )}
                      {isSkipped && (
                        <p className="text-gray-500 italic">Not attempted</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isSkipped ? (
                      <span className="flex items-center gap-1 text-gray-500 bg-gray-500/10 px-2 py-1 rounded text-xs font-bold">
                        <MinusCircle className="w-3.5 h-3.5" /> Skipped
                      </span>
                    ) : isCorrect ? (
                      <span className="flex items-center gap-1 text-[#E36A6A] bg-[#E36A6A]/10 px-2 py-1 rounded text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback: summary only (when questions can't be fetched — e.g. mock exam)
          <div className="text-center py-8 space-y-3">
            <p className="text-gray-500 text-sm">Detailed question review is available for registered tests.</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-3 bg-[#E36A6A]/10 border border-[#E36A6A]/20 rounded-xl text-center">
                <p className="text-xl font-bold text-[#E36A6A]">{correctCount}</p>
                <p className="text-[10px] text-gray-600 uppercase font-semibold mt-1">Correct</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-xl font-bold text-red-400">{wrongCount}</p>
                <p className="text-[10px] text-gray-600 uppercase font-semibold mt-1">Wrong</p>
              </div>
              <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-xl text-center">
                <p className="text-xl font-bold text-gray-500">{skippedCount}</p>
                <p className="text-[10px] text-gray-600 uppercase font-semibold mt-1">Skipped</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={() => navigate('/tests')}
          className="flex items-center gap-2 px-6 py-3 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 border border-[#E36A6A]/20 rounded-xl text-sm font-semibold text-gray-900 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Retry Test
        </button>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-[#E36A6A] text-white font-bold rounded-xl text-sm transition-all hover:bg-opacity-95 shadow-lg shadow-[#E36A6A]/20"
        >
          <BookOpen className="w-4 h-4" /> Explore Courses
        </button>
      </div>
    </div>
  );
};

export default ScoreCard;
