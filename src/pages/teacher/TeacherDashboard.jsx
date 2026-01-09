import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  School,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash,
  ShieldOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateClassroomModal from '../../components/teacher/CreateClassroomModal';
import BulkCreateStudentModal from '../../components/BulkCreateStudentModal';
import { getApiUrl } from '../../utils/apiConfig';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classroomsData, setClassroomsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  // Fetch classrooms from API
  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/teacher/classrooms'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setClassroomsData(response.data.data.classrooms);
      } else {
        throw new Error(response.data.message || 'Failed to fetch classrooms');
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch classrooms on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchClassrooms();
    }
  }, [user?.id]);

  // Create classroom function
  const createClassroom = async (classroomData) => {
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl('/teacher/classrooms'), {
        name: classroomData.name,
        description: classroomData.description
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Refresh classrooms data
        await fetchClassrooms();
        setShowCreateModal(false);
        toast.success('สร้างห้องเรียนสำเร็จ');
      } else {
        throw new Error(response.data.message || 'Failed to create classroom');
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างห้องเรียน');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateClassroom = (data) => {
    createClassroom(data);
  };

  // Update classroom function
  const updateClassroom = async (classroomData) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl(`/teacher/classrooms/${editingClassroom.id}`),
        {
          name: classroomData.name,
          description: classroomData.description
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchClassrooms();
        setShowEditModal(false);
        setEditingClassroom(null);
        toast.success('อัปเดตห้องเรียนสำเร็จ');
      } else {
        throw new Error(response.data.message || 'Failed to update classroom');
      }
    } catch (error) {
      console.error('Error updating classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตห้องเรียน');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClassroom = (classroom) => {
    setEditingClassroom(classroom);
    setShowEditModal(true);
  };

  const handleUpdateClassroom = (data) => {
    updateClassroom(data);
  };

  const deleteClassroom = async (classroomId) => {
    if (!globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบห้องเรียนนี้?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        getApiUrl(`/teacher/classrooms/${classroomId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('ลบห้องเรียนสำเร็จ');
        await fetchClassrooms();
      } else {
        throw new Error(response.data.message || 'Failed to delete classroom');
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้องเรียน');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTotalStudents = () => {
    return classroomsData?.reduce((total, classroom) => total + (classroom.students?.[0]?.count || 0), 0) || 0;
  };

  const getTotalLessons = () => {
    return classroomsData?.reduce((total, classroom) => total + (classroom.lessons?.[0]?.count || 0), 0) || 0;
  };

  const handleGenerateLessonsForAll = async () => {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm('คุณแน่ใจหรือไม่ที่จะสร้างบทเรียนอัตโนมัติให้ทุกห้องเรียน? (ห้องเรียนที่มีบทเรียนอยู่แล้วจะไม่ถูกสร้างซ้ำ)')) {
      return;
    }

    try {
      setIsGeneratingLessons(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl('/teacher/lessons/generate-all'),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'สร้างบทเรียนอัตโนมัติให้ทุกห้องเรียนสำเร็จ');
        // Refresh classrooms data
        await fetchClassrooms();
      } else {
        throw new Error(response.data.message || 'Failed to generate lessons');
      }
    } catch (error) {
      console.error('Error generating lessons:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบทเรียน');
    } finally {
      setIsGeneratingLessons(false);
    }
  };

  const handleClearAllData = async () => {
    // First confirmation
    const firstConfirm = globalThis.confirm(
      '⚠️ คำเตือน: การล้างข้อมูลจะลบครู นักเรียน ห้องเรียน บทเรียน แบบทดสอบ เกม และข้อมูลทั้งหมด!\n\n' +
      'คุณแน่ใจหรือไม่?'
    );
    if (!firstConfirm) return;

    // Second confirmation - must type "CLEAR"
    const secondConfirm = globalThis.prompt(
      '⚠️ อันตราย! การกระทำนี้ไม่สามารถยกเลิกได้!\n\n' +
      'พิมพ์คำว่า "CLEAR" เพื่อยืนยันการล้างข้อมูลทั้งหมด:'
    );
    if (secondConfirm !== 'CLEAR') {
      toast.error('ยกเลิกการล้างข้อมูล');
      return;
    }

    try {
      setIsClearingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl('/admin/clear-all'),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('ล้างข้อมูลทั้งหมดแล้ว ระบบจะออกจากระบบ');
        setTimeout(async () => {
          await logout();
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Clear all data error:', error);
      toast.error(error.response?.data?.message || 'ล้างข้อมูลไม่สำเร็จ');
    } finally {
      setIsClearingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">BearThai</h1>
                <p className="text-sm text-gray-500">ครู - {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                สวัสดี {user?.name}
              </h2>
              <p className="text-gray-600">
                ยินดีต้อนรับสู่ระบบจัดการห้องเรียน BearThai
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={handleGenerateLessonsForAll}
                disabled={isGeneratingLessons || classroomsData?.length === 0}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingLessons ? 'animate-spin' : ''}`} />
                {isGeneratingLessons ? 'กำลังสร้างบทเรียน...' : 'สร้างบทเรียนอัตโนมัติ (ทุกห้อง)'}
              </button>
              <button
                onClick={() => setShowBulkCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition duration-200"
              >
                <Users className="w-4 h-4 mr-2" />
                สร้างนักเรียน (Bulk)
              </button>
              <button
                onClick={handleClearAllData}
                disabled={isClearingData}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                title="ล้างข้อมูลทั้งหมด (ครู/นักเรียน/บทเรียน/เกม) ใช้ใน dev เท่านั้น"
              >
                <ShieldOff className={`w-4 h-4 mr-2 ${isClearingData ? 'animate-pulse' : ''}`} />
                {isClearingData ? 'กำลังล้างข้อมูล...' : 'ล้างข้อมูลทั้งหมด'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <School className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ห้องเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomsData?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTotalStudents()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บทเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTotalLessons()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statistics & Charts Section */}
        {classroomsData?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
              สถิติและกราฟ
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Students Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">จำนวนนักเรียนต่อห้อง</h4>
                <div className="space-y-4">
                  {classroomsData.slice(0, 5).map((classroom) => {
                    const maxStudents = Math.max(...classroomsData.map(c => c.students?.[0]?.count || 0), 1);
                    const percentage = ((classroom.students?.[0]?.count || 0) / maxStudents) * 100;
                    return (
                      <div key={classroom.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 truncate">{classroom.name}</span>
                          <span className="text-sm font-bold text-blue-600">{classroom.students?.[0]?.count || 0} คน</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lessons Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">จำนวนบทเรียนต่อห้อง</h4>
                <div className="space-y-4">
                  {classroomsData.slice(0, 5).map((classroom) => {
                    const maxLessons = Math.max(...classroomsData.map(c => c.lessons?.[0]?.count || 0), 1);
                    const percentage = ((classroom.lessons?.[0]?.count || 0) / maxLessons) * 100;
                    return (
                      <div key={classroom.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 truncate">{classroom.name}</span>
                          <span className="text-sm font-bold text-purple-600">{classroom.lessons?.[0]?.count || 0} บท</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.7, duration: 1 }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="bg-white rounded-xl shadow-sm p-6 border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">สรุปภาพรวม</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <School className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-700">ห้องเรียนทั้งหมด</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{classroomsData.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-green-600 mr-3" />
                      <span className="font-medium text-gray-700">นักเรียนทั้งหมด</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{getTotalStudents()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-700">บทเรียนที่มอบหมาย</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{getTotalLessons()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mr-3" />
                    <span className="font-medium text-gray-700">เฉลี่ยนักเรียน/ห้อง</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {classroomsData.length > 0 ? Math.round(getTotalStudents() / classroomsData.length) : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">ความสมบูรณ์ของห้องเรียน</h4>
              <div className="space-y-4">
                {classroomsData.slice(0, 3).map((classroom, idx) => {
                  const hasStudents = (classroom.students?.[0]?.count || 0) > 0;
                  const hasLessons = (classroom.lessons?.[0]?.count || 0) > 0;
                  const progress = ((hasStudents ? 1 : 0) + (hasLessons ? 1 : 0)) / 2 * 100;
                  return (
                    <div key={classroom.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 truncate">{classroom.name}</span>
                        <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.9 + idx * 0.1, duration: 1 }}
                          className={`h-3 rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              'bg-gradient-to-r from-yellow-500 to-orange-500'
                            }`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* Classrooms Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                ห้องเรียนของฉัน
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                สร้างห้องเรียนใหม่
              </motion.button>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : classroomsData?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <School className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยังไม่มีห้องเรียน
                </h3>
                <p className="text-gray-600 mb-4">
                  สร้างห้องเรียนแรกของคุณเพื่อเริ่มต้นการสอน
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างห้องเรียนใหม่
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classroomsData?.map((classroom, index) => {
                  const studentCount = classroom.students?.[0]?.count || 0;
                  const lessonCount = classroom.lessons?.[0]?.count || 0;
                  const isEmpty = studentCount === 0 && lessonCount === 0;

                  return (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-xl p-6 transition-all duration-200 relative ${isEmpty
                        ? 'border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                        : 'border-blue-200 bg-white hover:shadow-md hover:border-blue-300'
                        }`}
                    >
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClassroom(classroom);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="แก้ไขห้องเรียน"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteClassroom(classroom.id);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="ลบห้องเรียน"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      <Link
                        to={`/dashboard/teacher/classrooms/${classroom.id}`}
                        className="block"
                      >
                        <h4 className={`text-lg font-semibold mb-2 ${isEmpty ? 'text-gray-600 pr-16' : 'text-gray-900 pr-16'}`}>
                          {classroom.name}
                        </h4>
                        {isEmpty && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                              ⚠️ ห้องเรียนว่าง
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm mt-4">
                          <div className={`flex items-center ${isEmpty ? 'text-gray-500' : 'text-gray-600'}`}>
                            <Users className="w-4 h-4 mr-1" />
                            <span>{studentCount} คน</span>
                          </div>
                          <div className={`flex items-center ${isEmpty ? 'text-gray-500' : 'text-gray-600'}`}>
                            <BookOpen className="w-4 h-4 mr-1" />
                            <span>{lessonCount} บท</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Classroom Modal */}
      {
        showCreateModal && (
          <CreateClassroomModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClassroom}
            isLoading={isCreating}
          />
        )
      }

      {/* Edit Classroom Modal */}
      {
        showEditModal && editingClassroom && (
          <CreateClassroomModal
            onClose={() => {
              setShowEditModal(false);
              setEditingClassroom(null);
            }}
            onSubmit={handleUpdateClassroom}
            isLoading={isUpdating}
            initialData={{
              name: editingClassroom.name,
              description: editingClassroom.description || ''
            }}
            isEditMode={true}
          />
        )
      }

      {/* Bulk Create Student Modal */}
      <BulkCreateStudentModal
        isOpen={showBulkCreateModal}
        onClose={() => setShowBulkCreateModal(false)}
        onSubmit={async (studentsData) => {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
              getApiUrl('/teacher/students'),
              { students: studentsData },
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (response.data.success) {
              toast.success(response.data.message);
              await fetchClassrooms(); // Refresh stats
            }
          } catch (error) {
            console.error('Error creating students:', error);
            throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างนักเรียน');
          }
        }}
      />
    </div >
  );
};

export default TeacherDashboard;
