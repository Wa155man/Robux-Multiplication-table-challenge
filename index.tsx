import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// ============================================================================
// TYPES (from types.ts)
// ============================================================================
type GameState = 'selecting_difficulty' | 'playing' | 'won';

enum Difficulty {
  Easy = 'Easy',
  Moderate = 'Moderate',
  Hard = 'Hard',
}

enum Language {
  English = 'English',
  Hebrew = 'Hebrew',
  Russian = 'Russian',
}

interface Question {
  num1: number;
  num2: number;
  answer: number;
  options: number[];
}

// ============================================================================
// SERVICES (from services/geminiService.ts)
// ============================================================================
async function generateSpeech(text: string): Promise<string | null> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
}

async function getQuestionSpeech(questionText: string): Promise<string | null> {
  return generateSpeech(`Say: ${questionText}`);
}

async function getComplimentSpeech(compliment: string): Promise<string | null> {
    return generateSpeech(compliment);
}

// ============================================================================
// ICONS (from components/icons.tsx)
// ============================================================================
const RobuxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="url(#paint0_linear_1_2)"/>
    <path d="M12 5L15 9H9L12 5Z" fill="white"/>
    <path d="M12 19L9 15H15L12 19Z" fill="white"/>
    <path d="M5 12L9 15V9L5 12Z" fill="white"/>
    <path d="M19 12L15 9V15L19 12Z" fill="white"/>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24"/>
        <stop offset="1" stopColor="#F59E0B"/>
      </linearGradient>
    </defs>
  </svg>
);

const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
    </svg>
);

