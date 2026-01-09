import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Trophy,
  Star,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/MockAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, finished
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameData, setGameData] = useState(null);

  // Fetch game details
  const { data: game, isLoading } = useQuery(
    ['game', gameId],
    async () => {
      const response = await axios.get(`/api/lessons/games/${gameId}`);
      return response.data.data.game;
    }
  );

  // Submit game result mutation
  const submitGameMutation = useMutation(
    async (data) => {
      const response = await axios.post(`/api/student/games/${gameId}/submit`, data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('student-lessons');
        toast.success('บันทึกผลเกมสำเร็จ!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setGameData({
      startTime: Date.now(),
      actions: []
    });
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const handleGameOver = () => {
    setGameState('finished');
    
    const timeSpent = Math.floor((Date.now() - gameData.startTime) / 1000);
    
    submitGameMutation.mutate({
      score,
      level,
      timeSpent,
      data: gameData
    });

    if (score >= 70) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setGameData(null);
  };

  const handleScoreUpdate = (points) => {
    setScore(prev => {
      const newScore = prev + points;
      if (newScore >= level * 100) {
        setLevel(prev => prev + 1);
        toast.success(`เลเวล ${level + 1}!`);
      }
      return newScore;
    });
  };

  const renderGameContent = () => {
    switch (game?.type) {
      case 'MATCHING':
        return <MatchingGame onScoreUpdate={handleScoreUpdate} />;
      case 'DRAG_DROP':
        return <DragDropGame onScoreUpdate={handleScoreUpdate} />;
      case 'WORD_CONNECT':
        return <WordConnectGame onScoreUpdate={handleScoreUpdate} />;
      case 'MEMORY':
        return <MemoryGame onScoreUpdate={handleScoreUpdate} />;
      case 'QUIZ':
        return <QuizGame onScoreUpdate={handleScoreUpdate} />;
      default:
        return <div>เกมไม่พร้อมใช้งาน</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                  {game?.title}
                </h1>
                <p className="text-sm text-gray-500">
                  เกมการเรียนรู้ภาษาไทย
                </p>
              </div>
            </div>
            
            {gameState === 'playing' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{score}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">เลเวล {level}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{timeLeft}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-8 text-center"
          >
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {game?.title}
              </h2>
              <p className="text-gray-600 mb-6">
                เกม{game?.type === 'MATCHING' ? 'จับคู่' : 
                     game?.type === 'DRAG_DROP' ? 'ลากวาง' :
                     game?.type === 'WORD_CONNECT' ? 'โยงคำ' :
                     game?.type === 'MEMORY' ? 'จำ' : 'ตอบคำถาม'}
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition duration-200 text-lg"
              >
                เริ่มเล่น
              </motion.button>
              
              <button
                onClick={() => navigate('/dashboard/student')}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border p-8"
          >
            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={pauseGame}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition duration-200 flex items-center"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  หยุด
                </button>
              </div>
            </div>

            <div className="min-h-[500px]">
              {renderGameContent()}
            </div>
          </motion.div>
        )}

        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border p-8 text-center"
          >
            <div className="mb-8">
              <Pause className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                เกมหยุดชั่วคราว
              </h2>
              <p className="text-gray-600">
                คะแนน: {score} | เลเวล: {level} | เวลา: {timeLeft}s
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={resumeGame}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
              >
                ต่อเล่น
              </button>
              <button
                onClick={resetGame}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              >
                เริ่มใหม่
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border p-8 text-center"
          >
            <div className="mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                เกมจบแล้ว!
              </h2>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {score} คะแนน
              </p>
              <p className="text-lg text-gray-600">
                เลเวล {level} | เวลาที่ใช้: {60 - timeLeft} วินาที
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={resetGame}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                เล่นใหม่
              </button>
              <button
                onClick={() => navigate('/dashboard/student')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Simple game components (these would be more complex in a real implementation)
const MatchingGame = ({ onScoreUpdate }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-bold mb-4">เกมจับคู่</h3>
    <p className="text-gray-600 mb-8">จับคู่คำกับรูปภาพ</p>
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      {['ก', 'ข', 'ค', 'ง'].map((letter, index) => (
        <motion.button
          key={letter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onScoreUpdate(10)}
          className="p-8 bg-blue-100 rounded-lg text-2xl font-bold text-blue-800 hover:bg-blue-200 transition duration-200"
        >
          {letter}
        </motion.button>
      ))}
    </div>
  </div>
);

const DragDropGame = ({ onScoreUpdate }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-bold mb-4">เกมลากวาง</h3>
    <p className="text-gray-600 mb-8">ลากคำไปวางในตำแหน่งที่ถูกต้อง</p>
    <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
      <p className="text-lg">ลากคำ "___" มาวาง</p>
    </div>
  </div>
);

const WordConnectGame = ({ onScoreUpdate }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-bold mb-4">เกมโยงคำ</h3>
    <p className="text-gray-600 mb-8">โยงคำที่เกี่ยวข้องกัน</p>
    <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded-lg">กบ</div>
        <div className="p-4 bg-blue-100 rounded-lg">แมว</div>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-green-100 rounded-lg">บิน</div>
        <div className="p-4 bg-green-100 rounded-lg">วิ่ง</div>
      </div>
    </div>
  </div>
);

const MemoryGame = ({ onScoreUpdate }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-bold mb-4">เกมจำ</h3>
    <p className="text-gray-600 mb-8">จำตำแหน่งของคำ</p>
    <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="p-6 bg-gray-200 rounded-lg text-2xl font-bold">
          ?
        </div>
      ))}
    </div>
  </div>
);

const QuizGame = ({ onScoreUpdate }) => (
  <div className="text-center py-20">
    <h3 className="text-2xl font-bold mb-4">เกมตอบคำถาม</h3>
    <p className="text-gray-600 mb-8">ตอบคำถามเกี่ยวกับภาษาไทย</p>
    <div className="max-w-md mx-auto space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-medium">คำถาม: "ก" อยู่ตำแหน่งไหนในพยัญชนะ?</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onScoreUpdate(10)}
          className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition duration-200"
        >
          ตำแหน่งที่ 1
        </button>
        <button
          onClick={() => onScoreUpdate(0)}
          className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition duration-200"
        >
          ตำแหน่งที่ 2
        </button>
      </div>
    </div>
  </div>
);

export default GamePage;
