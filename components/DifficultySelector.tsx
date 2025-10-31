
import React from 'react';
import { Difficulty, Language } from '../types.ts';

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

export default DifficultySelector;