// ============================================================================
// VICTORY SCREEN (from components/VictoryScreen.tsx)
// ============================================================================
interface VictoryScreenProps {
  onPlayAgain: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({ onPlayAgain }) => {
  const fireworks = Array.from({ length: 30 });
  const confetti = Array.from({ length: 60 });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-md overflow-hidden">
      
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {fireworks.map((_, i) => (
          <div
            key={`firework-${i}`}
            className="firework"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2.5}s`,
            }}
          />
        ))}
        {confetti.map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: ['#fbbd23', '#ef4444', '#22c55e', '#3b82f6'][Math.floor(Math.random() * 4)],
              animationDuration: `${Math.random() * 3 + 4}s`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative bg-gradient-to-br from-yellow-300 to-amber-500 p-8 md:p-12 m-4 rounded-2xl shadow-2xl text-center text-gray-800 max-w-2xl w-full border-8 border-yellow-500"
           style={{ textShadow: '2px 2px #ffffffaa' }}>
        <div className="flex justify-center mb-6 animate-bounce">
            <RobuxIcon className="w-24 h-24 text-white drop-shadow-lg" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Congratulations!</h1>
        <p className="text-2xl md:text-3xl mb-8">
          You won 1000 Robux! Go to your parents to collect the gift!
        </p>
        <button
          onClick={onPlayAgain}
          className="bg-green-500 text-white text-2xl font-bold py-4 px-10 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          style={{ 
            border: '4px solid black',
            boxShadow: '6px 6px 0px #000000'
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// DIFFICULTY SELECTOR (from components/DifficultySelector.tsx)
// ============================================================================
interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ onSelectDifficulty, selectedLanguage, onSelectLanguage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-black bg-opacity-50 p-8 rounded-2xl shadow-lg backdrop-blur-sm">
      <h1 className="text-3xl md:text-5xl text-white font-bold mb-6 text-center" style={{ textShadow: '4px 4px #000000' }}>
        Choose Your Challenge!
      </h1>

      <div className="mb-8 w-full max-w-4xl">
        <h2 className="text-xl md:text-2xl text-white font-bold mb-4 text-center" style={{ textShadow: '2px 2px #000000' }}>Language</h2>
        <div className="flex justify-center gap-4 flex-wrap">
          {(Object.values(Language) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onSelectLanguage(lang)}
              className={`text-white text-lg font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none ${selectedLanguage === lang ? 'ring-4 ring-yellow-400 scale-105' : 'focus:ring-2 focus:ring-gray-400'}`}
              style={{
                backgroundColor: '#4a5568',
                border: '2px solid black',
                boxShadow: '4px 4px 0px #000000'
              }}
            >
              {lang === Language.Hebrew ? 'עברית' : lang === Language.Russian ? 'Русский' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((key) => (
          <button
            key={key}
            onClick={() => onSelectDifficulty(Difficulty[key])}
            className="text-white text-2xl font-bold py-8 px-6 rounded-lg shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
            style={{
              backgroundColor: key === 'Easy' ? '#22c55e' : key === 'Moderate' ? '#f59e0b' : '#ef4444',
              border: '4px solid black',
              boxShadow: '8px 8px 0px #000000'
            }}
          >
            {Difficulty[key]}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// GAME SCREEN (from components/GameScreen.tsx)
// ============================================================================
interface GameScreenProps {
  difficulty: Difficulty;
  language: Language;
  robuxScore: number;
  setRobuxScore: React.Dispatch<React.SetStateAction<number>>;
  setGameState: (state: 'won') => void;
}

const COMPLIMENTS = ['Good!', 'Excellent!', 'Great job!', 'You are doing well!', 'You are amazing!'];
const HIGH_SCORE_COMPLIMENTS = ["You are almost there!", "Keep up the good work!", "You are going to win soon!", "You are so smart!"];

// Audio Decoding Helpers
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const playAudio = (audioData: string) => {
    if (audioData) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      decodeAudioData(decode(audioData), audioContext).then(audioBuffer => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      });
    }
};

const getPenalty = (score: number): number => {
    if (score >= 930) {
        return 8;
    }
    if (score >= 800) {
        return 5;
    }
    if (score >= 700) {
        return 4;
    }
    return 2; // Default penalty
};

const GameScreen: React.FC<GameScreenProps> = ({ difficulty, language, robuxScore, setRobuxScore, setGameState }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [feedback, setFeedback] = useState<{ incorrectSelection?: number }>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(0);
  const [showIntroMessage, setShowIntroMessage] = useState(true);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [lastQuestion, setLastQuestion] = useState<{ num1: number, num2: number } | null>(null);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroMessage(false);
    }, 4000); // Show for 4 seconds
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    if(robuxScore >= 1000) {
      setGameState('won');
    }
  }, [robuxScore, setGameState]);

  useEffect(() => {
    switch (difficulty) {
      case Difficulty.Easy:
        setDifficultyLevel(0);
        break;
      case Difficulty.Moderate:
        setDifficultyLevel(2);
        break;
      case Difficulty.Hard:
        setDifficultyLevel(5);
        break;
    }
    setCorrectAnswersCount(0);
    setCorrectStreak(0);
    setWrongStreak(0);
  }, [difficulty]);
  
  useEffect(() => {
    if (wrongStreak > 0 && wrongStreak % 3 === 0) { // Every 3 consecutive wrong answers
        setDifficultyLevel(level => Math.max(0, level - 1));
    }
  }, [wrongStreak]);

  const generateQuestion = useCallback(() => {
    let num1: number, num2: number;
    let isRepeated;

    do {
      // Priority 1: High score difficulty override
      if (robuxScore >= 800) {
        const highFactors = [6, 7, 8, 9];
        num1 = highFactors[Math.floor(Math.random() * highFactors.length)];
        num2 = Math.floor(Math.random() * 7) + 6; // Other number is between 6 and 12
        if (Math.random() < 0.5) { // Swap for variety
          [num1, num2] = [num2, num1];
        }
      } 
      // Priority 2: Initial difficulty settings
      else if (difficulty === Difficulty.Hard) {
        // Both multipliers are bigger than 5 (i.e., 6, 7, 8, 9)
        const factors = [6, 7, 8, 9];
        num1 = factors[Math.floor(Math.random() * factors.length)];
        num2 = factors[Math.floor(Math.random() * factors.length)];
      }
      else if (difficulty === Difficulty.Moderate) {
        // One multiplier is from 4, 5, 6, 7
        const factors = [4, 5, 6, 7];
        num1 = factors[Math.floor(Math.random() * factors.length)];
        num2 = Math.floor(Math.random() * 10) + 1; 
        if (Math.random() < 0.5) { // Swap for variety
          [num1, num2] = [num2, num1];
        }
      }
      // Priority 3: Default dynamic difficulty for Easy and progression
      else if (difficulty === Difficulty.Easy && correctAnswersCount < 30) {
          const factor1 = Math.random() < 0.5 ? 2 : 3;
          const factor2 = Math.floor(Math.random() * 10) + 1;
          if (Math.random() > 0.5) {
              num1 = factor1;
              num2 = factor2;
          } else {
              num1 = factor2;
              num2 = factor1;
          }
      } else {
          // Fallback / standard dynamic difficulty progression
          let baseMaxNum = difficulty === Difficulty.Easy ? 4 : (difficulty === Difficulty.Moderate ? 7 : 10);
          const streakBonus = Math.floor(correctStreak / 3);
          const robuxBonus = robuxScore >= 500 ? 2 : 0;
          const effectiveLevel = difficultyLevel + streakBonus + robuxBonus;
          const maxNum1 = baseMaxNum + effectiveLevel;
          const maxNum2 = baseMaxNum + Math.max(0, effectiveLevel - 2);
          num1 = Math.floor(Math.random() * maxNum1) + 1;
          num2 = Math.floor(Math.random() * maxNum2) + 1;
          if (num1 === 1 && num2 === 1) {
              num2 = Math.floor(Math.random() * 9) + 2;
          }
      }
      isRepeated = lastQuestion && ((num1 === lastQuestion.num1 && num2 === lastQuestion.num2) || (num1 === lastQuestion.num2 && num2 === lastQuestion.num1));
    } while (isRepeated);
    
    setLastQuestion({ num1, num2 });

    const answer = num1 * num2;
    const options: Set<number> = new Set([answer]);
    while (options.size < 4) {
      const wrongAnswerOffset = Math.floor(Math.random() * 10) - 5;
      const wrongAnswerMultiplier = Math.random() > 0.5 ? num1 : num2;
      let wrongAnswer = answer + wrongAnswerOffset * wrongAnswerMultiplier;
      if(wrongAnswer === answer || wrongAnswer <= 0){
        wrongAnswer = answer + (options.size * (Math.random() > 0.5 ? 1 : -1) * (Math.ceil(Math.random()*3) + 1));
        if (wrongAnswer <= 0 || wrongAnswer === answer) wrongAnswer = answer + options.size + 1;
      }
      options.add(wrongAnswer);
    }
    const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);
    
    let questionText: string;
    switch (language) {
      case Language.Hebrew:
        questionText = `${num1} כפול ${num2}`;
        break;
      case Language.Russian:
        questionText = `${num1} умножить на ${num2}`;
        break;
      case Language.English:
      default:
        questionText = `${num1} times ${num2}`;
        break;
    }
    
    // Update the UI immediately
    setCurrentQuestion({ num1, num2, answer, options: shuffledOptions });
    setIsAnswered(false);
    setFeedback({});

    // Fetch and play audio in the background
    getQuestionSpeech(questionText).then(audioData => {
        if (audioData) {
            playAudio(audioData);
        }
    });

  }, [difficulty, language, correctAnswersCount, correctStreak, robuxScore, difficultyLevel, lastQuestion]);
  
  useEffect(() => {
    if (!showIntroMessage && isInitialLoad.current) {
        isInitialLoad.current = false;
        generateQuestion();
    }
  }, [showIntroMessage, generateQuestion]);

  const handleAnswer = useCallback((selectedOption: number) => {
    if (isAnswered) return;

    setIsAnswered(true);

    if (selectedOption === currentQuestion?.answer) {
      setRobuxScore(score => score + 5);
      setCorrectStreak(streak => streak + 1);
      setCorrectAnswersCount(count => count + 1);
      setWrongStreak(0);
      setFeedback({});
      const complimentArray = robuxScore >= 950 ? HIGH_SCORE_COMPLIMENTS : COMPLIMENTS;
      const randomCompliment = complimentArray[Math.floor(Math.random() * complimentArray.length)];
      getComplimentSpeech(randomCompliment).then(playAudio);
    } else {
      const penalty = getPenalty(robuxScore);
      setRobuxScore(score => Math.max(0, score - penalty));
      setCorrectStreak(0);
      setWrongStreak(streak => streak + 1);
      setFeedback({ incorrectSelection: selectedOption });
    }
    
    setTimeout(() => {
      generateQuestion();
    }, 1250);
  }, [isAnswered, currentQuestion, setRobuxScore, generateQuestion, robuxScore]);

  const handleTypedAnswerSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !typedAnswer.trim()) return;
    
    setIsAnswered(true);
    const userAnswer = parseInt(typedAnswer, 10);

    if (userAnswer === currentQuestion?.answer) {
        setRobuxScore(score => score + 5);
        setCorrectStreak(streak => streak + 1);
        setCorrectAnswersCount(count => count + 1);
        setWrongStreak(0);
        setFeedback({});
        const complimentArray = robuxScore >= 950 ? HIGH_SCORE_COMPLIMENTS : COMPLIMENTS;
        const randomCompliment = complimentArray[Math.floor(Math.random() * complimentArray.length)];
        getComplimentSpeech(randomCompliment).then(playAudio);
    } else {
        const penalty = getPenalty(robuxScore);
        setRobuxScore(score => Math.max(0, score - penalty));
        setCorrectStreak(0);
        setWrongStreak(streak => streak + 1);
        setFeedback({ incorrectSelection: userAnswer });
    }

    setTimeout(() => {
        setTypedAnswer('');
        generateQuestion();
    }, 1250);
  }, [isAnswered, typedAnswer, currentQuestion, setRobuxScore, generateQuestion, robuxScore]);


  if (showIntroMessage) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h2 className="text-4xl md:text-5xl text-white font-bold p-8 rounded-lg bg-black bg-opacity-60" style={{ textShadow: '4px 4px #000' }}>
                You can collect and win 1000 Robux in this game - Good luck!
            </h2>
        </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-white text-4xl">Loading...</div>;
  }

  const getButtonClass = (option: number) => {
    if (!isAnswered) {
      return 'bg-blue-600 hover:bg-blue-700';
    }
    if (option === currentQuestion?.answer) {
      return 'bg-green-500 animate-pulse';
    }
    if (option === feedback.incorrectSelection) {
      return 'bg-red-500';
    }
    return 'bg-blue-600 opacity-50';
  };
  
  const isTypedAnswerCorrect = isAnswered && parseInt(typedAnswer, 10) === currentQuestion?.answer;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4">
      <div className="text-black text-6xl md:text-8xl font-bold mb-12 md:mb-20" style={{ textShadow: '3px 3px 4px rgba(255,255,255,0.7)' }}>
        {currentQuestion.num1} x {currentQuestion.num2}
      </div>

      {robuxScore < 900 ? (
          <div className="grid grid-cols-2 gap-4 md:gap-8 w-full">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={`text-white text-4xl md:text-6xl font-bold py-10 md:py-16 rounded-2xl shadow-xl transition-all duration-300 ${getButtonClass(option)} disabled:cursor-not-allowed`}
                style={{ 
                  border: '6px solid black',
                  boxShadow: '10px 10px 0px #000000'
                }}
              >
                {option}
              </button>
            ))}
          </div>
      ) : (
        <form onSubmit={handleTypedAnswerSubmit} className="flex flex-col items-center gap-6 w-full">
            <input
                type="number"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={isAnswered}
                className={`text-black text-4xl md:text-6xl text-center font-bold p-4 rounded-2xl w-full max-w-xs transition-colors duration-300 ${
                    isAnswered ? (isTypedAnswerCorrect ? 'bg-green-200' : 'bg-red-200') : 'bg-white'
                }`}
                style={{ 
                    border: `6px solid ${isAnswered ? (isTypedAnswerCorrect ? '#22c55e' : '#ef4444') : 'black'}`,
                    boxShadow: 'inset 5px 5px 10px #00000040'
                }}
                autoFocus
            />
            <button
                type="submit"
                disabled={isAnswered || !typedAnswer.trim()}
                className="text-white text-3xl md:text-4xl font-bold py-4 px-10 rounded-2xl shadow-xl bg-green-600 hover:bg-green-700 transition-all duration-300 disabled:cursor-not-allowed disabled:bg-gray-500"
                style={{ 
                    border: '6px solid black',
                    boxShadow: '10px 10px 0px #000000'
                }}
            >
                Submit
            </button>

            {isAnswered && !isTypedAnswerCorrect && (
                <div className="mt-4 text-3xl font-bold text-center" style={{ textShadow: '2px 2px 4px #000' }}>
                    Correct answer: <span className="text-green-400 animate-pulse">{currentQuestion?.answer}</span>
                </div>
            )}
        </form>
      )}
    </div>
  );
};


// ============================================================================
// APP COMPONENT (from App.tsx)
// ============================================================================
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('selecting_difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [robuxScore, setRobuxScore] = useState<number>(0);
  const [language, setLanguage] = useState<Language>(Language.English);

  const handleSelectDifficulty = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState('playing');
  };
  
  const handleReset = () => {
    setRobuxScore(0);
    setGameState('selecting_difficulty');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'selecting_difficulty':
        return <DifficultySelector 
                  onSelectDifficulty={handleSelectDifficulty} 
                  selectedLanguage={language}
                  onSelectLanguage={setLanguage}
                />;
      case 'playing':
        return <GameScreen 
                  difficulty={difficulty} 
                  language={language}
                  robuxScore={robuxScore} 
                  setRobuxScore={setRobuxScore}
                  setGameState={setGameState}
                />;
      case 'won':
        return <VictoryScreen onPlayAgain={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <main 
      className="bg-cover bg-center h-screen w-screen text-white flex flex-col items-center justify-center p-4 overflow-hidden" 
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614728263952-84ea256ec346?q=80&w=1920&h=1080&auto=format&fit=crop')" }}
    >
      {gameState !== 'won' && (
        <div className="absolute top-4 right-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-black bg-opacity-60 p-2 px-4 rounded-full text-xl md:text-2xl" style={{ border: '2px solid white' }}>
            <RobuxIcon className="w-8 h-8"/>
            <span>{robuxScore}</span>
          </div>
          <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-transform transform hover:scale-110" style={{ border: '2px solid white' }}>
            <ResetIcon className="w-6 h-6"/>
          </button>
        </div>
      )}
      
      <div className="w-full h-full flex items-center justify-center">
        {renderGameState()}
      </div>
      
    </main>
  );
};


// ============================================================================
// RENDER (original index.tsx)
// ============================================================================
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);