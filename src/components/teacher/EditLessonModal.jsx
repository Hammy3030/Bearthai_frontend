import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';

const EditLessonModal = ({ onClose, onSubmit, lesson, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: lesson?.title || '',
      content: lesson?.content || '',
      category: lesson?.category || 'consonants',
      chapter: lesson?.chapter || '1',
      order: lesson?.orderIndex || 1
    }
  });

  const currentOrder = watch('order');

  useEffect(() => {
    if (lesson) {
      setValue('title', lesson.title);
      setValue('content', lesson.content);
      setValue('category', lesson.category || 'consonants');
      setValue('chapter', lesson.chapter || '1');
      setValue('order', lesson.orderIndex);
    }
  }, [lesson, setValue]);

  const handleFormSubmit = (data) => {
    onSubmit({
      title: data.title,
      content: data.content,
      category: data.category,
      chapter: data.chapter,
      orderIndex: data.order
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {lesson ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียน'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition duration-200"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบทเรียน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('title', {
                    required: 'กรุณากรอกชื่อบทเรียน',
                    minLength: {
                      value: 2,
                      message: 'ชื่อบทเรียนต้องมีอย่างน้อย 2 ตัวอักษร'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="ตัวอย่าง: บทที่ 1: สระ อา"
                  disabled={isLoading}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหาบทเรียน <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="6"
                  {...register('content', {
                    required: 'กรุณากรอกเนื้อหาบทเรียน',
                    minLength: {
                      value: 10,
                      message: 'เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร'
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
                  placeholder="รายละเอียดเนื้อหาบทเรียน..."
                  disabled={isLoading}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category', { required: 'กรุณาเลือกหมวดหมู่' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    disabled={isLoading}
                  >
                    <option value="consonants">พยัญชนะ</option>
                    <option value="vowels">สระ</option>
                    <option value="words">คำพยางค์เดียว</option>
                    <option value="sentences">การแต่งประโยค</option>
                  </select>
                </div>

                {/* Chapter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    บทที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('chapter', { required: 'กรุณาระบุบทที่' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="เช่น 1, 2, 1.1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ลำดับการแสดงผล
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('order', Math.max(1, currentOrder - 1))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || currentOrder <= 1}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    {...register('order', {
                      required: 'กรุณาระบุลำดับ',
                      min: { value: 1, message: 'ลำดับต้องเป็น 1 ขึ้นไป' }
                    })}
                    className="w-20 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-center"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setValue('order', currentOrder + 1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {errors.order && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.order.message}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition duration-200"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    บันทึก
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditLessonModal;

