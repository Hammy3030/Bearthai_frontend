import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Settings,
  LogOut,
  Bell,
  BarChart3,
  Play,
  Star,
  Info,
  Pen,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import GamificationBar from '../../components/GamificationBar';
import { useNotifications } from '../../context/NotificationContext';
import StatusLegend from '../../components/student/StatusLegend';
import StatsCards from '../../components/student/StatsCards';
import NotificationPanel from '../../components/student/NotificationPanel';
import {
  getLessonStatus,
  getLessonScore,
  getStarRating,
  calculateTotalStars,
  calculateGoldMedals,
  calculateStamps
} from '../../utils/lessonHelpers';

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
  const [currentGamePage, setCurrentGamePage] = useState(1);
  const gamesPerPage = 6;

  

  const fetchStudentData = useCallback(async () => {
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
  }, [user]);


  // Load lessons for student's classroom
  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user, fetchStudentData]);

  // Refresh data when component is focused (e.g., when returning from lesson page)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchStudentData();
      }
    };
    
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, fetchStudentData]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleNotificationClick = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.isRead) return;
    await markAsRead(notificationId);
  }, [notifications, markAsRead]);

  // Memoized calculations
  const totalLessons = useMemo(() => lessons.length, [lessons]);
  
  const completedLessons = useMemo(() => {
    return lessons.filter(l => {
      if (l.status === 'COMPLETED') return true;
      if (l.progress && l.progress.isCompleted === true) return true;
      return false;
    }).length;
  }, [lessons]);
  
  const overallProgress = useMemo(() => {
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [totalLessons, completedLessons]);

  const totalStars = useMemo(() => calculateTotalStars(testAttempts), [testAttempts]);
  const goldMedals = useMemo(() => calculateGoldMedals(gameAttempts), [gameAttempts]);
  const stamps = useMemo(() => calculateStamps(lessons), [lessons]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <GamificationBar
          stars={totalStars}
          coins={goldMedals}
          stamps={stamps}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              สวัสดี <span className="text-blue-600">{user?.name ? user.name.replace(/!/g, '') : 'นักเรียน'}</span>
            </h1>
            <p className="text-gray-600 mt-1">พร้อมเรียนรู้วันนี้หรือยัง?</p>
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
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onNotificationClick={handleNotificationClick}
            />
          </motion.div>
        )}

        <StatsCards
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          overallProgress={overallProgress}
        />

        <StatusLegend />



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
              {[
                { category: 'consonants', title: 'พยัญชนะ', range: 'บทที่ 1-4', orderStart: 1, orderEnd: 4 },
                { category: 'vowels', title: 'สระ', range: 'บทที่ 5-8', orderStart: 5, orderEnd: 8 }
              ].map((catConfig) => {
                // Filter lessons by orderIndex instead of category
                const categoryLessons = lessons.filter(l => {
                  const orderIndex = l.orderIndex || parseInt(l.chapter || '1');
                  return orderIndex >= catConfig.orderStart && orderIndex <= catConfig.orderEnd;
                });
                
                if (categoryLessons.length === 0) return null;

                // Group by chapter
                const chapters = {};
                categoryLessons.forEach(lesson => {
                  const chapter = lesson.chapter || String(lesson.orderIndex || '1');
                  if (!chapters[chapter]) chapters[chapter] = [];
                  chapters[chapter].push(lesson);
                });

                return (
                  <div key={catConfig.category} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg">
                    <div className={`px-6 py-4 border-b-2 ${catConfig.category === 'consonants' ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300' : 'bg-gradient-to-r from-purple-100 to-pink-200 border-purple-300'}`}>
                      <h3 className={`text-xl font-bold ${catConfig.category === 'consonants' ? 'text-blue-900' : 'text-purple-900'}`}>
                        หมวด: {catConfig.title}
                      </h3>
                      <p className={`text-sm mt-1 ${catConfig.category === 'consonants' ? 'text-blue-700' : 'text-purple-700'}`}>
                        {catConfig.range}
                      </p>
                    </div>

                    <div className="p-6 space-y-6">
                      {Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([chapter, chapterLessons]) => (
                        <div key={chapter}>
                          <div className="space-y-4">
                            {chapterLessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson) => {
                              const status = getLessonStatus(lesson);
                              const score = getLessonScore(lesson.id, progress);
                              const stars = score ? getStarRating(score) : 0;
                              
                              // Get lesson number for cover image
                              const lessonNumber = lesson.orderIndex || parseInt(lesson.chapter || '1');
                              const coverImagePath = `/หน้าปกบทเรียน/บทที่${lessonNumber}.png`;

                              return (
                                <motion.div
                                  key={lesson.id}
                                  whileHover={{ y: -2 }}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                      {/* Cover Image with Icon Overlay */}
                                      <div className="flex-shrink-0 relative">
                                        <img
                                          src={coverImagePath}
                                          alt={`ปกบทเรียน ${lesson.title}`}
                                          className="w-48 h-48 object-contain rounded-lg border-2 border-gray-300 shadow-md bg-white"
                                          onError={(e) => {
                                            // Hide image if fails to load
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                        {/* Status Icon Overlay on top of cover image */}
                                        <div className={`absolute top-2 right-2 p-3 ${status.bgColor} rounded-lg shadow-lg`}>
                                          <status.icon className={status.color} size={28} />
                                        </div>
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
                                            {(status.status === 'POST_TEST_READY' || status.status === 'GAMES_READY' || status.status === 'IN_PROGRESS') && '📖 กำลังเรียน'}
                                            {status.status === 'UNLOCKED' && '🔓 พร้อมเรียน (ยังไม่เริ่ม)'}
                                            {status.status === 'LOCKED' && '🔒 ล็อกอยู่ (ต้องทำบทก่อนหน้า)'}
                                          </span>

                                          {lesson.preTest && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                              Pre-test: {lesson.preTest.testAttempts?.length > 0 ? '✅ ทำแล้ว' : '⏳ ยังไม่ทำ'}
                                            </span>
                                          )}

                                          {lesson.postTest && (
                                            <span className={`px-2 py-1 rounded text-xs ${
                                              lesson.progress?.hasPassedPostTest === true
                                                ? 'bg-green-100 text-green-800'
                                                : lesson.postTest.testAttempts?.length > 0
                                                  ? 'bg-orange-100 text-orange-800'
                                                  : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              Post-test: {
                                                lesson.progress?.hasPassedPostTest === true
                                                  ? '✅ ผ่านแล้ว'
                                                  : lesson.postTest.testAttempts?.length > 0
                                                    ? '⚠️ ยังไม่ผ่าน'
                                                    : '⏳ ยังไม่ทำ'
                                              }
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
                                      {/* Start Lesson Button - Only show if pre-test is completed (if exists) */}
                                      {status.canAccess && status.status !== 'COMPLETED' && (() => {
                                        // If lesson has pre-test, check if it's completed
                                        if (lesson.preTest) {
                                          const isPreTestCompleted = lesson.preTest.testAttempts?.length > 0;
                                          // Only show "เริ่มเรียน" button if pre-test is completed
                                          if (!isPreTestCompleted) {
                                            return null;
                                          }
                                        }
                                        // If no pre-test or pre-test is completed, show button
                                        return (
                                          <Link
                                            to={`/dashboard/student/lessons/${lesson.id}`}
                                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-center"
                                          >
                                            {status.status === 'IN_PROGRESS' ? 'เรียนต่อ' : 'เริ่มเรียน'}
                                          </Link>
                                        );
                                      })()}

                                      {/* Pre-test Button - Only show if pre-test is NOT completed yet (can only do once) */}
                                      {lesson.preTest && (status.status === 'LOCKED' || status.status === 'UNLOCKED' || status.status === 'PRE_TEST_READY') && (() => {
                                        // Check if pre-test is already completed - if yes, don't show button
                                        const isPreTestCompleted = lesson.preTest.testAttempts?.length > 0;
                                        if (isPreTestCompleted) {
                                          return null; // Hide pre-test button if already completed
                                        }
                                        
                                        // Check if previous lesson's posttest is passed
                                        // Use lessons from state (all lessons), not filtered lessons
                                        const currentOrderIndex = lesson.orderIndex || parseInt(lesson.chapter || '1');
                                        let canShowPreTest = true;
                                        
                                        if (currentOrderIndex > 1) {
                                          // Find previous lesson with orderIndex - 1
                                          // Sort all lessons by orderIndex first
                                          const sortedAllLessons = [...lessons].sort((a, b) => {
                                            const aIndex = a.orderIndex || parseInt(a.chapter || '1');
                                            const bIndex = b.orderIndex || parseInt(b.chapter || '1');
                                            return aIndex - bIndex;
                                          });
                                          
                                          const currentIndex = sortedAllLessons.findIndex(l => l.id === lesson.id);
                                          
                                          if (currentIndex > 0) {
                                            const previousLesson = sortedAllLessons[currentIndex - 1];
                                            
                                            if (previousLesson) {
                                              // Check if previous lesson's posttest is passed
                                              const prevPostTestPassed = previousLesson.progress?.hasPassedPostTest === true;
                                              const prevLessonCompleted = previousLesson.progress?.isCompleted === true;
                                              
                                              // Only show pretest if previous lesson's posttest is passed
                                              canShowPreTest = prevPostTestPassed && prevLessonCompleted;
                                            }
                                          } else {
                                            // First lesson overall - allow pretest
                                            canShowPreTest = true;
                                          }
                                        }
                                        
                                        return canShowPreTest ? (
                                        <Link
                                          to={`/dashboard/student/tests/${lesson.preTest.id || lesson.preTest._id}`}
                                          className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium text-center flex items-center gap-2 justify-center"
                                        >
                                          <FileText size={16} />
                                          ทำ Pre-test
                                        </Link>
                                        ) : null;
                                      })()}

                                      {/* Post-test Button - Show when lesson is completed */}
                                      {lesson.postTest && lesson.progress && lesson.progress.isCompleted && (
                                        (status.status === 'POST_TEST_READY') ||
                                        (!lesson.postTest.testAttempts?.length) ||
                                        (lesson.postTest.testAttempts?.length > 0 && lesson.progress.hasPassedPostTest === false)
                                      ) && (
                                          <Link
                                            to={`/dashboard/student/tests/${lesson.postTest.id || lesson.postTest._id}`}
                                            className={`px-6 py-2 rounded-lg hover:opacity-90 transition font-medium text-center flex items-center gap-2 justify-center ${
                                              lesson.postTest.testAttempts?.length > 0 && lesson.progress?.hasPassedPostTest === false
                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                          >
                                            <FileText size={16} />
                                            {lesson.postTest.testAttempts?.length > 0 && lesson.progress?.hasPassedPostTest === false 
                                              ? 'ทำ Post-test อีกครั้ง' 
                                              : 'ทำ Post-test'}
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

                                      {/* Review Button - Show when lesson is completed (regardless of posttest status) */}
                                      {lesson.progress && lesson.progress.isCompleted && (
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
          </div>

          {(() => {
            // Flatten all games from all lessons
            const allGames = [];
            lessons
              .filter(l => l.games && l.games.length > 0)
              .forEach((lesson, lessonIndex) => {
                lesson.games.forEach((game, gameIndex) => {
                  allGames.push({
                    ...game,
                    lesson,
                    lessonIndex,
                    gameIndex
                  });
                });
              });

            const totalGames = allGames.length;
            const totalPages = Math.ceil(totalGames / gamesPerPage);
            const startIndex = (currentGamePage - 1) * gamesPerPage;
            const endIndex = startIndex + gamesPerPage;
            const currentGames = allGames.slice(startIndex, endIndex);

            if (totalGames === 0) {
              return (
            <div className="text-center py-10 text-gray-500">
              <Play size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg">ยังไม่มีเกม</p>
              <p className="text-sm mt-2">เรียนบทเรียนเพื่อปลดล็อกเกม</p>
            </div>
              );
            }

            return (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentGames.map(({ lesson, lessonIndex, gameIndex, ...game }) => {
                    const gameAttempt = game.gameAttempts?.[0];
                    const bestScore = gameAttempt?.score || 0;
                    // Allow playing if: 
                    // 1. Lesson status allows games (GAMES_READY, COMPLETED, IN_PROGRESS)
                    // 2. OR lesson is unlocked (UNLOCKED) - all games in unlocked lessons should be playable
                    // 3. OR it's the very first lesson (lessonIndex === 0) - all games should be unlocked
                    const canPlay = lesson.status === 'GAMES_READY' ||
                      lesson.status === 'COMPLETED' ||
                      lesson.status === 'IN_PROGRESS' ||
                      lesson.status === 'UNLOCKED' ||
                      lessonIndex === 0;

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
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentGamePage(prev => Math.max(1, prev - 1))}
                      disabled={currentGamePage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentGamePage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      ← ก่อนหน้า
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentGamePage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition ${
                            currentGamePage === page
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentGamePage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentGamePage === totalPages}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        currentGamePage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      ถัดไป →
                    </button>
            </div>
          )}
              </>
            );
          })()}
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
              <h3 className="text-xl font-bold text-gray-800">ฝึกเขียน</h3>
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
              <h3 className="text-xl font-bold text-gray-800">ความคืบหน้าของคุณ</h3>
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
              <h3 className="text-xl font-bold text-gray-800">รางวัลของคุณ</h3>
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
                <p className="font-bold text-yellow-600">{totalStars}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-3xl mb-1">🥇</div>
                <p className="text-xs text-gray-600">เหรียญทอง</p>
                <p className="font-bold text-green-600">{goldMedals}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-1">🎯</div>
                <p className="text-xs text-gray-600">ตราประทับ</p>
                <p className="font-bold text-purple-600">{stamps}</p>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default MockStudentDashboard;
