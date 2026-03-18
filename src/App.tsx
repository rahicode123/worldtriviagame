import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Home, RotateCcw, Globe, CheckCircle2, XCircle, Languages } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getQuestionsForLevel, Question, Language } from './data/questions';
import { TRANSLATIONS } from './data/translations';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sound utilities
const playSound = (type: 'correct' | 'wrong' | 'win') => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'correct') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'win') {
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  }
};

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('trivia_lang');
    return (saved as Language) || 'en';
  });
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('trivia_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [totalCorrect, setTotalCorrect] = useState(() => {
    const saved = localStorage.getItem('trivia_total_correct');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameState, setGameState] = useState<'home' | 'quiz' | 'result'>('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentLevelQuestions, setCurrentLevelQuestions] = useState<Question[]>([]);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    localStorage.setItem('trivia_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('trivia_level', level.toString());
  }, [level]);

  useEffect(() => {
    localStorage.setItem('trivia_total_correct', totalCorrect.toString());
  }, [totalCorrect]);

  const handleStartGame = () => {
    const questions = getQuestionsForLevel(level);
    setCurrentLevelQuestions(questions);
    setGameState('quiz');
    setCurrentQuestionIndex(0);
    setSessionScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentLevelQuestions[currentQuestionIndex].correctIndex;
    if (isCorrect) {
      setSessionScore(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      playSound('correct');
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (currentQuestionIndex < currentLevelQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setGameState('result');
        if (sessionScore + (isCorrect ? 1 : 0) === 10) {
          playSound('win');
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }, 1500);
  };

  const handleNextLevel = () => {
    if (sessionScore === 10) {
      setLevel(prev => (prev < 1000 ? prev + 1 : 1));
    }
    setGameState('home');
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Globe className="text-blue-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">{t.title}</h1>
        </div>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
        >
          <Languages className="w-4 h-4" />
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {gameState === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12"
            >
              <div className="relative inline-block">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="w-48 h-48 rounded-full border-8 border-emerald-500/20 flex flex-col items-center justify-center bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                >
                  <span className="text-xs uppercase tracking-widest text-emerald-500/70 font-bold mb-1">{t.level}</span>
                  <span className="text-6xl font-black text-emerald-400">{level}</span>
                </motion.div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white/90">{t.title}</h2>
                <p className="text-blue-200/60 max-w-sm mx-auto leading-relaxed">
                  {language === 'en' 
                    ? 'Test your knowledge across science, geography, technology, and more. Complete all 10 questions correctly to advance!'
                    : 'বিজ্ঞান, ভূগোল, প্রযুক্তি এবং আরও অনেক কিছুতে আপনার জ্ঞান পরীক্ষা করুন। এগিয়ে যেতে ১০টি প্রশ্নের সবকটির সঠিক উত্তর দিন!'}
                </p>
                <button
                  onClick={handleStartGame}
                  className="group relative px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10">{t.start}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl space-y-8"
            >
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{t.level} {level}</p>
                    <p className="text-sm font-bold text-blue-400">{currentQuestionIndex + 1} / 10</p>
                  </div>
                </div>
                <button
                  onClick={() => setGameState('home')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
                >
                  <Home className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="min-h-[120px] flex items-center justify-center text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                    {currentLevelQuestions[currentQuestionIndex].question[language]}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentLevelQuestions[currentQuestionIndex].options[language].map((option, idx) => {
                    const isCorrect = idx === currentLevelQuestions[currentQuestionIndex].correctIndex;
                    const isSelected = selectedOption === idx;
                    
                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(idx)}
                        className={cn(
                          "w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 font-medium text-lg flex justify-between items-center group",
                          !isAnswered && "bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50",
                          isAnswered && isCorrect && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
                          isAnswered && isSelected && !isCorrect && "bg-rose-500/20 border-rose-500 text-rose-400",
                          isAnswered && !isSelected && !isCorrect && "opacity-40 border-white/5"
                        )}
                      >
                        <span>{option}</span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / 10) * 100}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              </div>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 max-w-md w-full"
            >
              <div className="space-y-4">
                <div className="text-8xl mb-6">
                  {sessionScore === 10 ? '🎉' : '😔'}
                </div>
                <h2 className="text-4xl font-black">
                  {sessionScore === 10 ? t.levelComplete : t.score}
                </h2>
                <div className="text-6xl font-black text-blue-400">
                  {sessionScore} <span className="text-2xl text-white/20">/ 10</span>
                </div>
                <p className="text-blue-200/60 font-medium">
                  {sessionScore === 10 ? t.congrats : t.levelFailed}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleNextLevel}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95",
                    sessionScore === 10 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  {sessionScore === 10 ? (level < 1000 ? t.next : t.restart) : t.tryAgain}
                </button>
                {sessionScore < 10 && (
                  <button
                    onClick={() => setGameState('home')}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
                  >
                    {t.backToHome}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />
    </div>
  );
}
