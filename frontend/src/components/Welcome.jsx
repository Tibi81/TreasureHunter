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
    <div className="min-h-screen container-mobile">
      <div className="max-w-md mx-auto pt-4">
      
        {/* Fehér tartalom blokk */}
        <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile border border-orange-500/20 relative">
          {/* Admin gomb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => onGameCodeSubmit('ADMIN')}
              className="btn-admin"
            >
              🎛️ Vezérlőpult
            </button>
          </div>

          {/* Cím */}
          <div className="text-center mb-mobile-lg mt-8">
            <div className="text-4xl sm:text-6xl mb-4">
              <span className="animate-float">🎃</span>
              <span className="animate-float" style={{ animationDelay: '1.5s' }}>👻</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-400 drop-shadow-glow-orange mb-2 px-4 sm:px-8 leading-tight font-spooky">
              <span className="sm:hidden">Halloween<br />Kincskereső</span>
              <span className="hidden sm:inline">Halloween Kincskereső</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-200 font-spooky leading-relaxed">
              Üdvözöljük a kalandos játékban!
            </p>
          </div>

          

        <div className="form-container">
          {/* Játék kód megadás */}
          <form onSubmit={handleSubmit} className="form-container">
            <div>
              <label htmlFor="gameCode" className="block text-lg sm:text-xl font-medium mb-mobile text-center text-orange-300 font-spooky">
                Add meg a játék kódot:
              </label>
              <div className="form-container">
                <input
                  type="text"
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="input-primary text-center"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Csatlakozás a játékhoz! 🎮
                </button>
                {error && (
                <div className="error-message text-center">
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
          <div className="mt-mobile-lg p-mobile bg-gradient-to-b from-gray-800 to-gray-700 rounded-2xl border-2 border-orange-500/20 shadow-lg">
            <h4 className="font-bold text-orange-400 mb-mobile text-center text-lg sm:text-xl font-spooky">
              📋 Játékszabályok:
            </h4>
            <ul className="text-gray-200 space-y-2 sm:space-y-3 font-spooky leading-relaxed text-sm sm:text-base">
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">🎯</span>
                1 vagy 2 csapat (1-8 fő)
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">🏃</span>
                Először külön versenyeztek
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">🤝</span>
                Majd együtt a közös cél felé
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">📱</span>
                QR kódokat kell megtalálni
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">🪄</span>
                1 segítség állomásonként
              </li>
              <li className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">⚠️</span>
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