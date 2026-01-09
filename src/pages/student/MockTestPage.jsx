import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';

const MockTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testState, setTestState] = useState('intro'); // intro, testing, result
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/lessons/tests/${testId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const testData = response.data.data.test;
          setTest(testData);
          setTimeLeft((testData.timeLimit || 30) * 60); // Convert to seconds
          setQuestions(testData.questions || []);
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดแบบทดสอบ');
        navigate('/dashboard/student');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [testId, navigate]);

  useEffect(() => {
    // Timer
    if (testState === 'testing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testState, timeLeft]);

  const startTest = () => {
    setTestState('testing');
    setAnswers({});
    setCurrentQuestionIndex(0);
    toast.success('เริ่มทำแบบทดสอบ!');
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    });
  };

  const handleSubmitTest = async () => {
    const score = calculateScore();
    const timeSpent = test?.timeLimit ? (test.timeLimit * 60 - timeLeft) : null;

    // Prepare answers in the format expected by backend
    // Backend expects answers as { questionId: answerIndex }
    // Use _id if available, otherwise use id
    const formattedAnswers = {};
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const answerKey = q._id || q.id;
      if (answers[answerKey] !== undefined) {
        formattedAnswers[questionId] = answers[answerKey];
      }
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/student/tests/${testId}/submit`),
        {
          answers: formattedAnswers,
          timeSpent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data?.success) {
        setTestState('result');

        if (score >= (test?.passingScore || 60)) {
          setShowConfetti(true);
          toast.success(`🎉 ยินดีด้วย! คุณผ่านแบบทดสอบ คะแนน ${score}%`);
        } else {
          toast('💪 เกือบแล้ว! ลองทบทวนและทำใหม่อีกครั้ง');
        }
      } else {
        toast.error('เกิดข้อผิดพลาดในการบันทึกผลแบบทดสอบ');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกผลแบบทดสอบ');
      // Still show result even if submission fails
      setTestState('result');
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      if (answers[questionId] === q.correctAnswer) {
        correct++;
      }
    });
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  };

  const getCorrectCount = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      if (answers[questionId] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStarRating = (score) => {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  if (isLoading || !test || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดแบบทดสอบ...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionId = currentQuestion?._id || currentQuestion?.id;
  const isAnswered = answers[currentQuestionId] !== undefined;
  const allAnswered = questions.every(q => {
    const questionId = q._id || q.id;
    return answers[questionId] !== undefined;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 md:p-8">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <div className="max-w-4xl mx-auto">
        {/* Intro Screen */}
        {testState === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <div className="text-8xl mb-6">
              {test.type === 'PRE_TEST' && '📝'}
              {test.type === 'POST_TEST' && '✅'}
              {test.type === 'NORMAL' && '📋'}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-indigo-800 mb-4">📋 รายละเอียด:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <Clock className="text-blue-500 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600">เวลา</p>
                  <p className="font-bold text-gray-900">{test.timeLimit} นาที</p>
                </div>
                <div>
                  <AlertCircle className="text-purple-500 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600">จำนวนข้อ</p>
                  <p className="font-bold text-gray-900">{questions.length} ข้อ</p>
                </div>
                <div>
                  <Trophy className="text-yellow-500 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600">เกณฑ์ผ่าน</p>
                  <p className="font-bold text-gray-900">{test.passingScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-800">
                ⚠️ <strong>ข้อจำกัด:</strong> ทำได้เพียง 1 ครั้งเท่านั้น
              </p>
            </div>

            <button
              onClick={startTest}
              className="px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-bold rounded-full hover:from-indigo-600 hover:to-purple-600 transition shadow-lg"
            >
              เริ่มทำแบบทดสอบ
            </button>
          </motion.div>
        )}

        {/* Testing Screen */}
        {testState === 'testing' && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (confirm('คุณต้องการออกจากแบบทดสอบหรือไม่? ข้อมูลจะไม่ถูกบันทึก')) {
                      navigate('/dashboard/student');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
                >
                  <ArrowLeft size={20} />
                  ออก
                </button>

                <div className="flex items-center gap-2 text-red-600">
                  <Clock size={24} />
                  <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{test.title}</h2>
                <span className="text-lg text-gray-600">
                  ข้อ {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <button
                      onClick={() => speak(currentQuestion.question)}
                      className="p-3 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors flex-shrink-0 mt-1"
                      title="อ่านโจทย์ให้ฟัง"
                    >
                      <Volume2 size={24} />
                    </button>
                    <h3 className="text-2xl font-semibold text-gray-900 leading-relaxed">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  {/* Show emoji from imageUrl if it's an emoji reference */}
                  {(currentQuestion.imageUrl || currentQuestion.question?.match(/[\u{1F300}-\u{1F9FF}]/u)) && (
                    <div className="flex justify-center mb-6">
                      <div className="w-48 h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center border-4 border-blue-200 shadow-lg">
                        {(() => {
                          if (currentQuestion.imageUrl?.startsWith('emoji:')) {
                            const validIndex = currentQuestion.correctAnswer !== undefined ? currentQuestion.correctAnswer : 0;
                            const optionEmoji = currentQuestion.options[validIndex]?.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0];
                            return <span className="text-8xl">{optionEmoji || '🖼️'}</span>;
                          }
                          const questionEmoji = currentQuestion.question?.match(/[\u{1F300}-\u{1F9FF}]/u);
                          if (questionEmoji) {
                            return <span className="text-8xl">{questionEmoji[0]}</span>;
                          }
                          return <span className="text-8xl">🖼️</span>;
                        })()}
                      </div>
                    </div>
                  )}

                  {currentQuestion.audioUrl && (
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={() => toast.success('🔊 กำลังเล่นเสียง')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                      >
                        <Volume2 size={20} />
                        ฟังเสียง
                      </button>
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => {
                    const questionId = currentQuestion._id || currentQuestion.id;
                    const isSelected = answers[questionId] === index;

                    // Extract emoji and text from option (format: "🐍 งู → ง")
                    const emojiMatch = option.match(/[\u{1F300}-\u{1F9FF}]/u);
                    const emoji = emojiMatch ? emojiMatch[0] : null;
                    const textParts = option.split('→');
                    const displayText = textParts.length > 1 ? textParts[1].trim() : option;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnswerSelect(questionId, index)}
                        className={`p-6 rounded-xl border-2 transition ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          {emoji && (
                            <div className="text-6xl mb-2">{emoji}</div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300'
                              }`}>
                              {isSelected && <CheckCircle className="text-white" size={20} />}
                            </div>
                            <span className="text-xl font-bold text-gray-900 text-center">{displayText}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${currentQuestionIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-500'
                      }`}
                  >
                    <ChevronLeft size={20} />
                    ข้อก่อนหน้า
                  </button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition"
                    >
                      ข้อถัดไป
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      disabled={!allAnswered}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${allAnswered
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <CheckCircle size={20} />
                      ส่งคำตอบ
                    </button>
                  )}
                </div>

                {/* Answer Progress */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {questions.map((q, index) => {
                    const questionId = q._id || q.id;
                    return (
                      <button
                        key={questionId}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${answers[questionId] !== undefined
                          ? 'bg-green-500 text-white'
                          : index === currentQuestionIndex
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Result Screen */}
        {testState === 'result' && (
          <TestResult
            test={test}
            questions={questions}
            answers={answers}
            score={calculateScore()}
            correctCount={getCorrectCount()}
            onRetry={() => navigate('/dashboard/student')}
            onExit={() => navigate('/dashboard/student')}
          />
        )}
      </div>
    </div>
  );
};

// Test Result Component
const TestResult = ({ test, questions, answers, score, correctCount, onRetry, onExit }) => {
  const stars = score >= 90 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
  const isPassed = score >= (test.passingScore || 60);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg p-12"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Trophy className={`mx-auto mb-4 ${isPassed ? 'text-yellow-500' : 'text-gray-400'}`} size={100} />
        </motion.div>

        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          {isPassed ? '🎉 ยินดีด้วย!' : '💪 พยายามต่อไป!'}
        </h2>
        <p className="text-lg text-gray-600">
          {isPassed ? 'คุณผ่านแบบทดสอบแล้ว' : 'คุณยังไม่ผ่านแบบทดสอบ'}
        </p>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 mb-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">คะแนนที่ได้</p>
          <p className={`text-7xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {score}
          </p>
          <p className="text-2xl text-gray-600">/ 100</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
            >
              <Trophy
                size={48}
                className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">ตอบถูก</p>
          <p className="text-2xl font-bold text-green-600">{correctCount}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <XCircle className="text-red-600 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">ตอบผิด</p>
          <p className="text-2xl font-bold text-red-600">{questions.length - correctCount}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <AlertCircle className="text-blue-600 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">ทั้งหมด</p>
          <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
        </div>
      </div>

      {/* Answers Review */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📝 เฉลยข้อสอบ:</h3>
        <div className="space-y-4">
          {questions.map((q, index) => {
            const questionId = q._id || q.id;
            const userAnswer = answers[questionId];
            const isCorrect = userAnswer === q.correctAnswer;

            return (
              <div key={questionId} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-2">
                      ข้อ {index + 1}: {q.question}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>คำตอบที่ถูก:</strong> {q.options[q.correctAnswer]}
                    </p>
                    {!isCorrect && userAnswer !== undefined && (
                      <p className="text-sm text-red-600">
                        <strong>คุณตอบ:</strong> {q.options[userAnswer]}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-sm text-blue-600 mt-2">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlock Message */}
      {isPassed && test.type === 'POST_TEST' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-green-800 mb-2">🔓 ปลดล็อกแล้ว!</h3>
          <p className="text-green-700">
            ✅ แบบทดสอบธรรมดา<br />
            ✅ เกมทบทวน (3 เกม)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onExit}
          className="px-8 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </motion.div>
  );
};

export default MockTestPage;
