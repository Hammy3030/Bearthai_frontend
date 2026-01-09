import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  FileText,
  Star,
  Clock,
  TrendingUp,
  Info,
  Pen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import GamificationBar from '../../components/GamificationBar';
import { useNotifications } from '../../context/NotificationContext';

const MockStudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  // const [notifications, setNotifications] = useState([]); // Removed local state
  const [testAttempts, setTestAttempts] = useState([]);
  const [gameAttempts, setGameAttempts] = useState([]);
  const [showRewardInfo, setShowRewardInfo] = useState(false);

  useEffect(() => {
    // Load lessons for student's classroom
    if (user?.id) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');

      // First, check authentication status (debug endpoint)
      try {
        const authStatusResponse = await axios.get(
          getApiUrl('/student/auth-status'),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('🔍 Auth Status:', authStatusResponse.data);

        // If student has no classroom, show helpful message
        if (authStatusResponse.data?.data?.message?.includes('no classroom assigned')) {
          toast.error('นักเรียนยังไม่ได้อยู่ในห้องเรียน กรุณาติดต่อครูเพื่อเพิ่มคุณเข้าไปในห้องเรียน', { duration: 7000 });
          return;
        }
      } catch (authError) {
        console.warn('Auth status check failed:', authError);
        // Continue anyway, might be a different issue
      }

      // Fetch lessons for student
      const lessonsResponse = await axios.get(
        getApiUrl('/student/lessons'),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (lessonsResponse.data.success) {
        setLessons(lessonsResponse.data.data.lessons || []);
      } else {
        console.error('Lessons response not successful:', lessonsResponse.data);
        toast.error(lessonsResponse.data.message || 'เกิดข้อผิดพลาดในการโหลดบทเรียน');
      }

      // Fetch test attempts for calculating stars
      try {
        const testsResponse = await axios.get(
          getApiUrl('/student/tests'),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (testsResponse.data.success) {
          const allAttempts = [];
          testsResponse.data.data.tests?.forEach(test => {
            if (test.testAttempts) {
              allAttempts.push(...test.testAttempts);
            }
          });
          setTestAttempts(allAttempts);
        }
      } catch (err) {
        console.error('Error fetching test attempts:', err);
      }

      // Fetch game attempts for calculating medals
      try {
        const gamesResponse = await axios.get(
          getApiUrl('/student/games'),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (gamesResponse.data.success) {
          const allAttempts = [];
          gamesResponse.data.data.games?.forEach(game => {
            if (game.gameAttempts) {
              allAttempts.push(...game.gameAttempts);
            }
          });
          setGameAttempts(allAttempts);
        }
      } catch (err) {
        console.error('Error fetching game attempts:', err);
      }

      // Notifications are now handled by NotificationContext

      // TODO: Fetch progress when endpoints are ready
      setProgress([]);
    } catch (error) {
      console.error('Error fetching student data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';

      // Show detailed error in console
      if (error.response?.data) {
        console.error('Backend error details:', {
          success: error.response.data.success,
          message: error.response.data.message,
          data: error.response.data.data
        });
      }

      toast.error(errorMessage, { duration: 5000 });

      // If error is about student not in classroom, show helpful message
      if (errorMessage.includes('ไม่ได้อยู่ในห้องเรียนใด') || errorMessage.includes('ไม่พบข้อมูลนักเรียน')) {
        toast.error('กรุณาติดต่อครูเพื่อเพิ่มคุณเข้าไปในห้องเรียน', { duration: 7000 });
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLessonStatus = (lesson) => {
    // Use the status and canAccess from the API
    const status = lesson.status || 'LOCKED';
    const canAccess = lesson.canAccess || false;

    switch (status) {
      case 'COMPLETED':
        return { status: 'COMPLETED', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', canAccess: true };
      case 'POST_TEST_READY':
      case 'GAMES_READY':
      case 'IN_PROGRESS':
        return { status: 'IN_PROGRESS', icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', canAccess: true };
      case 'PRE_TEST_READY':
        return { status: 'PRE_TEST_READY', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-100', canAccess: false };
      case 'UNLOCKED':
        return { status: 'UNLOCKED', icon: Unlock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', canAccess: true };
      case 'LOCKED':
      default:
        return { status: 'LOCKED', icon: Lock, color: 'text-gray-400', bgColor: 'bg-gray-100', canAccess: false };
    }
  };

  const getLessonScore = (lessonId) => {
    // Find test attempts for this lesson
    const lessonTests = progress.testAttempts?.filter(attempt => {
      const testLessonId = attempt.test?.lessonId || attempt.test?.lesson_id;
      return testLessonId === lessonId;
    }) || [];

    if (lessonTests.length === 0) return null;

    const avgScore = lessonTests.reduce((sum, test) => sum + test.score, 0) / lessonTests.length;
    return Math.round(avgScore);
  };

  const getStarRating = (score) => {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  // const unreadCount = notifications.filter(n => !n.isRead).length; // Handled by context

  const handleNotificationClick = async (notificationId) => {
    // If already read, don't do anything
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.isRead) return;

    await markAsRead(notificationId);
  };

  const totalLessons = lessons.length;
  // Count completed lessons from lessons array (which has status and progress data)
  // A lesson is completed if its status is 'COMPLETED' or if progress.isCompleted is true
  const completedLessons = lessons.filter(l => {
    if (l.status === 'COMPLETED') return true;
    if (l.progress && l.progress.isCompleted === true) return true;
    return false;
  }).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Calculate total stars from test attempts
  const calculateTotalStars = () => {
    let totalStars = 0;
    testAttempts.forEach(attempt => {
      const score = attempt.score || 0;
      if (score >= 90) totalStars += 3;
      else if (score >= 80) totalStars += 2;
      else if (score >= 60) totalStars += 1;
    });
    return totalStars;
  };

  // Calculate gold medals from games with 100% score
  const calculateGoldMedals = () => {
    return gameAttempts.filter(attempt => (attempt.score || 0) === 100).length;
  };

  // Calculate stamps from completed lessons (lessons with progress.isCompleted === true)
  const calculateStamps = () => {
    return lessons.filter(lesson => {
      if (lesson.status === 'COMPLETED') return true;
      if (lesson.progress && lesson.progress.isCompleted === true) return true;
      return false;
    }).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <GamificationBar
          stars={calculateTotalStars()}
          coins={calculateGoldMedals()}
          stamps={calculateStamps()}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              สวัสดี, <span className="text-blue-600">{user?.name || 'นักเรียน'}!</span>
            </h1>
            <p className="text-gray-600 mt-1">พร้อมเรียนรู้วันนี้หรือยัง? 🎯</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition"
            >
              <Bell size={24} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <Link to="/profile" className="p-3 bg-white rounded-full shadow-md hover:bg-gray-50 transition">
              <Settings size={24} className="text-gray-600" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">🔔 การแจ้งเตือน</h2>
              {unreadCount > 0 && (
                <span className="text-sm text-gray-500">
                  {unreadCount} รายการใหม่
                </span>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <motion.div
                    key={notif.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNotificationClick(notif.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${notif.isRead
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100 shadow-sm'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                              ใหม่
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        <span className="text-xs text-gray-400 mt-2 block">
                          {new Date(notif.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <div className="ml-2 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
          >
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">บทเรียนทั้งหมด</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalLessons}</h2>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
          >
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">เรียนจบแล้ว</p>
              <h2 className="text-3xl font-bold text-gray-900">{completedLessons}</h2>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
          >
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="text-purple-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">ความคืบหน้า</p>
              <h2 className="text-3xl font-bold text-gray-900">{overallProgress}%</h2>
            </div>
          </motion.div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📚 บทเรียนของคุณ</h2>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4" />
              <p className="text-lg">ยังไม่มีบทเรียน</p>
            </div>
          ) : (
            <div className="space-y-8">
              {['consonants', 'vowels', 'words', 'sentences'].map((category) => {
                const categoryLessons = lessons.filter(l => l.category === category);
                if (categoryLessons.length === 0) return null;

                const categoryTitle = {
                  consonants: 'พยัญชนะ',
                  vowels: 'สระ',
                  words: 'คำพยางค์เดียว',
                  sentences: 'การแต่งประโยค'
                }[category];

                // Group by chapter
                const chapters = {};
                categoryLessons.forEach(lesson => {
                  const chapter = lesson.chapter || '1';
                  if (!chapters[chapter]) chapters[chapter] = [];
                  chapters[chapter].push(lesson);
                });

                return (
                  <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                      <h3 className="text-xl font-bold text-blue-900">หมวด: {categoryTitle}</h3>
                    </div>

                    <div className="p-6 space-y-6">
                      {Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([chapter, chapterLessons]) => (
                        <div key={chapter}>
                          <h4 className="text-lg font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-blue-400">
                            บทที่ {chapter}
                          </h4>
                          <div className="space-y-4">
                            {chapterLessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson) => {
                              const status = getLessonStatus(lesson);
                              const score = getLessonScore(lesson.id);
                              const stars = score ? getStarRating(score) : 0;

                              return (
                                <motion.div
                                  key={lesson.id}
                                  whileHover={{ y: -2 }}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                      <div className={`p-4 ${status.bgColor} rounded-lg`}>
                                        <status.icon className={status.color} size={32} />
                                      </div>

                                      <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                          {lesson.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                          {lesson.content && lesson.content.includes('[MEDIA]')
                                            ? 'บทเรียนแบบสื่อมัลติมีเดีย พร้อมภาพประกอบและเสียง'
                                            : lesson.content}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm flex-wrap">
                                          <span className={`px-3 py-1 rounded-full ${status.bgColor} ${status.color} font-medium`}>
                                            {status.status === 'COMPLETED' && '✅ เรียนจบแล้ว'}
                                            {status.status === 'POST_TEST_READY' && '📝 พร้อมทำ Post-test'}
                                            {status.status === 'GAMES_READY' && '🎮 พร้อมเล่นเกม'}
                                            {status.status === 'IN_PROGRESS' && '📖 กำลังเรียน'}
                                            {status.status === 'UNLOCKED' && '🔓 พร้อมเรียน'}
                                            {status.status === 'LOCKED' && '🔒 ล็อกอยู่'}
                                          </span>

                                          {lesson.preTest && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                              Pre-test: {lesson.preTest.testAttempts?.length > 0 ? '✅ ทำแล้ว' : '⏳ ยังไม่ทำ'}
                                            </span>
                                          )}

                                          {lesson.postTest && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                              Post-test: {lesson.postTest.testAttempts?.length > 0 ? '✅ ทำแล้ว' : '⏳ ยังไม่ทำ'}
                                            </span>
                                          )}

                                          {lesson.games && lesson.games.length > 0 && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                              เกม: {lesson.games.length} เกม
                                            </span>
                                          )}

                                          {score && (
                                            <div className="flex items-center gap-1">
                                              {[...Array(3)].map((_, i) => (
                                                <Star
                                                  key={i}
                                                  size={16}
                                                  className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                                />
                                              ))}
                                              <span className="ml-2 text-gray-600">{score}%</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                      {status.canAccess && status.status !== 'COMPLETED' && (
                                        <Link
                                          to={`/dashboard/student/lessons/${lesson.id}`}
                                          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-center"
                                        >
                                          {status.status === 'IN_PROGRESS' ? 'เรียนต่อ' : 'เริ่มเรียน'}
                                        </Link>
                                      )}

                                      {/* Pre-test Button - Allow if Locked (to unlock) OR Unlocked (if wants to take it) */}
                                      {lesson.preTest && (status.status === 'LOCKED' || status.status === 'UNLOCKED') && (
                                        <Link
                                          to={`/dashboard/student/tests/${lesson.preTest.id || lesson.preTest._id}`}
                                          className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium text-center flex items-center gap-2 justify-center"
                                        >
                                          <FileText size={16} />
                                          ทำ Pre-test
                                        </Link>
                                      )}

                                      {/* Post-test Button - Show after lesson is completed or when status is POST_TEST_READY */}
                                      {lesson.postTest && (
                                        (status.status === 'POST_TEST_READY') ||
                                        (lesson.progress && lesson.progress.isCompleted && !lesson.postTest.testAttempts?.length) ||
                                        (status.status === 'COMPLETED' && !lesson.postTest.testAttempts?.length)
                                      ) && (
                                          <Link
                                            to={`/dashboard/student/tests/${lesson.postTest.id || lesson.postTest._id}`}
                                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium text-center flex items-center gap-2 justify-center"
                                          >
                                            <FileText size={16} />
                                            ทำ Post-test
                                          </Link>
                                        )}

                                      {/* Games Button */}
                                      {lesson.games && lesson.games.length > 0 && (
                                        <>
                                          {status.status === 'GAMES_READY' || status.status === 'COMPLETED' ? (
                                            <Link
                                              to={`/dashboard/student/games/${lesson.games[0].id || lesson.games[0]._id}`}
                                              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium text-center flex items-center gap-2 justify-center"
                                            >
                                              <Play size={16} />
                                              เล่นเกม ({lesson.games.length} เกม)
                                            </Link>
                                          ) : null}
                                        </>
                                      )}

                                      {status.status === 'COMPLETED' && (
                                        <Link
                                          to={`/dashboard/student/lessons/${lesson.id}`}
                                          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium text-center"
                                        >
                                          ทบทวน
                                        </Link>
                                      )}

                                      {!status.canAccess && !lesson.preTest && (
                                        <button
                                          disabled
                                          className="px-6 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                                        >
                                          🔒 ล็อกอยู่
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Games Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🎮 เกมทั้งหมด</h2>
            <Link
              to="/dashboard/student/games"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {lessons.filter(l => l.games && l.games.length > 0).length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Play size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg">ยังไม่มีเกม</p>
              <p className="text-sm mt-2">เรียนบทเรียนเพื่อปลดล็อกเกม</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons
                .filter(l => l.games && l.games.length > 0)
                .slice(0, 6)
                .map((lesson, lessonIndex) => (
                  lesson.games.map((game, gameIndex) => {
                    const gameAttempt = game.gameAttempts?.[0];
                    const bestScore = gameAttempt?.score || 0;
                    // Allow playing if: 
                    // 1. Lesson status allows games
                    // 2. OR it's the very first game of the very first lesson (always unlocked)
                    const canPlay = lesson.status === 'GAMES_READY' ||
                      lesson.status === 'COMPLETED' ||
                      lesson.status === 'IN_PROGRESS' ||
                      (lessonIndex === 0 && gameIndex === 0);

                    return (
                      <motion.div
                        key={game.id || game._id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <Play className="text-purple-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">{game.title || 'เกม'}</h3>
                            <p className="text-xs text-gray-600">จาก: {lesson.title}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            ประเภท: {game.type === 'MATCHING' ? 'จับคู่' :
                              game.type === 'DRAG_DROP' ? 'ลากวาง' :
                                game.type === 'WORD_CONNECT' ? 'โยงคำ' :
                                  game.type === 'MEMORY' ? 'จำ' : 'ตอบคำถาม'}
                          </p>
                          {bestScore > 0 && (
                            <div className="flex items-center gap-2">
                              <Trophy className="text-yellow-500" size={16} />
                              <span className="text-sm font-medium text-gray-700">
                                คะแนนสูงสุด: {bestScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        {canPlay ? (
                          <Link
                            to={`/dashboard/student/games/${game.id || game._id}`}
                            className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition font-medium text-center"
                          >
                            เล่นเกม
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-200 text-gray-400 py-2 px-4 rounded-lg cursor-not-allowed font-medium"
                          >
                            🔒 ยังล็อกอยู่
                          </button>
                        )}
                      </motion.div>
                    );
                  })
                ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Writing Practice */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer"
            onClick={() => navigate('/dashboard/student/writing')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-pink-100 rounded-full">
                <Pen className="text-pink-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">✍️ ฝึกเขียน</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              ฝึกเขียนภาษาไทยด้วย AI Detection
            </p>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg text-center font-medium">
              เริ่มฝึกเขียน →
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <BarChart3 className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">📊 ความคืบหน้าของคุณ</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">บทเรียนที่เรียนจบ:</span>
                <span className="font-bold text-gray-900">{completedLessons} / {totalLessons}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ความคืบหน้ารวม:</span>
                <span className="font-bold text-blue-600">{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="text-yellow-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">�� รางวัลของคุณ</h3>
              <button
                onClick={() => setShowRewardInfo(!showRewardInfo)}
                className="ml-auto p-1 hover:bg-gray-100 rounded-full transition"
                title="รายละเอียดรางวัล"
              >
                <Info className="text-gray-400 hover:text-gray-600" size={20} />
              </button>
            </div>

            {/* Reward Info Tooltip */}
            {showRewardInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h4 className="font-semibold text-blue-900 mb-2">คำอธิบายรางวัล:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>⭐ <strong>ดาว:</strong> นับจากแบบทดสอบที่แทรกระหว่างบทเรียน (60% = 1 ดาว, 80% = 2 ดาว, 90% = 3 ดาว)</li>
                  <li>🥇 <strong>เหรียญทอง:</strong> นับจากเล่นเกมได้ 100%</li>
                  <li>🎯 <strong>ตราประทับ:</strong> นับจากผ่านจุดประสงค์แต่ละบทเรียน (เรียนจบแล้ว)</li>
                </ul>
              </motion.div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-3xl mb-1">⭐</div>
                <p className="text-xs text-gray-600">ดาวทั้งหมด</p>
                <p className="font-bold text-yellow-600">{calculateTotalStars()}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-3xl mb-1">🥇</div>
                <p className="text-xs text-gray-600">เหรียญทอง</p>
                <p className="font-bold text-green-600">{calculateGoldMedals()}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-1">🎯</div>
                <p className="text-xs text-gray-600">ตราประทับ</p>
                <p className="font-bold text-purple-600">{calculateStamps()}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📖 คำอธิบายสถานะ:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Lock className="text-gray-400" size={20} />
              <span className="text-sm text-gray-600">🔒 ล็อกอยู่ (ต้องทำบทก่อนหน้า)</span>
            </div>
            <div className="flex items-center gap-2">
              <Unlock className="text-yellow-600" size={20} />
              <span className="text-sm text-gray-600">🔓 พร้อมเรียน (ยังไม่เริ่ม)</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-600" size={20} />
              <span className="text-sm text-gray-600">📖 กำลังเรียน</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm text-gray-600">✅ เรียนจบแล้ว</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MockStudentDashboard;
