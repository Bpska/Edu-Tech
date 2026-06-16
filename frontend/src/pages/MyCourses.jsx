import { useEffect, useState } from 'react';
import api from '../utils/api';
import { BookOpen, Lock, Unlock, PlayCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MyCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer states
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('summary'); // 'summary' | 'processing' | 'success' | 'failed'
  
  const [learningCourse, setLearningCourse] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [learningLoading, setLearningLoading] = useState(false);

  const fetchCoursesAndPurchases = async () => {
    try {
      const [coursesRes, purchasesRes, historyRes] = await Promise.all([
        api.get('/courses'),
        api.get('/user/courses').catch(() => ({ data: [] })),
        api.get('/user/exam-history').catch(() => ({ data: [] }))
      ]);
      
      // Build a set of completed test IDs
      const completedTestIds = new Set(historyRes.data.map(h => h.testId));
      
      // Fetch detailed course data to get test lists for progress calculation
      const coursesWithProgress = await Promise.all(
        coursesRes.data.map(async (course) => {
          try {
            const detailRes = await api.get(`/courses/${course.id}`);
            const totalTests = detailRes.data.tests?.length || 0;
            const completedTests = detailRes.data.tests?.filter(t => completedTestIds.has(t.id)).length || 0;
            const progress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
            return { ...course, progress, tests: detailRes.data.tests || [] };
          } catch {
            return { ...course, progress: 0 };
          }
        })
      );
      
      setCourses(coursesWithProgress);
      setPurchasedCourseIds(purchasesRes.data.map(c => c.id));
    } catch (err) {
      // Mock Data if API fails/empty
      setCourses([
        { id: '1', title: 'React.js & Tailwind CSS Architecture', description: 'Build premium PWAs using modern CSS methodologies and custom layout animations.', price: 0, progress: 65 },
        { id: '2', title: 'Node.js Express REST API Essentials', description: 'Design clean backend route structures with middleware-based JWT auth validation.', price: 0, progress: 20 },
        { id: '3', title: 'Advanced System Architectures & Scaling', description: 'Scale database configurations, integrate webhooks, and orchestrate server resources.', price: 599, progress: 0 },
        { id: '4', title: 'Payment Integrations & Webhook Unlocks', description: 'Master Razorpay API integrations and secure webhook-driven course releases.', price: 399, progress: 0 }
      ]);
      setPurchasedCourseIds(['1', '2']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndPurchases();

    // Dynamically load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUnlockClick = (course) => {
    setSelectedCourse(course);
    setCheckoutStep('summary');
  };

  const handleContinueLearning = async (course) => {
    setLearningCourse(course);
    setLearningLoading(true);
    try {
      const res = await api.get(`/courses/${course.id}`);
      setLearningData(res.data);
    } catch {
      toast.error('Failed to load course details');
    } finally {
      setLearningLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCourse) return;
    setCheckoutStep('processing');
    
    try {
      // 1. Create order on backend
      const orderRes = await api.post('/payment/create-order', { courseId: selectedCourse.id });
      const orderData = orderRes.data;

      // 2. Configure Razorpay checkout options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Nexus Academy',
        description: `Unlock ${selectedCourse.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setCheckoutStep('processing');
            // Call backend signature verification
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setCheckoutStep('success');
            toast.success('Payment completed successfully!');
            await fetchCoursesAndPurchases();
          } catch (verifyErr) {
            setCheckoutStep('failed');
            toast.error(verifyErr.response?.data?.error || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#E36A6A',
        },
        modal: {
          ondismiss: function () {
            setCheckoutStep('summary');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (orderErr) {
      console.error('Checkout initialization error:', orderErr);
      toast.error(orderErr.response?.data?.error || 'Failed to initialize Razorpay checkout order.');
      setCheckoutStep('summary');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-600">Loading courses library...</div>;
  }

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">Learning Courses</h1>
        <p className="text-gray-600 mt-2">Access your lessons or unlock professional engineering series.</p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isPurchased = course.price === 0 || purchasedCourseIds.includes(course.id);
          const progress = course.progress || 0;

          return (
            <div 
              key={course.id} 
              className={`glass-card flex flex-col justify-between border transition-all ${
                isPurchased ? 'border-[#E36A6A]/20 hover:border-teal/30' : 'border-[#E36A6A]/10 opacity-80'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-[#E36A6A]/10 rounded-xl text-[#E36A6A] border border-[#E36A6A]/20">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {!isPurchased && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Lock className="w-3 h-3" /> ₹{course.price}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 truncate">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-6">
                  {course.description}
                </p>
              </div>

              <div>
                {isPurchased ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>Course Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#FFF2D0] rounded-full h-2 overflow-hidden border border-[#E36A6A]/10">
                      <div 
                        className="bg-[#E36A6A] h-full transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <button 
                      onClick={() => handleContinueLearning(course)}
                      className="w-full py-2.5 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 border border-[#E36A6A]/20 text-gray-900 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      <PlayCircle className="w-4 h-4 text-[#E36A6A]" /> Continue Learning
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUnlockClick(course)}
                    className="w-full py-3 bg-[#E36A6A] text-white font-bold rounded-xl text-sm transition-all hover:bg-opacity-95 shadow-lg shadow-[#E36A6A]/20 flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" /> Unlock Course
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-Up Checkout Drawer */}
      <AnimatePresence>
        {selectedCourse && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)}
              className="fixed inset-0 bg-gray-900/50 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFBF1] border-t border-[#E36A6A]/20 rounded-t-3xl p-8 max-w-2xl mx-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-xl text-gray-900">Course Checkout</h3>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-1.5 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {checkoutStep === 'summary' && (
                <div className="space-y-6">
                  <div className="p-4 bg-[#FFF2D0] rounded-2xl border border-[#E36A6A]/10">
                    <h4 className="font-display font-semibold text-gray-900">{selectedCourse.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{selectedCourse.description}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-b border-[#E36A6A]/20 py-4 font-semibold text-gray-900">
                    <span>Course Subtotal</span>
                    <span className="text-[#E36A6A] font-display text-xl">₹{selectedCourse.price}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-[#E36A6A] text-white font-bold rounded-xl hover:bg-opacity-95 transition-all text-base shadow-lg shadow-[#E36A6A]/20 flex items-center justify-center gap-2"
                  >
                    Pay with Razorpay
                  </button>
                </div>
              )}

              {checkoutStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-[#E36A6A] animate-spin" />
                  <p className="font-semibold text-gray-900">Contacting Gateway...</p>
                  <p className="text-sm text-gray-600">Please do not close this browser or refresh.</p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <div className="p-4 bg-[#E36A6A]/10 border border-[#E36A6A]/20 rounded-full text-[#E36A6A]">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-2xl text-gray-900">Payment Successful!</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      Your transaction was completed successfully. Access has been unlocked.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="px-6 py-2.5 bg-[#E36A6A] text-white font-bold rounded-lg text-sm hover:bg-opacity-95 transition-all"
                  >
                    Go to Course
                  </button>
                </div>
              )}

              {checkoutStep === 'failed' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
                    <X className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-2xl text-gray-900">Payment Failed</h4>
                    <p className="text-sm text-gray-600 mt-2">
                      We were unable to verify your order confirmation. Please try again.
                    </p>
                  </div>
                  <button
                    onClick={() => setCheckoutStep('summary')}
                    className="px-6 py-2.5 bg-[#FFF2D0] border border-[#E36A6A]/20 text-gray-900 rounded-lg text-sm hover:bg-[#FFB2B2]/20 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Slide-Up Learning Drawer */}
      <AnimatePresence>
        {learningCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={() => setLearningCourse(null)}
              className="fixed inset-0 bg-gray-900/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFBF1] border-t border-[#E36A6A]/20 rounded-t-3xl p-8 max-w-4xl mx-auto shadow-2xl h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-display font-bold text-xl text-gray-900">{learningCourse.title} - Materials</h3>
                <button 
                  onClick={() => setLearningCourse(null)}
                  className="p-1.5 bg-[#FFF2D0] hover:bg-[#FFB2B2]/20 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {learningLoading ? (
                  <div className="text-center py-10 text-gray-600">Loading course materials...</div>
                ) : !learningData ? (
                  <div className="text-center py-10 text-red-400">Error loading materials.</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Resources</h4>
                      {!learningData.resources || learningData.resources.length === 0 ? (
                        <p className="text-sm text-gray-600">No resources available for this course yet.</p>
                      ) : (
                        <div className="grid gap-3">
                          {learningData.resources.map(r => (
                            <div key={r.id} className="p-4 bg-[#FFF2D0] border border-[#E36A6A]/20 rounded-xl flex items-center justify-between">
                              <div>
                                <h5 className="font-semibold text-gray-900">{r.title}</h5>
                                <p className="text-xs text-gray-600 mt-1">{r.type}</p>
                              </div>
                              {r.type === 'VIDEO' || r.type === 'DOCUMENT' ? (
                                <a href={r.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#E36A6A]/10 text-[#E36A6A] rounded-lg text-sm font-semibold hover:bg-[#E36A6A]/20 transition-colors">
                                  View / Watch
                                </a>
                              ) : (
                                <button onClick={() => alert(r.content)} className="px-4 py-2 bg-[#E36A6A]/10 text-[#E36A6A] rounded-lg text-sm font-semibold hover:bg-[#E36A6A]/20 transition-colors">
                                  Read Text
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyCourses;
