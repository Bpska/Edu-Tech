import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const steps = [
  { id: 'exam', title: 'Target Exam', type: 'select', options: ['JEE', 'NEET', 'UPSC', 'GATE', 'CAT', 'Other'] },
  { id: 'classYear', title: 'Class / Year', type: 'select', options: ['Class 11', 'Class 12', 'Dropper', 'Undergrad', 'Graduate'] },
  { id: 'attemptYear', title: 'Exam Attempt Year', type: 'select', options: ['2024', '2025', '2026', '2027', 'Later'] },
  { id: 'skillLevel', title: 'Current Prep Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { id: 'dailyHours', title: 'Daily Study Hours', type: 'select', options: ['< 2 Hours', '2 - 4 Hours', '4 - 6 Hours', '6+ Hours'] },
  { id: 'details', title: 'More Details', type: 'multi' }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    targetExam: '',
    classYear: '',
    examAttemptYear: '',
    currentSkillLevel: '',
    dailyStudyHours: '',
    dateOfBirth: '',
    preferredLanguage: 'English',
    weakSubjects: '',
    strongSubjects: '',
    targetScoreRank: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Just to trigger a re-fetch of the user if needed, but we can do it via /auth/me or reload

  const handleSelect = (value) => {
    setFormData(prev => ({ ...prev, [steps[currentStep].id]: value }));
    // Auto advance on select steps
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/profile/onboarding', {
        ...formData,
        targetExam: formData.targetExam || formData.exam, // Handle 'exam' id vs 'targetExam' field
        examAttemptYear: formData.examAttemptYear || formData.attemptYear,
        currentSkillLevel: formData.currentSkillLevel || formData.skillLevel,
        dailyStudyHours: formData.dailyStudyHours || formData.dailyHours,
      });
      toast.success('Profile setup complete!');
      // Reload page to re-fetch AuthContext and trigger ProtectedRoute to let them in
      window.location.href = '/'; 
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-[#FFFBF1] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FFB2B2]/30 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#64FFDA]/20 rounded-full blur-3xl mix-blend-multiply" />
      
      <div className="max-w-xl w-full relative z-10">
        {/* Progress Bar */}
        <div className="mb-8 flex items-center justify-between gap-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <motion.div 
                className="h-full bg-[#E36A6A]"
                initial={{ width: '0%' }}
                animate={{ width: i <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-white/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[300px] flex flex-col"
            >
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
                {step.title}
              </h2>
              <p className="text-gray-500 mb-8">
                Help us personalize your dashboard and recommendations.
              </p>

              {step.type === 'select' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                  {step.options.map((opt) => {
                    const isSelected = formData[step.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all font-semibold flex items-center justify-between group
                          ${isSelected 
                            ? 'border-[#E36A6A] bg-[#FFF2D0] text-[#E36A6A]' 
                            : 'border-gray-100 bg-white hover:border-[#FFB2B2] hover:shadow-md text-gray-700'
                          }`}
                      >
                        {opt}
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {step.type === 'multi' && (
                <div className="space-y-4 mt-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-[#FFF2D0]/50 border border-transparent rounded-xl p-3 focus:border-[#E36A6A] outline-none" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 block">Target Score/Rank</label>
                      <input type="text" name="targetScoreRank" placeholder="e.g. Under 1000" value={formData.targetScoreRank} onChange={handleChange} className="w-full bg-[#FFF2D0]/50 border border-transparent rounded-xl p-3 focus:border-[#E36A6A] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Strong Subjects</label>
                    <input type="text" name="strongSubjects" placeholder="Physics, Math..." value={formData.strongSubjects} onChange={handleChange} className="w-full bg-[#FFF2D0]/50 border border-transparent rounded-xl p-3 focus:border-[#E36A6A] outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Weak Subjects</label>
                    <input type="text" name="weakSubjects" placeholder="Chemistry..." value={formData.weakSubjects} onChange={handleChange} className="w-full bg-[#FFF2D0]/50 border border-transparent rounded-xl p-3 focus:border-[#E36A6A] outline-none" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!formData[steps[currentStep].id]}
                className="flex items-center gap-2 bg-[#E36A6A] text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#E36A6A]/30"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#64FFDA] text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[#64FFDA]/30"
              >
                {isSubmitting ? 'Saving...' : 'Finish Setup'} <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
