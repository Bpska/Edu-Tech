import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ScoreCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const scoreDetails = location.state?.scoreDetails || { score: 4, total: 5, responses: {} };
  const { score = 0, total = 0, responses = {} } = scoreDetails;
  
  const [animatedScore, setAnimatedScore] = useState(0);

  // Count up animation
  useEffect(() => {
    let start = 0;
    const end = score;
    if (end === 0) return;
    const duration = 1000; // 1s
    const increment = end / (duration / 16); // 60fps
    
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

  // Donut Chart calculations
  const correctCount = score;
  // Mocking incorrect vs skipped count for demonstration
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
                {Math.round((score / total) * 100)}% Accuracy
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

      {/* Question Review Table */}
      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-lg text-gray-900 mb-6">Question Review</h3>
        
        <div className="space-y-4">
          {[
            { id: 'q1', text: 'Which hook should be used to store a persistent mutable value?', correct: true, answer: 'useRef' },
            { id: 'q2', text: 'What is the correct syntax to import the tag "@import" in Tailwind CSS v4?', correct: true, answer: '@import "tailwindcss";' },
            { id: 'q3', text: 'In Node.js, which built-in module is used to resolve filesystem paths securely?', correct: false, answer: 'path', chosen: 'fs' },
          ].map((item, idx) => (
            <div key={item.id} className="p-4 bg-[#FFF2D0] border border-[#E36A6A]/10 rounded-xl flex items-start gap-4 justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">Q{idx + 1}</span>
                  <p className="text-sm font-semibold text-gray-900">{item.text}</p>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Correct answer: <span className="text-[#E36A6A] font-medium">{item.answer}</span></p>
                  {!item.correct && (
                    <p className="mt-0.5">Your answer: <span className="text-red-400 font-medium">{item.chosen}</span></p>
                  )}
                </div>
              </div>

              <div>
                {item.correct ? (
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
          ))}
        </div>
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
