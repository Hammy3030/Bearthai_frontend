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
import { getApiUrl } from '../../utils/apiConfig';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFB000] via-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  BearThai
                </h1>
                <p className="text-sm text-gray-500 font-medium">ครู - {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="p-3 text-gray-600 hover:text-[#FFB000] hover:bg-yellow-50 rounded-xl transition-all duration-200"
                title="ตั้งค่าโปรไฟล์"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
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
          <div className="bg-gradient-to-r from-white to-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                  สวัสดี {user?.name} 👋
              </h2>
                <p className="text-gray-600 text-lg">
                ยินดีต้อนรับสู่ระบบจัดการห้องเรียน BearThai
              </p>
            </div>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                onClick={handleGenerateLessonsForAll}
                disabled={isGeneratingLessons || classroomsData?.length === 0}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingLessons ? 'animate-spin' : ''}`} />
                  {isGeneratingLessons ? 'กำลังสร้างบทเรียน...' : 'สร้างบทเรียนอัตโนมัติ'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                onClick={handleClearAllData}
                disabled={isClearingData}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
                title="ล้างข้อมูลทั้งหมด (ครู/นักเรียน/บทเรียน/เกม) ใช้ใน dev เท่านั้น"
              >
                <ShieldOff className={`w-4 h-4 mr-2 ${isClearingData ? 'animate-pulse' : ''}`} />
                {isClearingData ? 'กำลังล้างข้อมูล...' : 'ล้างข้อมูลทั้งหมด'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-lg shadow-blue-500/10 p-6 border border-blue-200/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <School className="w-7 h-7 text-white" />
              </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">ห้องเรียน</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {classroomsData?.length || 0}
                </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-2xl shadow-lg shadow-green-500/10 p-6 border border-green-200/50 backdrop-blur-sm hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
              </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">นักเรียน</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                  {getTotalStudents()}
                </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl shadow-lg shadow-purple-500/10 p-6 border border-purple-200/50 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-7 h-7 text-white" />
              </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">บทเรียน</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  {getTotalLessons()}
                </p>
                </div>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              สถิติและกราฟ
            </h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Statistics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students Distribution Chart */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300">
                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    จำนวนนักเรียนต่อห้อง
                  </h4>
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
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300">
                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    จำนวนบทเรียนต่อห้อง
                  </h4>
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
              </div>
            </div>

            {/* Activity Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-shadow duration-300 mt-6">
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ความสมบูรณ์ของห้องเรียน
              </h4>
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#FFB000] to-orange-500 rounded-xl shadow-lg">
                  <School className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ห้องเรียนของฉัน
              </h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#FFB000] to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
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
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <School className="w-12 h-12 text-gray-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ยังไม่มีห้องเรียน
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  สร้างห้องเรียนแรกของคุณเพื่อเริ่มต้นการสอน
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FFB000] to-orange-500 text-white text-base font-semibold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
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
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={`border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group ${isEmpty
                        ? 'border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:border-gray-400 hover:from-gray-100 hover:to-gray-200/50'
                        : 'border-blue-200/50 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300'
                        }`}
                    >
                      {/* Decorative gradient overlay */}
                      {!isEmpty && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                      )}
                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClassroom(classroom);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 backdrop-blur-sm bg-white/80 shadow-sm"
                          title="แก้ไขห้องเรียน"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteClassroom(classroom.id);
                          }}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm bg-white/80 shadow-sm"
                          title="ลบห้องเรียน"
                        >
                          <Trash className="w-4 h-4" />
                        </motion.button>
                      </div>

                      <Link
                        to={`/dashboard/teacher/classrooms/${classroom.id}`}
                        className="block relative z-10"
                      >
                        <h4 className={`text-xl font-bold mb-3 pr-20 ${isEmpty ? 'text-gray-600' : 'text-gray-900'}`}>
                          {classroom.name}
                        </h4>
                        {isEmpty && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 shadow-sm">
                              ⚠️ ห้องเรียนว่าง
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-6 text-sm mt-5">
                          <div className={`flex items-center gap-2 ${isEmpty ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                            <div className={`p-1.5 rounded-lg ${isEmpty ? 'bg-gray-200' : 'bg-blue-100'}`}>
                              <Users className={`w-4 h-4 ${isEmpty ? 'text-gray-400' : 'text-blue-600'}`} />
                            </div>
                            <span>{studentCount} คน</span>
                          </div>
                          <div className={`flex items-center gap-2 ${isEmpty ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                            <div className={`p-1.5 rounded-lg ${isEmpty ? 'bg-gray-200' : 'bg-purple-100'}`}>
                              <BookOpen className={`w-4 h-4 ${isEmpty ? 'text-gray-400' : 'text-purple-600'}`} />
                            </div>
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

    </div >
  );
};

export default TeacherDashboard;
