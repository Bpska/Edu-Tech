import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const userData = await loginWithGoogle(codeResponse.code);
        toast.success('Welcome!');
        if (userData?.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        toast.error('Google sign in failed');
      }
    },
    onError: errorResponse => toast.error('Google sign in failed'),
  });

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        const userData = await login(data.email, data.password);
        toast.success('Welcome back!');
        if (userData?.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        await register(data.email, data.password, data.name);
        toast.success('Registration successful!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 glass-card overflow-hidden !p-0">

        {/* Animated Left Panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]/40 relative overflow-hidden border-r border-[#BFDBFE]/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.06),transparent_50%)]" />

          <div className="flex items-center gap-3 relative z-10">
            <GraduationCap className="w-10 h-10 text-[#1D4ED8]" />
            <span className="font-display font-bold text-2xl text-gray-900 tracking-widest">NEXUS</span>
          </div>

          <div className="relative z-10 space-y-6 my-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-display font-bold leading-tight"
            >
              Elevate Your Learning <br />
              <span className="text-[#1D4ED8]">Master Your Exams.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-lg"
            >
              Access premium practice series, detailed performance analytics, and dynamic courses designed by academics.
            </motion.p>

            <div className="flex items-center gap-4 pt-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-3 h-3 rounded-full bg-[#1D4ED8]"
              />
              <span className="text-sm text-[#1D4ED8] font-semibold tracking-wider uppercase">Interactive Exam Environment</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 relative z-10">
            &copy; 2026 Nexus Academy. All rights reserved.
          </div>
        </div>

        {/* Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isLogin
                  ? 'Enter your credentials to access your dashboard'
                  : 'Sign up to start learning and taking mock tests'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#93C5FD]"
                      {...formRegister('name')}
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    placeholder="student@nexus.com"
                    className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#93C5FD]"
                    {...formRegister('email')}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl py-3 pl-10 pr-10 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#93C5FD]"
                    {...formRegister('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1D4ED8] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-[#1E40AF] transition-all duration-200 shadow-lg shadow-[#1D4ED8]/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => googleLogin()}
              className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>

            <div className="text-center">
              <button
                onClick={toggleMode}
                className="text-[#1D4ED8] hover:underline text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
