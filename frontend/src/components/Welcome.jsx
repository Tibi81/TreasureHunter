// components/Welcome.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useFindGameByCodeOptimized } from '../hooks/useGameAPI';

const Welcome = ({ onGameCodeSubmit }) => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [shouldSearch, setShouldSearch] = useState(false);

  // React Query hook - csak akkor keressünk, ha a felhasználó megadta a kódot
  const { data: gameData, isLoading, error: gameError } = useFindGameByCodeOptimized(
    gameCode, 
    { enabled: shouldSearch && gameCode.length >= 3 }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!gameCode.trim()) {
      setError('Add meg a játék kódot!');
      return;
    }

    // Ha ADMIN kódot adtak meg, azonnal átirányítjuk
    if (gameCode.trim().toUpperCase() === 'ADMIN') {
      onGameCodeSubmit('ADMIN');
      return;
    }

    // Egyébként keresünk a kóddal
    setShouldSearch(true);
  };

  // Ha sikeresen megtaláltuk a játékot, átirányítjuk
  React.useEffect(() => {
    if (gameData && shouldSearch) {
      onGameCodeSubmit(gameCode.trim().toUpperCase());
      setShouldSearch(false);
    }
  }, [gameData, shouldSearch, gameCode, onGameCodeSubmit]);

  // Ha hiba történt a keresés során
  React.useEffect(() => {
    if (gameError && shouldSearch) {
      setError(gameError.message || 'Nem található játék ezzel a kóddal');
      setShouldSearch(false);
    }
  }, [gameError, shouldSearch]);

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
          <div className="text-center mb-mobile-lg">
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
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Keresés...
                    </span>
                  ) : (
                    'Csatlakozás a játékhoz! 🎮'
                  )}
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
                4 játékos, 2 csapat (2-2 fő)
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

Welcome.propTypes = {
  onGameCodeSubmit: PropTypes.func.isRequired,
};

export default Welcome;