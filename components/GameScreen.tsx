import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, Question, Language } from '../types';
import { getQuestionSpeech, getComplimentSpeech } from '../services/geminiService';

interface GameScreenProps {
  difficulty: Difficulty;
  language: Language;
  robuxScore: number;
  setRobuxScore: React.Dispatch<React.SetStateAction<number>>;
  setGameState: (state: 'won') => void;
}

const COMPLIMENTS = ['Good!', 'Excellent!', 'Great job!', 'You are doing well!', 'You are amazing!'];

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
      const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
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
        const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
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

export default GameScreen;