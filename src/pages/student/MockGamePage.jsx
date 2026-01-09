import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Star,
  Clock,
  RotateCcw,
  Target,
  Volume2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';

const MockGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState('intro'); // intro, playing, result
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [matches, setMatches] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/lessons/games/${gameId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setGame(response.data.data.game);
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดเกม');
        navigate('/dashboard/student');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  useEffect(() => {
    // Timer
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleGameComplete();
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setMatches({});
    setTimeLeft(300);
    toast.success('เริ่มเกม!');
  };

  const handleGameComplete = () => {
    setGameState('result');
    const finalScore = calculateScore();
    setScore(finalScore);

    if (finalScore >= 80) {
      setShowConfetti(true);
      toast.success('🎉 ยอดเยี่ยม!');
    } else if (finalScore >= 60) {
      toast.success('👍 ดีมาก!');
    } else {
      toast('💪 พยายามต่อไป!');
    }
  };

  const calculateScore = () => {
    if (!game) return 0;

    const totalPairs = game.settings.pairs?.length || game.settings.items?.length || 0;

    if (game.type === 'DRAG_DROP') {
      const items = game.settings.items || [];
      const correctMatches = Object.entries(matches).filter(([itemId, zoneId]) => {
        const item = items.find(i => i.id === itemId);
        return item && item.groupId === zoneId;
      }).length;
      return totalPairs > 0 ? Math.round((correctMatches / totalPairs) * 100) : 0;
    }

    // Default Matching Game
    const correctMatches = Object.entries(matches).filter(([key, value]) => key === value).length;
    return totalPairs > 0 ? Math.round((correctMatches / totalPairs) * 100) : 0;
  };

  const handleMatch = (item, target) => {
    if (game.type === 'DRAG_DROP') {
      const newMatches = { ...matches, [item.id]: target.id };
      setMatches(newMatches);

      // Check correctness (item.groupId should match zone.id)
      if (item.groupId === target.id) {
        toast.success('✅ ถูกต้อง!');
        setScore(prev => prev + 10);
      } else {
        toast.error('❌ ลองใหม่อีกครั้ง');
        setTimeout(() => {
          setMatches(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
        }, 1000);
      }
    } else {
      // DEFAULT: MATCHING GAME logic
      const newMatches = { ...matches, [item.word]: target.word };
      setMatches(newMatches);
      setSelectedItem(null);

      // Check if they belong to the same pair (correct match)
      if (item.word === target.word) {
        toast.success('✅ ถูกต้อง!');
        setScore(prev => prev + 10);
      } else {
        toast.error('❌ ลองใหม่อีกครั้ง');
        // Auto-reset wrong match after 1 second
        setTimeout(() => {
          setMatches(prev => {
            const updated = { ...prev };
            delete updated[item.word];
            return updated;
          });
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setGameState('intro');
    setScore(0);
    setMatches({});
    setTimeLeft(300);
    setShowConfetti(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStarRating = () => {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  };

  if (isLoading || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดเกม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 md:p-8">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard/student')}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>

            {gameState === 'playing' && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Target size={20} className="text-purple-600" />
                  <span className="font-bold text-2xl text-purple-600">{score}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={20} className="text-blue-600" />
                  <span className="font-semibold text-blue-600">{formatTime(timeLeft)}</span>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{game.title}</h1>
          <p className="text-gray-600 mt-2">
            {game.type === 'MATCHING' && '🎯 จับคู่คำกับรูปภาพให้ถูกต้อง'}
            {game.type === 'LINKING' && '🔗 โยงคำกับความหมาย'}
            {game.type === 'DRAG_DROP' && '🎯 ลากคำไปวางในตำแหน่งที่ถูกต้อง'}
          </p>
        </motion.div>

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <GameIntro game={game} onStart={startGame} />
          )}

          {gameState === 'playing' && game.type === 'MATCHING' && (
            <MatchingGame
              game={game}
              matches={matches}
              selectedItem={selectedItem}
              onSelect={setSelectedItem}
              onMatch={handleMatch}
              onComplete={handleGameComplete}
            />
          )}

          {gameState === 'playing' && game.type === 'LINKING' && (
            <LinkingGame
              game={game}
              matches={matches}
              onMatch={handleMatch}
              onComplete={handleGameComplete}
            />
          )}

          {gameState === 'playing' && game.type === 'DRAG_DROP' && (
            <DragDropGame
              game={game}
              matches={matches}
              onMatch={handleMatch}
              onComplete={handleGameComplete}
            />
          )}

          {gameState === 'result' && (
            <GameResult
              game={game}
              score={score}
              stars={getStarRating()}
              onReset={resetGame}
              onExit={() => navigate('/dashboard/student')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Game Intro Component
const GameIntro = ({ game, onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-lg p-12 text-center"
    >
      <div className="text-8xl mb-6">🎮</div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <h2 className="text-3xl font-bold text-gray-900">{game.title}</h2>
        <button
          onClick={() => speak(game.title)}
          className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200"
          title="อ่านชื่อเกม"
        >
          <Volume2 size={24} />
        </button>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-semibold text-purple-800">📖 วิธีเล่น:</h3>
          <button
            onClick={() => {
              const instructions = game.type === 'MATCHING'
                ? 'จับคู่คำกับรูปภาพให้ถูกต้อง, คลิกคำ แล้วคลิกรูปภาพที่ตรงกัน'
                : game.type === 'DRAG_DROP'
                  ? 'ลากคำไปวางในกลุ่มที่ถูกต้อง, แยกคำตามประเภทสระ'
                  : 'โยงคำกับความหมายที่ถูกต้อง';
              speak(instructions);
            }}
            className="p-1 bg-purple-200 text-purple-700 rounded-full hover:bg-purple-300"
            title="อ่านวิธีเล่น"
          >
            <Volume2 size={16} />
          </button>
        </div>
        <ul className="text-left space-y-2 text-gray-700">
          {game.type === 'MATCHING' && (
            <>
              <li>✅ จับคู่คำกับรูปภาพให้ถูกต้อง</li>
              <li>✅ คลิกคำ แล้วคลิกรูปภาพที่ตรงกัน</li>
              <li>✅ จับคู่ให้ถูกทั้งหมดให้เร็วที่สุด</li>
            </>
          )}
          {game.type === 'LINKING' && (
            <>
              <li>✅ โยงคำกับความหมายที่ถูกต้อง</li>
              <li>✅ คลิกคำ แล้วคลิกความหมายที่ตรงกัน</li>
              <li>✅ โยงให้ถูกทั้งหมดให้เร็วที่สุด</li>
            </>
          )}
          {game.type === 'DRAG_DROP' && (
            <>
              <li>✅ ลากคำไปวางในกลุ่มที่ถูกต้อง</li>
              <li>✅ แยกคำตามประเภทสระ</li>
              <li>✅ จัดหมวดหมู่ให้ถูกทั้งหมด</li>
            </>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-center gap-6 mb-8">
        <div className="text-center">
          <Clock className="text-blue-500 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">เวลา</p>
          <p className="font-bold text-gray-900">5 นาที</p>
        </div>
        <div className="text-center">
          <Trophy className="text-yellow-500 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">เป้าหมาย</p>
          <p className="font-bold text-gray-900">100 คะแนน</p>
        </div>
        <div className="text-center">
          <Star className="text-purple-500 mx-auto mb-2" size={32} />
          <p className="text-sm text-gray-600">รางวัล</p>
          <p className="font-bold text-gray-900">3 ดาว</p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-full hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
      >
        🎮 เริ่มเล่น
      </button>
    </motion.div>
  );
};

// Matching Game Component
const MatchingGame = ({ game, matches, selectedItem, onSelect, onMatch, onComplete }) => {
  const pairs = game.settings.pairs || [];
  const correctMatches = Object.entries(matches).filter(([key, value]) => key === value).length;

  useEffect(() => {
    if (correctMatches === pairs.length && pairs.length > 0) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [correctMatches, pairs.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">จับคู่ให้ถูกต้อง</h2>
          <button
            onClick={() => speak('จับคู่คำกับรูปภาพให้ถูกต้อง')}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
          >
            <Volume2 size={20} />
          </button>
        </div>
        <p className="text-gray-600">จับคู่แล้ว: {correctMatches} / {pairs.length}</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Words Column */}
        <div className="space-y-4">
          <h3 className="text-center font-semibold text-gray-700 mb-4">📝 คำ</h3>
          {pairs.map((pair, index) => {
            const isMatched = matches[pair.word] !== undefined;
            const isSelected = selectedItem?.word === pair.word;
            const isCorrect = matches[pair.word] === pair.word;

            return (
              <motion.button
                key={index}
                whileHover={{ scale: isMatched ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isMatched && onSelect(pair)}
                disabled={isMatched}
                className={`w-full p-6 rounded-xl text-2xl font-bold transition shadow-md ${isSelected
                  ? 'bg-purple-500 text-white'
                  : isMatched
                    ? isCorrect
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-red-100 text-red-800 border-2 border-red-500'
                    : 'bg-white border-2 border-gray-200 hover:border-purple-500'
                  }`}
              >
                {pair.word}
                {isMatched && isCorrect && <span className="ml-2">✅</span>}
                {isMatched && !isCorrect && <span className="ml-2">❌</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Images Column */}
        <div className="space-y-4">
          <h3 className="text-center font-semibold text-gray-700 mb-4">🖼️ รูปภาพ</h3>
          {pairs.map((pair, index) => {
            const listMatches = Object.entries(matches);
            const matchedKey = listMatches.find(([key, val]) => val === pair.word)?.[0];
            const isMatched = matchedKey !== undefined;
            const isCorrect = matchedKey === pair.word;
            const isImagePath = pair.image && (pair.image.startsWith('/') || pair.image.startsWith('http'));

            return (
              <motion.button
                key={index}
                whileHover={{ scale: isMatched ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectedItem && onMatch(selectedItem, pair)}
                disabled={isMatched}
                className={`w-full p-4 rounded-xl transition shadow-md flex items-center justify-center min-h-[100px] ${isMatched
                  ? isCorrect
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'bg-red-100 border-2 border-red-500'
                  : 'bg-white border-2 border-gray-200 hover:border-purple-500'
                  }`}
              >
                {isImagePath ? (
                  <img
                    src={pair.image}
                    alt={pair.word}
                    className="w-24 h-24 object-contain mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <span className="text-6xl">{pair.emoji || '🖼️'}</span>
                )}
                {/* Fallback emoji if image fails to load or not path */}
                <span className="text-6xl hidden">🖼️</span>

                {isMatched && isCorrect && <span className="text-2xl ml-2">✅</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Linking Game Component
const LinkingGame = ({ game, matches, onMatch, onComplete }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const words = game.settings.words || [];
  const definitions = game.settings.definitions || [];

  const handleWordClick = (word, index) => {
    setSelectedWord({ word, index });
  };

  const handleDefinitionClick = (definition, index) => {
    if (selectedWord) {
      onMatch({ id: selectedWord.index, word: selectedWord.word }, { id: index, word: definition });
      setSelectedWord(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">โยงคำกับความหมาย</h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Words */}
        <div className="space-y-4">
          <h3 className="text-center font-semibold text-gray-700 mb-4">📝 คำ</h3>
          {words.map((word, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWordClick(word, index)}
              className={`w-full p-4 rounded-lg text-xl font-bold transition ${selectedWord?.index === index
                ? 'bg-blue-500 text-white'
                : 'bg-white border-2 border-gray-200 hover:border-blue-500'
                }`}
            >
              {word}
            </motion.button>
          ))}
        </div>

        {/* Definitions */}
        <div className="space-y-4">
          <h3 className="text-center font-semibold text-gray-700 mb-4">💡 ความหมาย</h3>
          {definitions.map((def, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDefinitionClick(def, index)}
              className="w-full p-4 rounded-lg text-lg transition bg-white border-2 border-gray-200 hover:border-blue-500"
            >
              {def}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
        >
          ส่งคำตอบ
        </button>
      </div>
    </motion.div>
  );
};

// Drag Drop Game Component
const DragDropGame = ({ game, matches, onMatch, onComplete }) => {
  const items = game.settings.items || [];
  const zones = game.settings.zones || game.settings.targets || [];

  const handleDragEnd = (event, info, item) => {
    // Robust collision detection using elementsFromPoint
    // Must use native clientX/Y because info.point might be Page-relative (scrolled),
    // which causes "Top -> Below" targeting errors in document.elementsFromPoint
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

    const elements = document.elementsFromPoint(clientX, clientY);

    // Find the dropped zone element
    const zoneElement = elements.find(el => el.id && el.id.toString().startsWith('zone-'));

    if (zoneElement) {
      const zoneId = zoneElement.id.replace('zone-', '');
      // Loose comparison for string vs number ID
      const targetZone = zones.find(z => z.id == zoneId);

      if (targetZone) {
        onMatch(item, targetZone);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">ลากไปวางในกลุ่มที่ถูกต้อง</h2>
          <button
            onClick={() => speak('ลากคำไปวางในกลุ่มที่ถูกต้อง')}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      {/* Zones */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {zones.map((zone) => (
          <div
            key={zone.id}
            id={`zone-${zone.id}`}
            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 min-h-[300px] transition-colors hover:bg-blue-100"
          >
            {/* Display Zone Image if available */}
            {zone.image && (
              <img src={zone.image} alt={zone.label} className="w-24 h-24 object-contain mx-auto mb-2" />
            )}
            <h3 className="text-xl font-bold text-blue-800 text-center mb-4">{zone.label}</h3>
            <div className="space-y-2">
              {items.filter(item => matches[item.id] === zone.id).map((item) => (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={item.id}
                  className="bg-white p-3 rounded-lg border border-blue-200 text-center font-semibold shadow-sm"
                >
                  {item.text || item.word}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">คำที่ต้องจัดหมวดหมู่:</h3>
        <div className="grid grid-cols-4 gap-3 relative z-10">
          {items.filter(item => !matches[item.id]).map((item) => (
            <motion.button
              key={item.id}
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
              whileHover={{ scale: 1.05, cursor: 'grab' }}
              onDragEnd={(e, info) => handleDragEnd(e, info, item)}
              className="p-4 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-500 font-semibold transition shadow-sm touch-none"
            >
              {item.text || item.word}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
        >
          ตรวจคำตอบ
        </button>
      </div>
    </motion.div>
  );
};

// Game Result Component
const GameResult = ({ game, score, stars, onReset, onExit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-lg p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        <Trophy className="text-yellow-500 mx-auto" size={100} />
      </motion.div>

      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        {score >= 80 ? '🎉 ยอดเยี่ยม!' : score >= 60 ? '👍 ดีมาก!' : '💪 พยายามต่อไป!'}
      </h2>

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8 mb-8">
        <p className="text-gray-600 mb-2">คะแนนที่ได้</p>
        <p className="text-6xl font-bold text-purple-600 mb-4">{score}</p>

        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Star
              key={i}
              size={40}
              className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
        >
          <RotateCcw size={20} />
          เล่นอีกครั้ง
        </button>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </motion.div>
  );
};

export default MockGamePage;
