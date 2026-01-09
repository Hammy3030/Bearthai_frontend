import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BookOpen, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register: authRegister, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = {
        ...data,
        role: 'TEACHER',
        school: data.school
      };
      
      const result = await authRegister(userData);
      
      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      } else if (result.success && result.requiresEmailVerification) {
        // Show message and redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
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
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-toется from-blue-600 to-purple-600 rounded-full mb-4"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">สมัครสมาชิกครู</h1>
          <p className="text-gray-600">สร้างบัญชีผู้สอนเพื่อเริ่มต้นใช้งาน BearThai</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 text-sm">
              <strong>หมายเหตุ:</strong> เฉพาะครูเท่านั้นที่สามารถสมัครสมาชิกได้ นักเรียนจะได้รับรหัสและ QR Code จากครูผู้สอน
            </p>
          </div>
        </div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            สมัครสมาชิก
          </h2>


          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'กรุณากรอกชื่อ-นามสกุล',
                  minLength: {
                    value: 2,
                    message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <input
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

            {/* School Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โรงเรียน
              </label>
              <input
                type="text"
                {...register('school', { 
                  required: 'กรุณากรอกชื่อโรงเรียน'
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="กรอกชื่อโรงเรียน"
              />
              {errors.school && (
                <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'กรุณากรอกรหัสผ่าน',
                    minLength: {
                      value: 6,
                      message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                    }
                  })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="กรอกรหัสผ่าน"
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

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', { 
                    required: 'กรุณายืนยันรหัสผ่าน',
                    validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                  })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="ยืนยันรหัสผ่าน"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังสมัครสมาชิก...</span>
                </div>
              ) : (
                'สมัครสมาชิกครู'
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              มีบัญชีแล้ว?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition duration-200"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
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

export default RegisterPage;
