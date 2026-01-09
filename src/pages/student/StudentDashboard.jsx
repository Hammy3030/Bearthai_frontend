import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  BookOpen, 
  Trophy, 
  Lock, 
  Unlock,
  CheckCircle,
  Settings, 
  LogOut,
  Bell,
  BarChart3,
  Play,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch lessons
  const { data: lessonsData, isLoading } = useQuery(
    'student-lessons',
    async () => {
      const response = await axios.get('/api/student/lessons');
      return response.data.data.lessons;
    }
  );

  // Fetch progress
  const { data: progressData } = useQuery(
    'student-progress',
    async () => {
      const response = await axios.get('/api/student/progress');
      return response.data.data;
    }
  );

  // Fetch notifications
  const { data: notificationsData } = useQuery(
    'student-notifications',
    async () => {
      const response = await axios.get('/api/student/notifications?unreadOnly=true');
      return response.data.data.notifications;
    }
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'LOCKED':
        return <Lock className="w-5 h-5 text-red-500" />;
      case 'UNLOCKED':
        return <Unlock className="w-5 h-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'POST_TEST_READY':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'GAMES_READY':
        return <Play className="w-5 h-5 text-purple-500" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'LOCKED':
        return 'ยังล็อกอยู่';
      case 'UNLOCKED':
        return 'พร้อมเรียน';
      case 'COMPLETED':
        return 'เรียนจบแล้ว';
      case 'POST_TEST_READY':
        return 'พร้อมทำแบบทดสอบ';
      case 'GAMES_READY':
        return 'พร้อมเล่นเกม';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LOCKED':
        return 'bg-red-100 text-red-800';
      case 'UNLOCKED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'POST_TEST_READY':
        return 'bg-blue-100 text-blue-800';
      case 'GAMES_READY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <p className="text-sm text-gray-500">นักเรียน - {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 relative"
                >
                  <Bell className="w-5 h-5" />
                  {notificationsData?.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationsData?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          ไม่มีการแจ้งเตือนใหม่
                        </div>
                      ) : (
                        notificationsData?.map((notification) => (
                          <div key={notification.id} className="p-4 border-b hover:bg-gray-50">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            สวัสดี {user?.name}
          </h2>
          <p className="text-gray-600">
            ยินดีต้อนรับสู่การเรียนรู้ภาษาไทย ป.1
          </p>
          {user?.classroom && (
            <p className="text-sm text-gray-500 mt-1">
              ห้องเรียน: {user.classroom.name}
            </p>
          )}
        </motion.div>

        {/* Progress Stats */}
        {progressData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">บทเรียน</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.statistics.completedLessons}/{progressData.statistics.totalLessons}
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
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">คะแนนเฉลี่ย</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.statistics.averageTestScore}%
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
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ความคืบหน้า</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(progressData.statistics.completionRate)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border"
            >
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Play className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เกมที่เล่น</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progressData.statistics.totalGames}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Lessons Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              บทเรียนของฉัน
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              เรียนรู้ตามลำดับเพื่อปลดล็อกเนื้อหาใหม่
            </p>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : lessonsData?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยังไม่มีบทเรียน
                </h3>
                <p className="text-gray-600">
                  รอครูสร้างบทเรียนให้คุณ
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessonsData?.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-6 transition duration-200 ${
                      lesson.canAccess 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(lesson.status)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            บทที่ {lesson.order}: {lesson.title}
                          </h4>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                              {getStatusText(lesson.status)}
                            </span>
                            
                            {lesson.preTest && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.preTest.attempted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                Pre-test: {lesson.preTest.attempted ? `${lesson.preTest.score}%` : 'ยังไม่ทำ'}
                              </span>
                            )}
                            
                            {lesson.postTest && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.postTest.attempted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                Post-test: {lesson.postTest.attempted ? `${lesson.postTest.score}%` : 'ยังไม่ทำ'}
                              </span>
                            )}
                            
                            {lesson.games?.length > 0 && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                lesson.games.every(game => game.attempted) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                เกม: {lesson.games.filter(game => game.attempted).length}/{lesson.games.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {lesson.canAccess && (
                          <Link
                            to={`/dashboard/student/lessons/${lesson.id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition duration-200"
                          >
                            เริ่มเรียน
                          </Link>
                        )}
                        
                        {lesson.status === 'POST_TEST_READY' && lesson.postTest && (
                          <Link
                            to={`/dashboard/student/tests/${lesson.postTest.id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition duration-200"
                          >
                            ทำแบบทดสอบ
                          </Link>
                        )}
                        
                        {lesson.status === 'GAMES_READY' && lesson.games?.length > 0 && (
                          <Link
                            to={`/dashboard/student/games/${lesson.games[0].id}`}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition duration-200"
                          >
                            เล่นเกม
                          </Link>
                        )}
                        
                        {lesson.status === 'LOCKED' && lesson.preTest && (
                          <Link
                            to={`/dashboard/student/tests/${lesson.preTest.id}`}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition duration-200"
                          >
                            ทำ Pre-test
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
