import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
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
  const [selectedPair, setSelectedPair] = useState(null); // For matching questions

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

  // Reset selected pair when question changes
  useEffect(() => {
    setSelectedPair(null);
  }, [currentQuestionIndex]);

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

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitTest = async () => {
    const score = calculateScore();
    const timeSpent = test?.timeLimit ? (test.timeLimit * 60 - timeLeft) : null;

    // Prepare answers in the format expected by backend
    // Backend expects answers as { questionId: answerIndex or array }
    // Use _id if available, otherwise use id
    const formattedAnswers = {};
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const answerKey = q._id || q.id;
      if (answers[answerKey] !== undefined) {
        // For matching questions, convert object to array of selected option indices
        if (q.isMatching && typeof answers[answerKey] === 'object' && !Array.isArray(answers[answerKey])) {
          const matchingObj = answers[answerKey];
          // Convert {0: 0, 1: 2} to [0, 2] (array of selected option indices in order)
          const matchingPairs = q.matchingPairs || [];
          const answerArray = matchingPairs.map((_, idx) => matchingObj[idx]).filter(idx => idx !== undefined);
          formattedAnswers[questionId] = answerArray;
        } else {
        formattedAnswers[questionId] = answers[answerKey];
        }
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

        // Pretest: ไม่ต้องผ่านเกณฑ์ (ทำได้เลย)
        // Posttest: ต้องผ่านเกณฑ์
        if (test?.type === 'PRE_TEST') {
          // Pretest: ไม่ต้องผ่านเกณฑ์
          setShowConfetti(true);
          toast.success(`✅ ทำแบบทดสอบก่อนเรียนเสร็จแล้ว! คะแนน ${score}%`);
        } else if (test?.type === 'POST_TEST') {
          // Posttest: ต้องผ่านเกณฑ์
          if (score >= (test?.passingScore || 60)) {
            setShowConfetti(true);
            toast.success(`🎉 ยินดีด้วย! คุณผ่านแบบทดสอบหลังเรียน คะแนน ${score}%`);
          } else {
            toast.error(`💪 คุณทำคะแนนได้ ${score}% แต่ต้องได้ ${test?.passingScore || 60}% ขึ้นไป กรุณาทำใหม่อีกครั้ง`);
          }
        } else {
          // Other tests
        if (score >= (test?.passingScore || 60)) {
          setShowConfetti(true);
          toast.success(`🎉 ยินดีด้วย! คุณผ่านแบบทดสอบ คะแนน ${score}%`);
        } else {
          toast('💪 เกือบแล้ว! ลองทบทวนและทำใหม่อีกครั้ง');
          }
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
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer;

      if (q.isMultipleChoice) {
        // Multiple choice: compare arrays
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        }
      } else if (q.isMatching) {
        // Matching: check if all pairs are correct
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          // User answer is an object like {0: 0, 1: 2} meaning pair 0 → option 0, pair 1 → option 2
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;
          
          for (let i = 0; i < matchingPairs.length; i++) {
            const pair = matchingPairs[i];
            const userSelectedOption = userAnswer[i];
            const correctOptionIndex = q.options.indexOf(pair.right);
            
            if (userSelectedOption !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }
          
          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) {
            correct++;
          }
        } else if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        } else if (userAnswer === correctAnswer) {
          correct++;
        }
      } else {
        // Single choice: direct comparison
        if (userAnswer === correctAnswer) {
        correct++;
        }
      }
    });
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  };

  const getCorrectCount = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer;

      if (q.isMultipleChoice) {
        // Multiple choice: compare arrays
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        }
      } else if (q.isMatching) {
        // Matching: check if all pairs are correct
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          // User answer is an object like {0: 0, 1: 2}
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;
          
          for (let i = 0; i < matchingPairs.length; i++) {
            const pair = matchingPairs[i];
            const userSelectedOption = userAnswer[i];
            const correctOptionIndex = q.options.indexOf(pair.right);
            
            if (userSelectedOption !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }
          
          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) {
            correct++;
          }
        } else if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        } else if (userAnswer === correctAnswer) {
          correct++;
        }
      } else {
        // Single choice: direct comparison
        if (userAnswer === correctAnswer) {
        correct++;
        }
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

  // Remove colon after "บทที่ X:" in title
  const formatTestTitle = (title) => {
    if (!title) return title;
    return title.replace(/บทที่ (\d+):/g, 'บทที่ $1');
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
              {test.type === 'PRE_TEST' && '⭐'}
              {test.type === 'POST_TEST' && '⭐'}
              {test.type === 'NORMAL' && '📋'}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{formatTestTitle(test.title)}</h1>

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
                  <Star className="text-yellow-500 mx-auto mb-2 fill-yellow-500" size={32} />
                  <p className="text-sm text-gray-600">เกณฑ์ผ่าน</p>
                  {test.type === 'PRE_TEST' ? (
                    <p className="font-bold text-gray-500">ไม่มีการกำหนดเกณฑ์ผ่าน</p>
                  ) : (
                  <p className="font-bold text-gray-900">{test.passingScore}%</p>
                  )}
                </div>
              </div>
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
                <h2 className="text-2xl font-bold text-gray-900">{formatTestTitle(test.title)}</h2>
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

                  {/* Show image from imageUrl */}
                  {currentQuestion.imageUrl && !currentQuestion.imageUrl.startsWith('emoji:') && (
                    <div className="flex justify-center mb-6">
                      <div className="w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center border-4 border-blue-200 shadow-lg p-4">
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Question"
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<span class="text-8xl">🖼️</span>';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Show imageOptions for multiple choice questions - Only for questions that explicitly have imageOptions (not single choice) */}
                  {currentQuestion.imageOptions && currentQuestion.imageOptions.length > 0 && currentQuestion.isMultipleChoice && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-3 text-center">เลือกรูปภาพที่ถูกต้อง:</p>
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {currentQuestion.imageOptions.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="bg-white rounded-lg border-2 border-gray-200 p-3">
                            <img
                              src={imgUrl}
                              alt={`Option ${imgIdx + 1}`}
                              className="w-full h-32 object-contain rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="text-center text-gray-400">ไม่พบรูปภาพ</div>';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show matching pairs for matching questions */}
                  {currentQuestion.isMatching && currentQuestion.matchingPairs && currentQuestion.matchingPairs.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-3 text-center">จับคู่พยัญชนะกับภาพ:</p>
                      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {currentQuestion.matchingPairs.map((pair, pairIdx) => (
                          <div key={pairIdx} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-4">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              {pair.leftImage && (
                                <img
                                  src={pair.leftImage}
                                  alt={pair.left}
                                  className="w-16 h-16 object-contain"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <span className="text-2xl font-bold text-gray-900">{pair.left}</span>
                            </div>
                            <div className="text-center text-gray-500 mb-2">→</div>
                            <div className="flex items-center justify-center gap-3">
                              {pair.rightImage && (
                                <img
                                  src={pair.rightImage}
                                  alt={pair.right}
                                  className="w-16 h-16 object-contain"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <span className="text-2xl font-bold text-gray-900">{pair.right}</span>
                            </div>
                          </div>
                        ))}
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
                {!currentQuestion.isMatching ? (
                  <div className={`grid gap-4 ${currentQuestion.isMultipleChoice ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {currentQuestion.options.map((option, index) => {
                    const questionId = currentQuestion._id || currentQuestion.id;
                      const isSelected = currentQuestion.isMultipleChoice
                        ? Array.isArray(answers[questionId]) && answers[questionId].includes(index)
                        : answers[questionId] === index;

                    // Extract emoji and text from option (format: "🐍 งู → ง")
                    const emojiMatch = option.match(/[\u{1F300}-\u{1F9FF}]/u);
                    const emoji = emojiMatch ? emojiMatch[0] : null;
                    const textParts = option.split('→');
                    const displayText = textParts.length > 1 ? textParts[1].trim() : option;

                      // Get corresponding image if imageOptions exist
                      const optionImage = currentQuestion.imageOptions && currentQuestion.imageOptions[index];

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (currentQuestion.isMultipleChoice) {
                              const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];
                              const newAnswers = currentAnswers.includes(index)
                                ? currentAnswers.filter(i => i !== index)
                                : [...currentAnswers, index];
                              handleAnswerSelect(questionId, newAnswers);
                            } else {
                              handleAnswerSelect(questionId, index);
                            }
                          }}
                        className={`p-6 rounded-xl border-2 transition ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                            {/* Only show image for multiple choice questions with imageOptions, not for single choice */}
                            {optionImage && currentQuestion.isMultipleChoice && currentQuestion.imageOptions && (
                              <img
                                src={optionImage}
                                alt={displayText}
                                className="w-24 h-24 object-contain mb-2"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            )}
                            {emoji && !optionImage && (
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
                ) : (
                  /* Matching Question - Select Pairs Interface */
                  <div className="space-y-6">
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 text-center">
                        💡 <strong>วิธีทำ:</strong> คลิกที่พยัญชนะด้านซ้าย แล้วเลือกตัวเลือกที่ถูกต้องจากด้านล่าง
                      </p>
                    </div>

                    {/* Matching pairs display */}
                    <div className="space-y-4">
                      {currentQuestion.matchingPairs && currentQuestion.matchingPairs.map((pair, pairIdx) => {
                        const questionId = currentQuestion._id || currentQuestion.id;
                        const userMatches = answers[questionId] || {};
                        const selectedOption = userMatches[pairIdx];

                        return (
                          <div
                            key={pairIdx}
                            className={`bg-white border-2 rounded-lg p-4 transition ${
                              selectedPair === pairIdx
                                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                : selectedOption !== undefined
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Left: Consonant - Clickable */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setSelectedPair(selectedPair === pairIdx ? null : pairIdx);
                                }}
                                className={`flex items-center gap-3 flex-1 p-3 rounded-lg transition ${
                                  selectedPair === pairIdx
                                    ? 'bg-indigo-100'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {pair.leftImage && (
                                  <img
                                    src={pair.leftImage}
                                    alt={pair.left}
                                    className="w-16 h-16 object-contain"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <span className="text-2xl font-bold text-gray-900">{pair.left}</span>
                                <span className="text-gray-400 text-xl">→</span>
                              </motion.button>

                              {/* Middle: Selected answer */}
                              <div className="flex-1 text-center">
                                {selectedOption !== undefined ? (
                                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-300 rounded-lg">
                                    {currentQuestion.options[selectedOption] && (
                                      <img
                                        src={currentQuestion.imageOptions && currentQuestion.imageOptions[selectedOption] 
                                          ? currentQuestion.imageOptions[selectedOption]
                                          : currentQuestion.matchingPairs[pairIdx]?.rightImage}
                                        alt={currentQuestion.options[selectedOption]}
                                        className="w-12 h-12 object-contain"
                                        onError={(e) => e.target.style.display = 'none'}
                                      />
                                    )}
                                    <span className="text-lg font-bold text-green-900">
                                      {currentQuestion.options[selectedOption]}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newMatches = { ...userMatches };
                                        delete newMatches[pairIdx];
                                        handleAnswerSelect(questionId, newMatches);
                                        setSelectedPair(null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                      title="ลบการจับคู่"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">คลิกที่พยัญชนะเพื่อเลือก</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Options to select - Only show when a pair is selected */}
                    {selectedPair !== null && (
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-900 text-center mb-3">
                          📋 เลือกตัวเลือกเพื่อจับคู่กับ <strong>{currentQuestion.matchingPairs[selectedPair]?.left}</strong>:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {currentQuestion.options.map((option, index) => {
                            const questionId = currentQuestion._id || currentQuestion.id;
                            const userMatches = answers[questionId] || {};
                            const isUsed = Object.values(userMatches).includes(index) && userMatches[selectedPair] !== index;
                            
                            // Get image for this option from imageOptions array
                            const optionImage = currentQuestion.imageOptions && currentQuestion.imageOptions[index];

                            return (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const newMatches = { ...userMatches, [selectedPair]: index };
                                  handleAnswerSelect(questionId, newMatches);
                                  setSelectedPair(null);
                                }}
                                disabled={isUsed}
                                className={`p-4 rounded-lg border-2 transition flex flex-col items-center justify-center ${
                                  isUsed
                                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                                }`}
                              >
                                {optionImage && (
                                  <img
                                    src={optionImage}
                                    alt={option}
                                    className="w-16 h-16 object-contain mb-2"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <span className={`text-lg font-bold block text-center ${isUsed ? 'text-gray-400' : 'text-gray-900'}`}>{option}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => {
                      setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                      setSelectedPair(null); // Reset selected pair when changing question
                    }}
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
                      onClick={() => {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                        setSelectedPair(null); // Reset selected pair when changing question
                      }}
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
  // Pretest: ไม่ต้องผ่านเกณฑ์ (ทำได้เลย)
  // Posttest: ต้องผ่านเกณฑ์
  const isPassed = test.type === 'PRE_TEST' 
    ? true // Pretest always passes
    : score >= (test.passingScore || 60); // Posttest must pass threshold

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
          <Star className={`mx-auto mb-4 ${isPassed ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} size={100} />
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
              <Star
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
            const correctAnswer = q.correctAnswer;

            // Check if answer is correct
            let isCorrect = false;
            if (q.isMultipleChoice) {
              // Multiple choice: compare arrays
              if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                const userSorted = [...userAnswer].sort((a, b) => a - b).join(',');
                const correctSorted = [...correctAnswer].sort((a, b) => a - b).join(',');
                isCorrect = userSorted === correctSorted;
              }
            } else if (q.isMatching) {
              // Matching: check if all pairs are correct
              if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
                // User answer is an object like {0: 0, 1: 2}
                const matchingPairs = q.matchingPairs || [];
                let allCorrect = true;
                
                for (let i = 0; i < matchingPairs.length; i++) {
                  const pair = matchingPairs[i];
                  const userSelectedOption = userAnswer[i];
                  const correctOptionIndex = q.options.indexOf(pair.right);
                  
                  if (userSelectedOption !== correctOptionIndex) {
                    allCorrect = false;
                    break;
                  }
                }
                
                isCorrect = allCorrect && Object.keys(userAnswer).length === matchingPairs.length;
              } else if (Array.isArray(userAnswer) && q.matchingPairs && Array.isArray(q.matchingPairs)) {
                // Array format: [0, 2] meaning pair 0 → option 0, pair 1 → option 2
                let allCorrect = true;
                for (let i = 0; i < q.matchingPairs.length; i++) {
                  const pair = q.matchingPairs[i];
                  const userSelectedOptionIdx = userAnswer[i];
                  const correctOptionIdx = q.options.indexOf(pair.right);
                  
                  if (userSelectedOptionIdx !== correctOptionIdx) {
                    allCorrect = false;
                    break;
                  }
                }
                isCorrect = allCorrect && userAnswer.length === q.matchingPairs.length;
              } else if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                // Fallback: compare arrays
                const userSorted = [...userAnswer].sort((a, b) => a - b).join(',');
                const correctSorted = [...correctAnswer].sort((a, b) => a - b).join(',');
                isCorrect = userSorted === correctSorted;
              } else {
                isCorrect = userAnswer === correctAnswer;
              }
            } else {
              // Single choice: direct comparison
              isCorrect = userAnswer === correctAnswer;
            }

            // Format correct answer for display
            const formatCorrectAnswer = () => {
              if (q.isMultipleChoice && Array.isArray(correctAnswer)) {
                return correctAnswer.map(idx => q.options[idx]).join(', ');
              } else if (q.isMatching) {
                // For matching, show pairs: จ → จาน, ช → ช้าง
                if (q.matchingPairs && Array.isArray(q.matchingPairs)) {
                  return q.matchingPairs.map(pair => `${pair.left} → ${pair.right}`).join(', ');
                } else if (Array.isArray(correctAnswer)) {
                  return correctAnswer.map(idx => q.options[idx]).join(', ');
                }
              } else if (typeof correctAnswer === 'number') {
                return q.options[correctAnswer];
              }
              return String(correctAnswer);
            };

            // Format user answer for display
            const formatUserAnswer = () => {
              if (userAnswer === undefined || userAnswer === null) {
                return 'ไม่ได้ตอบ';
              }
              if (q.isMultipleChoice && Array.isArray(userAnswer)) {
                return userAnswer.map(idx => q.options[idx]).join(', ');
              } else if (q.isMatching) {
                // For matching, show pairs user selected
                if (typeof userAnswer === 'object' && !Array.isArray(userAnswer) && q.matchingPairs) {
                  const pairs = q.matchingPairs.map((pair, idx) => {
                    const selectedOptionIdx = userAnswer[idx];
                    if (selectedOptionIdx !== undefined) {
                      return `${pair.left} → ${q.options[selectedOptionIdx]}`;
                    }
                    return `${pair.left} → (ไม่ได้เลือก)`;
                  });
                  return pairs.join(', ');
                } else if (Array.isArray(userAnswer)) {
                  return userAnswer.map(idx => q.options[idx]).join(', ');
                }
              } else if (typeof userAnswer === 'number') {
                return q.options[userAnswer];
              }
              return String(userAnswer);
            };

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
                      <strong>คำตอบที่ถูก:</strong> {formatCorrectAnswer() || '(ไม่มีคำตอบ)'}
                    </p>
                    {!isCorrect && userAnswer !== undefined && (
                      <p className="text-sm text-red-600">
                        <strong>คุณตอบ:</strong> {formatUserAnswer()}
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
      {isPassed && test.type === 'POST_TEST' && (() => {
        // Get actual game count from lesson if available
        const gameCount = test.lesson?.games?.length || test.lesson?.games?.filter(g => !g.isDeleted).length || 0;
        return (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-green-800 mb-2">🔓 ปลดล็อกแล้ว!</h3>
            <p className="text-green-700">
              ✅ แบบทดสอบธรรมดา<br />
              {gameCount > 0 && `✅ เกมทบทวน (${gameCount} เกม)`}
            </p>
          </div>
        );
      })()}

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
