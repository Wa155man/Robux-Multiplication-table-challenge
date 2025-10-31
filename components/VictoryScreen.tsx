import React from 'react';
import { RobuxIcon } from './icons';

interface VictoryScreenProps {
  onPlayAgain: () => void;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({ onPlayAgain }) => {
  const fireworks = Array.from({ length: 30 });
  const confetti = Array.from({ length: 60 });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-md overflow-hidden">
      
      {/* Effects Container */}
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

export default VictoryScreen;