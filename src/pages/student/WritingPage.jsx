import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eraser,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pen,
  Loader,
  Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { speakText } from '../../utils/speechHelper';
import WritingAnimation from '../../components/WritingAnimation';

const WritingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [detectedText, setDetectedText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [aiExplanation, setAiExplanation] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Default drawing style (Blue Pen)
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Redraw guide if exists
      if (currentWord) {
        drawGuide(currentWord);
      }
    };

    setCanvasSize();

    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, [currentWord]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawGuide = (word) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Save current state (blue pen)
    ctx.save();

    // Clear whole canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configure Guide Style (Gray Dashed)
    ctx.font = 'bold 180px "Noto Sans Thai", "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#9CA3AF'; // Gray-400 (Darker for AI visibility)
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]); // Dashed Line

    // Draw Guide
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 15; // Slight offset adjustment
    ctx.strokeText(word, centerX, centerY);

    // Restore state (Blue Pen)
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear and Redraw Guide
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentWord) {
      drawGuide(currentWord);
    }

    // Reset States
    setDetectedText('');
    setIsCorrect(null);
    setAiExplanation('');
  };

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
    if (!currentWord) {
      toast.error('กรุณาเลือกคำที่จะเขียน');
      return;
    }

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

      const token = localStorage.getItem('token');

      // Call backend API which saves image and detects (NEW - Recommended)
      const response = await fetch(getApiUrl('/student/writing/save-and-detect'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageData,
          targetWord: currentWord
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

      // Log saved image info
      if (result.imageUrl) {
        console.log('✅ Image saved:', result.imageUrl);
        console.log('📝 Attempt ID:', result.attemptId);
        console.log('🤖 Detection method:', result.method || 'Claude');
      }

      // Show feedback based on result (requires 60%+ confidence - lenient for children)
      if (result.isCorrect && result.confidence >= 60) {
        setScore(prev => prev + 10);
        toast.success(`ถูกต้อง! 🎉 (ความมั่นใจ: ${result.confidence}%)`, {
          duration: 3000
        });
      } else {
        // Provide more detailed feedback
        const confidenceMsg = result.confidence ? ` (ความมั่นใจ: ${result.confidence}%)` : '';
        const detailMsg = result.detectedText && result.detectedText !== currentWord 
          ? ` AI อ่านได้: "${result.detectedText}" แต่ควรเป็น "${currentWord}"`
          : '';
        toast.error(`ยังไม่ถูกต้อง${confidenceMsg}${detailMsg}`, {
          duration: 4000
        });
      }

      setAttempts(prev => [...prev, {
        word: currentWord,
        detected: result.detectedText || 'ไม่พบ',
        isCorrect: result.isCorrect,
        confidence: result.confidence || 0,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('AI Error:', error);
      
      // Extract error message from error object
      const errorMessage = error.message || 'เกิดข้อผิดพลาดในการตรวจสอบ';
      
      // Show user-friendly error message
      toast.error(errorMessage.includes('API') || errorMessage.includes('network') 
        ? 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        : errorMessage.includes('key') || errorMessage.includes('authentication')
        ? 'การตั้งค่า API ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ'
        : 'เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง'
      );
      
      // Don't set detectedText to error message - leave it empty or show a generic message
      setDetectedText('');
      setIsCorrect(false);
      setAiExplanation('เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsChecking(false);
    }
  };

  // Load new word
  const loadNewWord = () => {
    const words = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ญ', 'ด', 'ต', 'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ', 'ฮ'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    clearCanvas();
  };

  useEffect(() => {
    loadNewWord();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  ✍️ ฝึกเขียนภาษาไทยด้วย AI
                </h1>
                <p className="text-sm text-gray-500">
                  ใช้ AI ตรวจสอบลายมือ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">คะแนน</p>
                <p className="text-lg font-bold text-blue-600">{score}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Writing Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                เขียนคำว่า:
              </h2>
              <div className="text-6xl font-bold text-blue-600 text-center py-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                {currentWord}
              </div>
            </div>

            {/* Canvas */}
            <div className="relative mb-4 bg-white rounded-lg overflow-hidden border-2 border-gray-300">
              {/* Handwriting Guide */}
              {/* Canvas - Guide is now drawn ON the canvas context */}
              <canvas
                ref={canvasRef}
                className="w-full h-64 relative z-10 cursor-crosshair bg-transparent touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />

              {isChecking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg">
                  <Loader className="w-8 h-8 text-white animate-spin mb-4" />
                  <p className="text-white font-semibold">AI กำลังตรวจสอบ...</p>
                </div>
              )}
            </div>

            {/* AI Result */}
            {detectedText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg mb-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
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

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={clearCanvas}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                <Eraser size={20} />
                ลบ
              </button>

              <button
                onClick={checkHandwriting}
                disabled={isChecking}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    กำลังตรวจ...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    ให้ AI ตรวจ
                  </>
                )}
              </button>

              <button
                onClick={loadNewWord}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <RefreshCw size={20} />
                คำใหม่
              </button>
            </div>
          </motion.div>

          {/* Right: Instructions & History */}
          <div className="space-y-6">
            {/* Writing Guide - Animation */}
            {currentWord && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border-2 border-purple-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Pen size={24} className="text-purple-600" />
                    📝 วิธีเขียน "{currentWord}"
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => speakText(currentWord, { rate: 0.6 })}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-md transition"
                    title="กดฟังเสียง"
                  >
                    <Volume2 size={20} />
                  </motion.button>
                </div>

                {/* Animation Canvas */}
                <div className="mb-4">
                  <WritingAnimation character={currentWord} />
                </div>

                {/* Simple instruction */}
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <p className="text-lg text-gray-700 font-medium">
                    👆 กดดูวิธีเขียน แล้วเขียนให้ทับเส้นประสีเทา
                  </p>
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Pen size={24} className="text-blue-600" />
                วิธีใช้งาน
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                  <span>ดูคำที่แสดงด้านบนและวิธีเขียน</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                  <span>ใช้เมาส์หรือนิ้วเขียนทับเส้นประสีเทา ตามขั้นตอนที่กำหนด (เขียนนอกกรอบ = ไม่ถูกต้อง)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                  <span>กดปุ่ม "ให้ AI ตรวจ" เพื่อให้ AI ตรวจสอบลายมือ</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">4</span>
                  <span>อ่านคำแนะนำจาก AI และปรับปรุงการเขียน</span>
                </li>
              </ol>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">💡 เคล็ดลับ:</span> เขียนให้ทับเส้นประสีเทาให้ชัดเจน ตามขั้นตอนที่กำหนด (เขียนนอกกรอบหรือเขียนมั่ว = ไม่ถูกต้อง)
                </p>
              </div>
            </motion.div>

            {/* Attempt History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                ประวัติการเขียน
              </h3>

              {attempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีการเขียน</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {attempts.slice().reverse().map((attempt, idx) => (
                    <div
                      key={`${attempt.word}-${attempt.timestamp.getTime()}-${idx}`}
                      className={`p-3 rounded-lg border ${attempt.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            คำที่: <span className="text-lg">{attempt.word}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            AI อ่านได้: <span className="font-bold">{attempt.detected || '-'}</span>
                            {attempt.confidence !== undefined && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({attempt.confidence}%)
                              </span>
                            )}
                          </p>
                        </div>
                        {attempt.isCorrect ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <XCircle className="text-red-600" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingPage;
