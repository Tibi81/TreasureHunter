// components/Welcome.jsx
import React, { useState } from 'react';

const Welcome = ({ onGameCodeSubmit }) => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!gameCode.trim()) {
      setError('Add meg a játék kódot!');
      return;
    }

    onGameCodeSubmit(gameCode.trim().toUpperCase());
  };

  return (    
    <div className="min-h-screen">
      <div className="max-w-md mx-auto p-8 pt-16">
      
        {/* Fehér tartalom blokk */}
        <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-orange-500/20 relative">
          {/* Admin gomb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => onGameCodeSubmit('ADMIN')}
              className="bg-gradient-to-r from-green-600 to-blue-600 
                        hover:from-green-500 hover:to-blue-500 
                        text-white font-bold py-3 px-6 rounded-xl 
                        transition-all duration-200 text-lg
                        transform hover:scale-105 shadow-md hover:shadow-green-400/40"
            >
              🎛️ Vezérlőpult
            </button>
          </div>

          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              <span className="animate-float">🎃</span>
              <span className="animate-float" style={{ animationDelay: '1.5s' }}>👻</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-400 drop-shadow-glow-orange mb-2 px-8 leading-tight font-spooky">
              <span className="sm:hidden">Halloween<br />Kincskereső</span>
              <span className="hidden sm:inline">Halloween Kincskereső</span>
            </h1>
            <p className="text-lg text-gray-200 font-spooky leading-relaxed">
              Üdvözöljük a kalandos játékban!
            </p>
          </div>

          

        <div className="flex flex-col items-center space-y-4">
          {/* Játék kód megadás */}
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="gameCode" className="block text-xl font-medium mb-4 text-center text-orange-300 font-spooky">
                Add meg a játék kódot:
              </label>
              <div className="flex flex-col items-center space-y-4">
                <input
                  type="text"
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="w-48 sm:w-56 md:w-64 px-4 py-4 bg-gray-800 border-2 border-orange-400 rounded-2xl text-white text-xl text-center placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 font-spooky"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 text-xl w-48 sm:w-56 md:w-64 transform hover:scale-105 shadow-md hover:shadow-orange-400/40 font-spooky"
                >
                  Csatlakozás a játékhoz! 🎮
                </button>
                {error && (
                <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl text-lg w-48 sm:w-56 md:w-64 text-center font-spooky">
                  {error}
                </div>
                )}
              </div>
              <p className="text-sm text-gray-300 text-center mt-3 font-spooky">
                A kódot az admin adta meg
              </p>
              
            </div>
            
          </form>
          </div>

          

          {/* Játékszabályok */}
          <div className="mt-8 p-6 bg-gradient-to-b from-gray-800 to-gray-700 rounded-2xl border-2 border-orange-500/20 shadow-lg">
            <h4 className="font-bold text-orange-400 mb-4 text-center text-xl font-spooky">
              📋 Játékszabályok:
            </h4>
            <ul className="text-gray-200 space-y-3 font-spooky leading-relaxed">
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">🎯</span>
                4 játékos, 2 csapat (2-2 fő)
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">🏃</span>
                Először külön versenyeztek
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">🤝</span>
                Majd együtt a közös cél felé
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">📱</span>
                QR kódokat kell megtalálni
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">🪄</span>
                1 segítség állomásonként
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2">⚠️</span>
                3 hiba után újrakezdés
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;