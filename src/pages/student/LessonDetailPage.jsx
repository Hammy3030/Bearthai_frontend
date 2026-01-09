import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Clock,
  BookOpen,
  Play,
  Loader,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { speakText, stopSpeech } from '../../utils/speechHelper';
import { getApiUrl } from '../../utils/apiConfig';
import HandwritingCanvas from '../../components/HandwritingCanvas';
import { useAuth } from '../../contexts/AuthContext';

const LessonDetailPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activityAnswers, setActivityAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [preTestStatus, setPreTestStatus] = useState(null);
  const [postTestStatus, setPostTestStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Check unlock conditions before accessing lesson
  useEffect(() => {
    const checkUnlockConditions = async () => {
      try {
        try {
          const preTestRes = await axios.get(
            getApiUrl(`/student/lessons/${lessonId}/pre-test-status`),
            {
              headers: { Authorization: `Bearer ${token}` },
              // Add cache busting to ensure fresh data
              params: { _t: Date.now() }
            }
          );

          if (preTestRes.data?.success) {
            const status = preTestRes.data.data;
            setPreTestStatus(status);

            console.log('Pre-test status check:', {
              hasPreTest: status.hasPreTest,
              isPreTestCompleted: status.isPreTestCompleted,
              canAccessLesson: status.canAccessLesson,
              preTestId: status.preTestId
            });

            // If pre-test is required but not completed, redirect to pre-test page
            if (status.hasPreTest && !status.isPreTestCompleted) {
              toast.error('ต้องทำแบบทดสอบก่อนเรียนก่อน', {
                duration: 3000,
                icon: '📝'
              });
              // Redirect to pre-test page directly
              if (status.preTestId) {
                navigate(`/dashboard/student/tests/${status.preTestId}`);
              } else {
                navigate('/dashboard/student');
              }
              return;
            }
          }
        } catch (err) {
          // If endpoint fails, allow access (backward compatibility)
          console.warn('Pre-test status check failed:', err);
        }

        // Check post-test status (for SummaryStep display)
        try {
          const postTestRes = await axios.get(
            getApiUrl(`/student/lessons/${lessonId}/post-test-status`),
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (postTestRes.data?.success) {
            setPostTestStatus(postTestRes.data.data);
          }
        } catch (err) {
          // If endpoint fails, continue (backward compatibility)
          console.warn('Post-test status check failed:', err);
        }
      } catch (err) {
        console.error('Check unlock conditions error:', err);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    if (lessonId) {
      checkUnlockConditions();
    }
  }, [lessonId, navigate]);

  useEffect(() => {
    const fetchLesson = async () => {
      if (isLoadingStatus) return;

      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(getApiUrl(`/lessons/${lessonId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.success) {
          setLesson(res.data.data.lesson);
        }
      } catch (err) {
        console.error('Fetch lesson failed:', err?.response?.data || err?.message);
        toast.error('เกิดข้อผิดพลาดในการโหลดบทเรียน');
        navigate('/dashboard/student');
      }
    };

    fetchLesson();
  }, [lessonId, navigate, isLoadingStatus]);

  useEffect(() => {
    // Timer for tracking time spent
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoadingStatus || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดบทเรียน...</p>
        </div>
      </div>
    );
  }

  // Generate dynamic lesson steps based on lesson type
  const generateLessonSteps = () => {
    const lessonContent = lesson.title.split(': ')[1] || '';

    // Extract the main concept from title
    const getMainConcept = () => {
      // Try to extract single character from title first
      // For "พยัญชนะ ก-ง" or "สระ อา", get the first vowel/consonant
      const singleCharMatch = lessonContent.match(/^สระ ([ก-๙]+)$/);
      if (singleCharMatch) return singleCharMatch[1];

      // For consonant ranges or other patterns, extract from content
      if (lesson.content) {
        // Look for single-character Thai letters (consonants/vowels)
        const matches = lesson.content.match(/[\s\n]([ก-๙])[\s\n]/g);
        if (matches && matches.length > 0) {
          // Return the first single character found
          const firstMatch = matches[0].trim();
          if (firstMatch.length === 1) return firstMatch;
        }

        // Fallback: find first single character anywhere
        const singleChars = lesson.content.match(/[ก-ฮ]/g);
        if (singleChars && singleChars.length > 0) {
          return singleChars[0];
        }
      }
      return null;
    };

    // Extract vocabulary words with better detection
    const extractVocabulary = () => {
      const words = [];

      // 1. Check for [MEDIA] block in content first
      if (lesson.content && lesson.content.includes('[MEDIA]')) {
        try {
          const mediaMatch = lesson.content.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
          if (mediaMatch && mediaMatch[1]) {
            const mediaData = JSON.parse(mediaMatch[1]);
            if (mediaData.items && Array.isArray(mediaData.items)) {
              // SEPARATION: Filter to prioritize generic Vocabulary words (length > 1)
              // Steps:
              // 1. Identify "Vocabulary Words" (e.g., กา, ขา, งา) -> length > 1
              // 2. If present, show ONLY them in the Vocabulary Section.
              // 3. If not present, show everything (Consonants) as fallback.
              const vocabOnly = mediaData.items.filter(item => item.word && item.word.length > 1);

              const itemsToReturn = vocabOnly.length > 0 ? vocabOnly : mediaData.items;

              return itemsToReturn.map(item => ({
                word: item.word,
                emoji: null, // Image preferred
                // Use vocabImage if available (Chicken), otherwise Consonant Image (Ko Kai)
                image: item.vocabImage || item.image,
                meaning: item.label || item.word,
                audio: null // Will trigger TTS fallback
              }));
            }
          }
        } catch (e) {
          console.error('Failed to parse media content:', e);
        }
      }

      // Vocabulary mapping for each lesson (Fallback)
      const vocabularyMap = {
        'ก–ง': [
          { word: 'ไก่', emoji: '🐔', meaning: 'สัตว์ปีกที่ขี้อวด' },
          { word: 'ไข่', emoji: '🥚', meaning: 'ของที่ไก่ให้' },
          { word: 'ควาย', emoji: '🐃', meaning: 'สัตว์ตัวใหญ่มีเขา' },
          { word: 'ระฆัง', emoji: '🔔', meaning: 'เครื่องตีให้เสียงดัง' },
          { word: 'งู', emoji: '🐍', meaning: 'สัตว์เลื้อยคลาน' },
          { word: 'กา', emoji: '🐦', meaning: 'นกสีดำ' },
          { word: 'ขา', emoji: '🦵', meaning: 'อวัยวะที่ใช้เดิน' },
          { word: 'คา', emoji: '🏠', meaning: 'บ้านเรือน' },
          { word: 'งา', emoji: '🐘', meaning: 'ของงาช้าง' }
        ],
        'จ–ณ': [
          { word: 'จาน', emoji: '🍽️', meaning: 'ภาชนะใส่อาหาร' },
          { word: 'ฉิ่ง', emoji: '🔔', meaning: 'เครื่องดนตรีไทย' },
          { word: 'ช้าง', emoji: '🐘', meaning: 'สัตว์ตัวใหญ่มาก' },
          { word: 'ซอ', emoji: '🎻', meaning: 'เครื่องดนตรี' }
        ],
        'ด–ม': [
          { word: 'เด็ก', emoji: '👶', meaning: 'คนตัวเล็ก' },
          { word: 'เต่า', emoji: '🐢', meaning: 'สัตว์มีกระดอง' },
          { word: 'ถุง', emoji: '👜', meaning: 'ของสำหรับใส่ของ' },
          { word: 'ทหาร', emoji: '👮', meaning: 'ผู้ปกป้องประเทศ' },
          { word: 'ธง', emoji: '🚩', meaning: 'ผ้าสำหรับชักขึ้น' },
          { word: 'หนู', emoji: '🐭', meaning: 'สัตว์ตัวเล็กหางยาว' },
          { word: 'ใบไม้', emoji: '🍃', meaning: 'ส่วนของต้นไม้' },
          { word: 'ปลา', emoji: '🐟', meaning: 'สัตว์ในน้ำ' },
          { word: 'ผึ้ง', emoji: '🐝', meaning: 'แมลงทำน้ำผึ้ง' },
          { word: 'ม้า', emoji: '🐴', meaning: 'สัตว์ใช้ขี่' }
        ],
        'ย–ฮ': [
          { word: 'ยักษ์', emoji: '👹', meaning: 'ยักษ์ในนิทาน' },
          { word: 'เรือ', emoji: '🚢', meaning: 'ยานพาหนะในน้ำ' },
          { word: 'ลิง', emoji: '🐵', meaning: 'สัตว์ที่คล้ายคน' },
          { word: 'แหวน', emoji: '💍', meaning: 'เครื่องประดับนิ้ว' },
          { word: 'ศาลา', emoji: '🏛️', meaning: 'อาคารหลังคาใหญ่' },
          { word: 'สระ', emoji: '🏊', meaning: 'ที่ว่ายน้ำ' },
          { word: 'หีบ', emoji: '📦', meaning: 'กล่องใส่ของ' },
          { word: 'อ่าง', emoji: '🛁', meaning: 'ภาชนะใส่น้ำ' },
          { word: 'ฮูก', emoji: '🦉', meaning: 'นกกลางคืน' }
        ],
        'อา': [
          { word: 'กา', emoji: '🐦', meaning: 'นกสีดำ' },
          { word: 'ขา', emoji: '🦵', meaning: 'อวัยวะที่ใช้เดิน' },
          { word: 'คา', emoji: '🏠', meaning: 'บ้านเรือน' },
          { word: 'งา', emoji: '🐘', meaning: 'ของงาช้าง' },
          { word: 'จา', emoji: '👋', meaning: 'ทักทาย' },
          { word: 'ชา', emoji: '☕', meaning: 'เครื่องดื่ม' }
        ],
        'อี': [
          { word: 'กี', emoji: '🏃', meaning: 'เดินเร็ว' },
          { word: 'ขี', emoji: '✏️', meaning: 'เขียน' },
          { word: 'คี', emoji: '🤗', meaning: 'กอด' }
        ],
        'อือ': [
          { word: 'กือ', emoji: '🌊', meaning: 'คลื่น' },
          { word: 'ขือ', emoji: '💨', meaning: 'ลม' },
          { word: 'คือ', emoji: '💡', meaning: 'เป็น' }
        ],
        'อุ': [
          { word: 'กุ', emoji: '🎯', meaning: 'เป้า' },
          { word: 'ขุ', emoji: '🏀', meaning: 'ลูกบอล' },
          { word: 'คุ', emoji: '🗣️', meaning: 'พูด' }
        ]
      };

      // Try to find matching vocabulary based on lesson title
      if (lessonContent) {
        for (const [key, vocabList] of Object.entries(vocabularyMap)) {
          if (lessonContent.includes(key) || lesson.title.includes(key)) {
            words.push(...vocabList);
            break;
          }
        }
      }

      // Fallback: extract from content if no match found
      if (words.length === 0 && lesson.content) {
        const matches = lesson.content.match(/[ก-๙]{2,}/g);
        if (matches) {
          const uniqueWords = [...new Set(matches.filter(m => m.length === 2))];
          const emojis = ['🐔', '🥚', '🐃', '🔔', '🐍', '🐦', '🦵', '🏠', '🐘', '👶', '🐢', '👜'];
          uniqueWords.slice(0, 12).forEach((word, idx) => {
            words.push({
              word,
              emoji: emojis[idx] || '📝',
              meaning: 'ตัวอย่างคำ'
            });
          });
        }
      }

      return words;
    };

    const mainConcept = getMainConcept();
    const vocabularyWords = extractVocabulary();
    const isVowel = lessonContent.match(/^สระ (.+)$/);
    const isConsonant = lessonContent.match(/^พยัญชนะ (.+)$/);

    const steps = [];

    // Intro step
    steps.push({
      id: 'intro',
      title: '📖 บทนำ',
      type: 'content',
      content: {
        title: `บทนำ: ${lesson.title}`,
        description: lesson.content,
        audio: lesson.audioUrl
      }
    });

    // Pronunciation step based on lesson type
    if ((isConsonant || isVowel) && mainConcept) {
      steps.push({
        id: 'pronunciation',
        title: '🔊 การออกเสียง',
        type: 'content',
        content: {
          title: 'วิธีอ่านและออกเสียง',
          description: 'ฟังและฝึกออกเสียงตาม',
          audio: lesson.audioUrl
        }
      });
    }

    // Vocabulary step with dynamic words
    if (vocabularyWords.length > 0) {
      // Extract lesson number from title (e.g., "บทที่ 1" -> "1", supports up to บทที่ 8)
      const lessonNumberMatch = lesson.title.match(/บทที่\s*(\d+)/);
      const lessonNumber = lessonNumberMatch ? lessonNumberMatch[1] : null;

      steps.push({
        id: 'vocabulary',
        title: '📚 คำศัพท์',
        type: 'vocabulary',
        content: {
          lessonNumber: lessonNumber, // Pass lesson number to VocabularyStep
          words: vocabularyWords.map((wordItem, idx) => {
            // Support both object and string format
            if (typeof wordItem === 'object' && wordItem.word) {
              return {
                word: wordItem.word,
                meaning: wordItem.meaning || 'ตัวอย่างคำ',
                emoji: wordItem.emoji || String.fromCodePoint(0x1F300 + idx)
              };
            }
            return {
              word: wordItem,
              meaning: 'ตัวอย่างคำ',
              emoji: String.fromCodePoint(0x1F300 + idx)
            };
          })
        }
      });
    }

    // Add writing practice
    if (mainConcept) {
      steps.push({
        id: 'activity-writing',
        title: '✍️ กิจกรรม: ฝึกเขียน',
        type: 'activity-writing',
        content: {
          question: 'ลากนิ้วเขียนตามจุดประ',
          word: mainConcept,
          strokes: mainConcept.split('')
        }
      });
    }

    // Summary
    steps.push({
      id: 'summary',
      title: '📌 สรุปบทเรียน',
      type: 'summary',
      content: {
        title: 'สิ่งที่เรียนไปวันนี้',
        points: [
          `เรียนรู้${lessonContent}`,
          'ฝึกอ่านและออกเสียง',
          vocabularyWords.length > 0 ? `คำศัพท์ ${vocabularyWords.length} คำ` : 'คำศัพท์ต่างๆ'
        ]
      }
    });

    return steps;
  };

  const lessonSteps = generateLessonSteps();

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      toast.success('เรียนจบหัวข้อนี้แล้ว!');
    }
  };

  const handleNextStep = () => {
    if (currentStep < lessonSteps.length - 1) {
      handleStepComplete(lessonSteps[currentStep].id);
      setCurrentStep(currentStep + 1);
    } else {
      handleLessonComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLessonComplete = async () => {
    try {
      // Call API to mark lesson as complete
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl(`/student/lessons/${lessonId}/complete`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowConfetti(true);
      toast.success('ยินดีด้วย! เรียนจบบทเรียนแล้ว');
      setTimeout(() => {
        navigate('/dashboard/student');
      }, 3000);
    } catch (error) {
      console.error('Complete lesson error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกความคืบหน้า');
    }
  };

  const handleActivityAnswer = async (activityId, answer, isCorrect = false, score = 0) => {
    // Update local state
    setActivityAnswers({
      ...activityAnswers,
      [activityId]: { answer, isCorrect, score }
    });

    // Submit to backend
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        getApiUrl(`/student/lessons/${lessonId}/activities/${activityId}/submit`),
        {
          answer: typeof answer === 'object' ? answer : { answer },
          isCorrect: isCorrect,
          score: score || (isCorrect ? 100 : 0),
          timeSpent: timeSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Submit activity error:', error);
      // Don't show error to user, just log it
    }
  };

  const playAudio = (audioUrl, text = null) => {
    // Stop any ongoing speech
    stopSpeech();

    if (audioUrl?.startsWith('http')) {
      // Try to play actual audio file
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Audio play error:', err);
        // Fallback to text-to-speech with slower rate for kids
        if (text) {
          speakText(text, { rate: 0.5 });
        }
      });
    } else if (text) {
      // Use Web Speech API with slower rate for kids
      speakText(text, { rate: 0.5 });
    } else {
      // Default fallback
      speakText('อา', { rate: 0.5 });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    const step = lessonSteps[currentStep];

    switch (step.type) {
      case 'content':
        return <ContentStep step={step} playAudio={playAudio} />;
      case 'vocabulary':
        return <VocabularyStep step={step} playAudio={playAudio} />;
      case 'activity-listening':
        return (
          <ListeningActivity
            step={step}
            playAudio={playAudio}
            onAnswer={(answer) => handleActivityAnswer(step.id, answer)}
            currentAnswer={activityAnswers[step.id]}
          />
        );
      case 'activity-matching':
        return (
          <MatchingActivity
            step={step}
            onAnswer={(answer) => handleActivityAnswer(step.id, answer)}
            currentAnswer={activityAnswers[step.id]}
          />
        );
      case 'activity-writing':
        return <WritingActivityStep step={step} onComplete={(activityId, writtenText, isCorrect, score) => {
          handleActivityAnswer(activityId, { writtenText, isCorrect, score }, isCorrect, score);
        }} />;
      case 'summary':
        return <SummaryStep step={step} postTestStatus={postTestStatus} />;
      default:
        return <div>Unknown step type</div>;
    }
  };

  const progress = ((currentStep + 1) / lessonSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard/student')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={20} />
                <span className="font-medium">{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">ความคืบหน้า</span>
              <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {lessonSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${index === currentStep
                  ? 'bg-blue-500 text-white'
                  : completedSteps.includes(step.id)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                  }`}
              >
                {completedSteps.includes(step.id) && <CheckCircle size={16} />}
                <span>{step.title}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-6"
        >
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${currentStep === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 hover:bg-blue-50 shadow-md'
              }`}
          >
            <ChevronLeft size={20} />
            ก่อนหน้า
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition shadow-md"
          >
            {currentStep === lessonSteps.length - 1 ? (
              <>
                <CheckCircle size={20} />
                จบบทเรียน
              </>
            ) : (
              <>
                ถัดไป
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// Content Step Component
const ContentStep = ({ step, playAudio }) => {
  // Extract text from title for display
  const titleMatch = step.content.title.match(/: (.+)/);
  const displayText = titleMatch ? titleMatch[1] : '';
  const isMediaContent = step.content.description && step.content.description.includes('[MEDIA]');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {step.content.title}
        </h2>

        {/* Main Content Area */}
        <div className="text-left bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="prose prose-lg max-w-none">
            {isMediaContent ? (
              // Media Content View
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {(() => {
                  try {
                    const match = step.content.description.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
                    if (match && match[1]) {
                      const data = JSON.parse(match[1]);
                      // FILTER: Only show Consonants (length 1) in the Intro Grid
                      const consonants = data.items.filter(item => item.word && item.word.length === 1);
                      const itemsToShow = consonants.length > 0 ? consonants : data.items;

                      return itemsToShow.map((item, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => String(step.content.lessonNumber) !== '4' && playAudio(item.label || item.word, item.label || item.word)}
                          className={`
                            relative p-4 rounded-xl border-2 flex flex-col items-center justify-center min-h-[120px] shadow-sm transition-all
                            ${index % 2 === 0 ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'}
                            hover:shadow-md hover:border-blue-400
                          `}
                        >
                          <img
                            src={item.image}
                            alt={item.word}
                            className="h-32 w-auto object-contain mb-3"
                          />
                          <span className="font-bold text-lg text-gray-800">{item.label}</span>

                          {/* Audio Indicator Overlay */}
                          {String(step.content.lessonNumber) !== '4' && (
                            <div className="absolute top-2 right-2 bg-blue-100 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shadow-sm">
                              <Volume2 size={20} />
                            </div>
                          )}
                        </motion.button>
                      ));
                    }
                  } catch (e) { return <p className="text-red-500">Error loading content: {e.message}</p>; }
                })()}
              </div>
            ) : (
              // Standard Text View
              (step.content.description || '').split('\n').map((line, idx) => (
                <p key={`line-${idx}-${line.substring(0, 10)}`} className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {line}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legacy Image/Visual - Only show if NO media content */}
      {displayText && !isMediaContent && (
        <div className="flex justify-center mb-6">
          <div className="w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-7xl">{displayText}</span>
          </div>
        </div>
      )}

      {/* Audio Button - Only show if NO media content (since grid has its own audio) */}
      {displayText && !isMediaContent && String(step.content.lessonNumber) !== '4' && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => playAudio(step.content.audio, displayText)}
            className="flex items-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition shadow-lg"
          >
            <Volume2 size={24} />
            ฟังเสียง
          </button>
        </div>
      )}

      {/* Objectives */}
      {step.content.objectives && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4">🎯 วัตถุประสงค์:</h3>
          <ul className="space-y-2">
            {step.content.objectives.map((obj, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      {step.content.steps && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">👄 วิธีออกเสียง:</h3>
          <ol className="space-y-2 list-decimal list-inside">
            {step.content.steps.map((s, index) => (
              <li key={index} className="text-gray-700">{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// Vocabulary Step Component
const VocabularyStep = ({ step, playAudio }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = step.content.words;
  const currentWord = words[currentWordIndex];
  const lessonNumber = step.content.lessonNumber;

  // State for image handling
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Update image source when word changes
  useEffect(() => {
    let source = null;

    // HARDCODED FIX: Specific mapping for Lesson 1 to ensure correct "Object" images for Consonants
    // This overrides any dynamic path or backend data to guarantee 100% correctness for user
    if (String(lessonNumber) === '1') {
      const lesson1Map = {
        'ก': 'ไก่.png',
        'ข': 'ไข่.png',
        'ฃ': null, // No image commonly used or provided
        'ค': 'ควาย.png',
        'ฅ': 'คน.png', // User confirmed this file exists
        'ฆ': 'ระฆัง.png',
        'ง': 'งู.png',
        'จ': 'จาน.png', // Just in case lesson 2 overlaps or similar logic needed
        'ฉ': 'ฉิ่ง.png'
      };

      // Use map if word exists in it
      const cleanWord = currentWord.word ? currentWord.word.trim() : '';
      if (cleanWord && lesson1Map[cleanWord]) {
        source = `/คำศัพท์บท1-4/บทที่1/${lesson1Map[cleanWord]}`;
      }
    }

    // If no hardcoded source, try the primaryImage from backend (which should be correct now)
    if (!source && currentWord.primaryImage) {
      source = currentWord.primaryImage;
    }

    // Fallback: try constructing path if we have a word (Risk of 404 if file missing, but useful for secondary words)
    if (!source && lessonNumber && currentWord.word) {
      // Only do this if it's NOT a single letter consonant that we missed in the map, 
      // OR if it's a full word like "กา"
      // Supports lessons 1-8 (บทที่1 to บทที่8)
      if (currentWord.word.length > 1) {
        const lessonNum = parseInt(lessonNumber);
        // Use the correct folder path based on lesson number
        if (lessonNum >= 1 && lessonNum <= 8) {
          source = `/คำศัพท์บท1-4/บทที่${lessonNumber}/${currentWord.word}.png`;
        }
      }
    }

    // Final Fallback: Consonant Card image (from backend 'image' field)
    if (!source) {
      source = currentWord.fallbackImage;
    }

    setImgSrc(source);
    setImgError(false);
  }, [currentWord, lessonNumber]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          📚 คำศัพท์
        </h2>
        <p className="text-gray-600">
          คำที่ {currentWordIndex + 1} / {words.length}
        </p>
      </div>

      {/* Word Card */}
      <motion.div
        key={currentWordIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center flex flex-col items-center"
      >
        <div className="h-64 flex items-center justify-center mb-6">
          {!imgError && imgSrc ? (
            <img
              src={imgSrc} // Use raw path, let browser handle encoding (matches ContentStep)
              alt={currentWord.word}
              className="h-full w-auto object-contain drop-shadow-xl p-4 bg-white rounded-xl"
              onError={(e) => {
                console.warn('Image failed to load:', imgSrc);

                // If vocabulary image failed, try fallback: consonant image from ก-ฮ folder
                if (imgSrc && imgSrc.includes('/คำศัพท์บท') && currentWord.word) {
                  const firstChar = currentWord.word.charAt(0);
                  if (firstChar && /[ก-ฮ]/.test(firstChar)) {
                    // Only use ก-ฮ as fallback if vocab image doesn't exist
                    const consonantPath = `/ก-ฮ/${firstChar}.png`;
                    setImgSrc(consonantPath);
                    return; // Don't set error yet, try consonant image first
                  }
                }

                // If consonant image also failed (or not applicable), try other fallbacks
                if (imgSrc && imgSrc.includes('/ก-ฮ/')) {
                  // Consonant image also failed, try other sources
                  if (currentWord.primaryImage && imgSrc !== currentWord.primaryImage) {
                    setImgSrc(currentWord.primaryImage);
                  } else if (currentWord.fallbackImage && imgSrc !== currentWord.fallbackImage) {
                    setImgSrc(currentWord.fallbackImage);
                  } else {
                    // All failed, show emoji instead
                    setImgError(true);
                  }
                } else if (currentWord.primaryImage && imgSrc !== currentWord.primaryImage) {
                  setImgSrc(currentWord.primaryImage);
                } else if (currentWord.fallbackImage && imgSrc !== currentWord.fallbackImage) {
                  setImgSrc(currentWord.fallbackImage);
                } else {
                  // All failed, show emoji instead
                  setImgError(true);
                }
              }}
            />
          ) : (
            <div className="text-8xl">{currentWord.emoji || '📖'}</div>
          )}
        </div>
        <h3 className="text-6xl font-bold text-gray-900 mb-4">{currentWord.word}</h3>
        <p className="text-2xl text-gray-600 mb-6">{currentWord.meaning}</p>

        {String(lessonNumber) !== '4' && (
          <button
            onClick={() => playAudio(currentWord.audio, currentWord.meaning || currentWord.word)}
            className="flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition shadow-lg mx-auto"
          >
            <Volume2 size={20} />
            ฟังเสียง
          </button>
        )}
      </motion.div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2">
        {words.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentWordIndex(index)}
            className={`w-3 h-3 rounded-full transition ${index === currentWordIndex
              ? 'bg-blue-500 w-8'
              : index <= currentWordIndex
                ? 'bg-green-400'
                : 'bg-gray-300'
              }`}
          />
        ))}
      </div>

      {/* Word Navigation */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setCurrentWordIndex(Math.max(0, currentWordIndex - 1))}
          disabled={currentWordIndex === 0}
          className={`px-4 py-2 rounded-lg ${currentWordIndex === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          ← คำก่อนหน้า
        </button>
        <button
          onClick={() => setCurrentWordIndex(Math.min(words.length - 1, currentWordIndex + 1))}
          disabled={currentWordIndex === words.length - 1}
          className={`px-4 py-2 rounded-lg ${currentWordIndex === words.length - 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
          คำถัดไป →
        </button>
      </div>
    </div>
  );
};

// Listening Activity Component
const ListeningActivity = ({ step, playAudio, onAnswer, currentAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(currentAnswer);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    onAnswer(optionIndex);

    const isCorrect = step.content.options[optionIndex].isCorrect;
    if (isCorrect) {
      toast.success('🎉 ถูกต้อง!');
    } else {
      toast.error('❌ ลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {step.title}
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {step.content.question}
        </p>
      </div>

      {/* Audio Player */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => playAudio(step.content.audio)}
          className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition shadow-2xl"
        >
          <Volume2 size={48} />
        </button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        {step.content.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(index)}
            className={`p-6 rounded-xl border-2 transition ${selectedAnswer === index
              ? option.isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-blue-500'
              }`}
          >
            <div className="text-6xl mb-3">{option.emoji}</div>
            <div className="text-2xl font-bold text-gray-900">{option.text}</div>
            {showResult && selectedAnswer === index && (
              <div className="mt-2">
                {option.isCorrect ? (
                  <span className="text-green-600 font-semibold">✅ ถูกต้อง</span>
                ) : (
                  <span className="text-red-600 font-semibold">❌ ไม่ถูกต้อง</span>
                )}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Matching Activity Component
const MatchingActivity = ({ step, onAnswer, currentAnswer }) => {
  const [matches, setMatches] = useState(currentAnswer || {});
  const [selectedWord, setSelectedWord] = useState(null);

  const handleWordClick = (wordObj) => {
    setSelectedWord(wordObj);
  };

  const handleImageClick = (imageObj) => {
    if (selectedWord) {
      const newMatches = {
        ...matches,
        [selectedWord.id]: imageObj.id
      };
      setMatches(newMatches);
      onAnswer(newMatches);
      setSelectedWord(null);

      // Check if correct
      if (selectedWord.id === imageObj.id) {
        toast.success('✅ ถูกต้อง!');
      } else {
        toast.error('❌ ลองใหม่อีกครั้ง');
      }
    }
  };

  const correctMatches = Object.entries(matches).filter(([wordId, imageId]) => wordId === imageId).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {step.title}
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          {step.content.question}
        </p>
        <p className="text-sm text-gray-500">
          จับคู่ได้: {correctMatches} / {step.content.pairs.length}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Words Column */}
        <div className="space-y-3">
          {step.content.pairs.map((pair) => (
            <motion.button
              key={pair.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWordClick(pair)}
              className={`w-full p-4 rounded-lg text-xl font-bold transition ${selectedWord?.id === pair.id
                ? 'bg-blue-500 text-white shadow-lg'
                : matches[pair.id]
                  ? matches[pair.id] === pair.id
                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                    : 'bg-red-100 text-red-800 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
              {pair.word}
            </motion.button>
          ))}
        </div>

        {/* Images Column */}
        <div className="space-y-3">
          {step.content.pairs.map((pair) => (
            <motion.button
              key={pair.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleImageClick(pair)}
              className={`w-full p-4 rounded-lg text-6xl transition ${Object.values(matches).includes(pair.id)
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-gray-100 hover:bg-gray-200'
                }`}
            >
              {pair.image}
            </motion.button>
          ))}
        </div>
      </div>

      {correctMatches === step.content.pairs.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
        >
          <Award className="text-green-600 mx-auto mb-2" size={48} />
          <p className="text-xl font-bold text-green-800">
            🎉 ยอดเยี่ยม! จับคู่ถูกทุกคู่แล้ว
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Writing Activity Step Component
const WritingActivityStep = ({ step, onComplete }) => {
  const wordToWrite = step.content.word || 'ก';
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const canvasRef = useRef(null);
  const { token } = useAuth();

  // Check if canvas is empty
  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 0) {
        return false;
      }
    }
    return true;
  };

  // Check handwriting using Claude API via backend
  const checkHandwriting = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isCanvasEmpty()) {
      toast.error('กรุณาเขียนอักษรบนกระดานก่อนตรวจสอบ');
      return;
    }

    setIsChecking(true);
    setAiExplanation('');

    try {
      const imageData = canvas.toDataURL('image/png');

      console.log('Sending to backend API for handwriting detection...');

      // Call backend API which proxies to AI (Claude or Typhoon OCR)
      const response = await fetch(getApiUrl('/student/writing/detect'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageData,
          targetWord: wordToWrite
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend API Error:', errorData);
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend API response:', data);

      if (!data.success) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');
      }

      const result = data.data;

      setDetectedText(result.detectedText || 'ไม่พบตัวอักษร');
      setIsCorrect(result.isCorrect);
      setAiExplanation(result.explanation || '');

      if (result.isCorrect) {
        setIsCompleted(true);
        onComplete(step.id, wordToWrite, result.isCorrect, result.isCorrect ? 100 : 0);
        toast.success(`ถูกต้อง! 🎉 (ความมั่นใจ: ${result.confidence || 0}%)`);
      } else {
        toast.error('ยังไม่ถูกต้อง ลองอีกครั้ง');
      }

    } catch (error) {
      console.error('AI Error:', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง');
      setDetectedText('เกิดข้อผิดพลาด');
      setIsCorrect(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleWritingComplete = async (hasContent) => {
    if (!hasContent) {
      toast.error('กรุณาเขียนบนกระดานก่อนตรวจสอบ');
      return;
    }
    // Call AI detection
    await checkHandwriting();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ✍️ กิจกรรม: ฝึกเขียน
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {step.content.question || 'ลากนิ้วเขียนตามจุดประ'}
        </p>
      </div>

      {/* Word to write */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center mb-6">
        <p className="text-sm text-gray-600 mb-2">เขียนคำว่า:</p>
        <div className="text-8xl font-bold text-blue-600 mb-4">{wordToWrite}</div>
        <p className="text-gray-600">ใช้เมาส์หรือนิ้วลากเขียนบนกระดานด้านล่าง</p>
      </div>

      {/* Handwriting Canvas */}
      <div className="flex justify-center">
        <div className="relative">
          <HandwritingCanvas
            canvasRef={canvasRef}
            width={400}
            height={400}
            strokeColor="#2563eb"
            strokeWidth={8}
            onComplete={handleWritingComplete}
          />
          {isChecking && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-xl">
              <Loader className="w-8 h-8 text-white animate-spin mb-4" />
              <p className="text-white font-semibold">AI กำลังตรวจสอบ...</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Result */}
      {detectedText && !isChecking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${isCorrect
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
            }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
            ) : (
              <XCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-800 mb-1">
                {isCorrect ? '✨ ถูกต้อง!' : '❌ ยังไม่ถูกต้อง'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                AI อ่านได้: <span className="font-bold text-lg">{detectedText || '-'}</span>
              </p>
              {aiExplanation && (
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">
                    💡 <span className="font-medium">คำแนะนำจาก AI:</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{aiExplanation}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <p className="text-xl font-bold text-green-800">
            ✅ เก่งมาก! เขียนเสร็จแล้ว
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Summary Step Component
const SummaryStep = ({ step, postTestStatus }) => {
  const isPostTestUnlocked = postTestStatus?.isPostTestUnlocked || false;
  const isPostTestCompleted = postTestStatus?.isPostTestCompleted || false;
  const hasPostTest = postTestStatus?.hasPostTest || false;
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Award className="text-yellow-500 mx-auto mb-4" size={80} />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 ยินดีด้วย! เรียนจบแล้ว
        </h2>
        <p className="text-lg text-gray-600">
          คุณเรียนจบบทเรียนนี้เรียบร้อยแล้ว
        </p>
      </div>

      {/* Summary Points */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">
          📌 {step.content.title}:
        </h3>
        <ul className="space-y-2">
          {step.content.points.map((point, idx) => (
            <li key={`point-${idx}-${point.substring(0, 20)}`} className="flex items-start gap-2">
              <CheckCircle className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-purple-800 mb-4">
          🎯 ขั้นตอนต่อไป:
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <span>ทำแบบทดสอบก่อนเรียน</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <span>เรียนบทเรียน CAI</span>
          </div>
          <div className="flex items-center gap-3 text-blue-700 font-semibold">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">→</div>
            <span>ทำแบบทดสอบหลังเรียน (ขั้นตอนถัดไป)</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">🔒</div>
            <span>เล่นเกมทบทวน (ปลดล็อกหลังผ่าน Post-test)</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-4">
        <p className="text-lg text-gray-700 mb-4">
          พร้อมทำแบบทดสอบหลังเรียนหรือยัง? 🎯
        </p>
      </div>
    </div>
  );
};

export default LessonDetailPage;
