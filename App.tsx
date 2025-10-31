import React, { useState } from 'react';
import { GameState, Difficulty, Language } from './types';
import DifficultySelector from './components/DifficultySelector';
import GameScreen from './components/GameScreen';
import VictoryScreen from './components/VictoryScreen';
import { RobuxIcon, ResetIcon } from './components/icons';

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

export default App;