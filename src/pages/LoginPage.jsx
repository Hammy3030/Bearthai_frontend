import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('teacher'); // 'teacher' or 'student'
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      if (loginType === 'teacher') {
        await login(data);
      } else {
        // For students, login with student code only (no password required)
        await login({
          email: data.studentCode?.toUpperCase(), // Student code (e.g., STU001)
          password: '' // No password required for student login
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">BearThai</h1>
          <p className="text-gray-600">ระบบเรียนภาษาไทย ป.1 แบบ Interactive</p>
        </div>

        {/* Login Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-4"
        >
          <div className="flex space-x-4">
            <button
              onClick={() => setLoginType('teacher')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition duration-200 ${
                loginType === 'teacher'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ครู
            </button>
            <button
              onClick={() => setLoginType('student')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition duration-200 ${
                loginType === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              นักเรียน
            </button>
          </div>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginType === 'teacher' ? (
              <>
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมล
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'กรุณากรอกอีเมล',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'รูปแบบอีเมลไม่ถูกต้อง'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="กรอกอีเมลของคุณ"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', { 
                        required: 'กรุณากรอกรหัสผ่าน',
                        minLength: {
                          value: 6,
                          message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                        }
                      })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="กรอกรหัสผ่านของคุณ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Student Code Input */}
                <div>
                  <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสนักเรียน
                  </label>
                  <input
                    id="studentCode"
                    type="text"
                    {...register('studentCode', { 
                      required: 'กรุณากรอกรหัสนักเรียน',
                      pattern: {
                        value: /^STU\d{3}$/i,
                        message: 'รหัสนักเรียนต้องเป็นรูปแบบ STU001, STU002, ...'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 uppercase"
                    placeholder="กรอกรหัสนักเรียน (เช่น STU001)"
                    maxLength={6}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.studentCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.studentCode.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </motion.button>
          </form>


          {/* Info for Teachers */}
          {loginType === 'teacher' && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                ยังไม่มีบัญชีครู?{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-700 font-medium transition duration-200"
                >
                  สมัครสมาชิกครู
                </Link>
              </p>
            </div>
          )}

          {/* Info for Students */}
          {loginType === 'student' && (
            <div className="mt-6 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>สำหรับนักเรียน:</strong> รหัสนักเรียนจะได้รับจากครูผู้สอน
                </p>
              </div>
            </div>
          )}

          {/* Help Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              ต้องการความช่วยเหลือ?{' '}
              <Link to="/help" className="text-indigo-600 hover:text-indigo-700 font-medium transition duration-200">
                คู่มือการใช้งาน
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <GraduationCap size={16} />
            <span className="text-sm">ระบบเรียนรู้ภาษาไทย ป.1</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
