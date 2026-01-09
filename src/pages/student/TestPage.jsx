import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { useAuth } from '../../contexts/MockAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Fetch test details
  const { data: testData, isLoading } = useQuery(
    ['test', testId],
    async () => {
      const response = await axios.get(`/api/lessons/tests/${testId}`);
      return response.data.data.test;
    }
  );

  // Submit test mutation
  const submitTestMutation = useMutation(
    async (data) => {
      const response = await axios.post(`/api/student/tests/${testId}/submit`, data);
      return response.data.data;
    },
    {
      onSuccess: (result) => {
        setTestResult(result);
        setShowResult(true);
        queryClient.invalidateQueries('student-lessons');
        
        if (result.score >= 70) {
          setShowConfetti(true);
          toast.success(`ยินดีด้วย! คุณได้คะแนน ${result.score}%`);
        } else {
          toast.error(`คุณได้คะแนน ${result.score}% ลองใหม่อีกครั้ง`);
        }
        
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Timer effect
  useEffect(() => {
    if (testData?.timeLimit && !showResult) {
      setTimeLeft(testData.timeLimit * 60); // Convert minutes to seconds
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testData, showResult]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = () => {
    if (Object.keys(answers).length !== testData.questions.length) {
      if (!window.confirm('คุณยังไม่ได้ตอบคำถามทุกข้อ ต้องการส่งคำตอบหรือไม่?')) {
        return;
      }
    }

    const timeSpent = testData.timeLimit ? (testData.timeLimit * 60 - timeLeft) : null;
    
    submitTestMutation.mutate({
      answers,
      timeSpent
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'ยอดเยี่ยม!';
    if (score >= 70) return 'ดีมาก!';
    if (score >= 50) return 'ผ่าน';
    return 'ต้องปรับปรุง';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentQuestion = testData?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {testData?.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {testData?.type === 'PRE_TEST' ? 'แบบทดสอบก่อนเรียน' : 
                   testData?.type === 'POST_TEST' ? 'แบบทดสอบหลังเรียน' : 'แบบฝึกหัด'}
                </p>
              </div>
            </div>
            
            {timeLeft !== null && !showResult && (
              <div className="flex items-center space-x-2 text-red-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResult ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  คำถาม {currentQuestionIndex + 1} จาก {testData?.questions.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentQuestionIndex + 1) / testData?.questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / testData?.questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border mb-8"
            >
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {currentQuestion?.question}
                </h3>

                {/* Question Image */}
                {currentQuestion?.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion?.options?.map((option, index) => (
                    <motion.label
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                        answers[currentQuestion.id] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={index}
                        checked={answers[currentQuestion.id] === index}
                        onChange={() => handleAnswerChange(currentQuestion.id, index)}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          answers[currentQuestion.id] === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion.id] === index && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <span className="text-gray-800">{option}</span>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>

              <div className="flex space-x-4">
                {currentQuestionIndex === testData.questions.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitTest}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 flex items-center"
                    disabled={submitTestMutation.isLoading}
                  >
                    {submitTestMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    ส่งคำตอบ
                  </motion.button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
                  >
                    ถัดไป
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Results */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border p-8 text-center"
          >
            <div className="mb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ผลการทดสอบ
              </h2>
              <p className={`text-3xl font-bold ${getScoreColor(testResult.score)}`}>
                {testResult.score}%
              </p>
              <p className="text-lg text-gray-600 mt-2">
                {getScoreMessage(testResult.score)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">คำตอบที่ถูกต้อง</p>
                <p className="text-2xl font-bold text-blue-800">
                  {testResult.correctAnswers}/{testResult.totalQuestions}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">เวลาที่ใช้</p>
                <p className="text-2xl font-bold text-green-800">
                  {testResult.timeSpent ? formatTime(testResult.timeSpent) : 'ไม่จำกัด'}
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              >
                กลับหน้าหลัก
              </button>
              
              {testResult.score >= 70 ? (
                <button
                  onClick={() => navigate('/dashboard/student')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
                >
                  ต่อไป
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-200"
                >
                  ลองใหม่
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TestPage;
