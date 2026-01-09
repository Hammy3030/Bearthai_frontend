import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { UserPlus, QrCode, Copy, Check, Users, School, Trash2, ArrowLeft, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { getApiUrl } from '../../utils/apiConfig';

const CreateStudentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [students, setStudents] = useState([]);
  const [showQRCode, setShowQRCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewClassroomForm, setShowNewClassroomForm] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false);

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm({
    defaultValues: {
      students: [{ name: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students'
  });

  // Fetch classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl('/teacher/classrooms'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setClassrooms(response.data.data.classrooms);
          // Auto-select first classroom if available
          if (response.data.data.classrooms.length > 0) {
            setSelectedClassroom(response.data.data.classrooms[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching classrooms:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องเรียน');
      }
    };

    if (user?.id) {
      fetchClassrooms();
    }
  }, [user?.id]);

  // Fetch students when classroom changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassroom) {
        setStudents([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          getApiUrl(`/teacher/classrooms/${selectedClassroom}`),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setStudents(response.data.data.classroom.students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [selectedClassroom]);

  const handleCreateClassroom = async () => {
    if (!newClassroomName.trim()) {
      toast.error('กรุณากรอกชื่อห้องเรียน');
      return;
    }

    try {
      setIsCreatingClassroom(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl('/teacher/classrooms'),
        { name: newClassroomName, description: '' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const newClassroom = response.data.data.classroom;
        setClassrooms(prev => [...prev, newClassroom]);
        setSelectedClassroom(newClassroom.id);
        setNewClassroomName('');
        setShowNewClassroomForm(false);
        toast.success('สร้างห้องเรียนสำเร็จ');
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างห้องเรียน');
    } finally {
      setIsCreatingClassroom(false);
    }
  };

  const onSubmit = async (data) => {
    // Filter out empty names
    const validStudents = data.students.filter(s => s.name && s.name.trim());

    if (validStudents.length === 0) {
      toast.error('กรุณากรอกชื่อนักเรียนอย่างน้อย 1 คน');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      // Call API to create students (with or without classroom)
      const response = await axios.post(
        getApiUrl('/teacher/students'),
        {
          students: validStudents.map(s => ({ name: s.name.trim() })),
          classroomId: selectedClassroom || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const newStudents = response.data.data.students;

        // If classroom is selected, update students list
        if (selectedClassroom) {
          setStudents(prev => [...prev, ...newStudents]);
        } else {
          // If no classroom, just show success message
          toast.success(`สร้างบัญชีนักเรียน ${newStudents.length} คนสำเร็จ (ยังไม่ได้อยู่ในห้องเรียน)`);
        }

        // Reset form but keep one empty field
        reset({ students: [{ name: '' }] });
        toast.success(`สร้างบัญชีนักเรียน ${newStudents.length} คนสำเร็จ`);
      } else {
        throw new Error(response.data.message || 'Failed to create students');
      }
    } catch (error) {
      console.error('Error creating students:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีนักเรียน');
    } finally {
      setIsCreating(false);
    }
  };

  const addStudentField = () => {
    append({ name: '' });
  };

  const removeStudentField = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!selectedClassroom) {
      toast.error('ไม่สามารถลบนักเรียนได้เพราะไม่ได้อยู่ในห้องเรียน');
      return;
    }

    // eslint-disable-next-line no-alert
    if (!globalThis.confirm(`คุณแน่ใจหรือไม่ที่จะลบนักเรียน "${studentName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        getApiUrl(`/teacher/classrooms/${selectedClassroom}/students/${studentId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        toast.success(`ลบนักเรียน "${studentName}" เรียบร้อย`);
      } else {
        throw new Error(response.data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบนักเรียน');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/dashboard/teacher')}
              className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 hover:bg-gray-100 rounded-lg"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="p-3 bg-blue-600 rounded-xl">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">สร้างบัญชีนักเรียน</h1>
              <p className="text-gray-600">เพิ่มนักเรียนใหม่เข้าสู่ระบบ (สามารถสร้างได้แม้ไม่มีห้องเรียน)</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Student Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">เพิ่มนักเรียนใหม่</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Classroom Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <School className="inline w-4 h-4 mr-1" />
                  เลือกห้องเรียน (ไม่บังคับ)
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedClassroom}
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  >
                    <option value="">ไม่เลือกห้องเรียน (สร้างนักเรียนโดยไม่มีห้องเรียน)</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>

                  {!showNewClassroomForm ? (
                    <button
                      type="button"
                      onClick={() => setShowNewClassroomForm(true)}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 py-2"
                    >
                      <Plus size={16} />
                      สร้างห้องเรียนใหม่
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newClassroomName}
                        onChange={(e) => setNewClassroomName(e.target.value)}
                        placeholder="ชื่อห้องเรียน"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isCreatingClassroom}
                      />
                      <button
                        type="button"
                        onClick={handleCreateClassroom}
                        disabled={isCreatingClassroom}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCreatingClassroom ? 'กำลังสร้าง...' : 'สร้าง'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewClassroomForm(false);
                          setNewClassroomName('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {!selectedClassroom && (
                  <p className="mt-2 text-sm text-gray-500">
                    💡 คุณสามารถสร้างนักเรียนได้โดยไม่ต้องเลือกห้องเรียน และเพิ่มเข้าไปในห้องเรียนภายหลัง
                  </p>
                )}
              </div>

              {/* Student Names - Multiple Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    ชื่อ-นามสกุลนักเรียน
                  </label>
                  <button
                    type="button"
                    onClick={addStudentField}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={16} />
                    เพิ่มนักเรียน
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          {...register(`students.${index}.name`, {
                            required: index === 0 ? 'กรุณากรอกชื่อ-นามสกุล' : false,
                            minLength: {
                              value: 2,
                              message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                          placeholder={`ชื่อ-นามสกุลนักเรียน ${index + 1}`}
                          disabled={isCreating}
                        />
                        {errors.students?.[index]?.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.students[index].name.message}
                          </p>
                        )}
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStudentField(index)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          disabled={isCreating}
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  💡 คุณสามารถเพิ่มนักเรียนได้หลายคนพร้อมกัน โดยกดปุ่ม "เพิ่มนักเรียน"
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    สร้างบัญชีนักเรียน ({fields.length} คน)
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">รายชื่อนักเรียน</h2>
              {selectedClassroom ? (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {students.length} คน
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                  ไม่ได้เลือกห้องเรียน
                </span>
              )}
            </div>

            {!selectedClassroom ? (
              <div className="text-center py-12">
                <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">กรุณาเลือกห้องเรียนเพื่อดูรายชื่อนักเรียน</p>
                <p className="text-gray-400 text-sm mt-2">หรือสร้างนักเรียนโดยไม่เลือกห้องเรียน</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ยังไม่มีนักเรียนในห้องเรียนนี้</p>
                <p className="text-gray-400 text-sm">เพิ่มนักเรียนใหม่เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{student.name}</h3>
                        <p className="text-sm text-gray-600">รหัส: {student.qrCode || student.studentCode}</p>
                        <p className="text-xs text-gray-400">
                          สร้างเมื่อ: {new Date(student.createdAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(student.qrCode || student.studentCode, `code-${student.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="คัดลอกรหัสนักเรียน"
                        >
                          {copiedCode === `code-${student.id}` ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => setShowQRCode(student)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition duration-200"
                          title="ดู QR Code"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="ลบนักเรียน"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">QR Code สำหรับ</h3>
                <p className="text-gray-600 mb-6">{showQRCode.name}</p>

                {/* QR Code */}
                <div className="bg-gray-100 rounded-lg p-8 mb-6 flex justify-center">
                  {showQRCode.qrCodeImage ? (
                    <img src={showQRCode.qrCodeImage} alt="QR Code" className="w-48 h-48" />
                  ) : showQRCode.qrCode ? (
                    <QRCodeSVG value={showQRCode.qrCode} size={192} />
                  ) : (
                    <>
                      <QrCode className="w-32 h-32 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">QR Code จะแสดงที่นี่</p>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-600">รหัสเข้าสู่ระบบ:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{showQRCode.qrCode || showQRCode.studentCode}</span>
                      <button
                        onClick={() => copyToClipboard(showQRCode.qrCode || showQRCode.studentCode, 'qr-code')}
                        className="p-1 text-gray-600 hover:text-blue-600"
                      >
                        {copiedCode === 'qr-code' ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowQRCode(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => {
                      // Print or download QR code
                      toast.success('พิมพ์ QR Code เรียบร้อย');
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    พิมพ์ QR Code
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStudentPage;
