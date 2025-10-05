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
        <div className="white-content-block border-4 border-orange-500 relative">
          {/* Admin gomb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => onGameCodeSubmit('ADMIN')}
              className="bg-gradient-to-r from-green-600 to-blue-600 
                        hover:from-green-500 hover:to-blue-500 
                        text-white font-bold py-2 px-4 rounded-md 
                        transition-all duration-200 text-lg"
            >
              🎛️ Vezérlőpult
            </button>
          </div>

          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 text-orange-600 px-8 leading-tight">
              <span className="sm:hidden">Halloween<br />Kincskereső</span>
              <span className="hidden sm:inline">Halloween Kincskereső</span>
            </h1>
            <p className="text-lg text-gray-600">
              Üdvözöljük a kalandos játékban!
            </p>
          </div>

          

        <div className="flex flex-col items-center gap-4">
          {/* Játék kód megadás */}
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="gameCode" className="block text-lg font-medium mb-3 text-center">
                Add meg a játék kódot:
              </label>
              <div className="flex flex-col items-center" style={{ gap: '1.5rem' }}>
                <input
                  type="text"
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="w-48 sm:w-56 md:w-64 px-4 py-3 bg-gray-800 border border-orange-300 rounded-xl text-white text-xl text-center placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-xl w-48 sm:w-56 md:w-64"
                >
                  Csatlakozás a játékhoz! 🎮
                </button>
                {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-xl w-48 sm:w-56 md:w-64 text-center">
                  {error}
                </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center mt-2">
                A kódot az admin adta meg
              </p>
              
            </div>
            
          </form>
          </div>

          

          {/* Játékszabályok */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-orange-600 mb-3 text-center">
              📋 Játékszabályok:
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li> 4 játékos, 2 csapat (2-2 fő)</li>
              <li> Először külön versenyeztek</li>
              <li> Majd együtt a közös cél felé</li>
              <li> QR kódokat kell megtalálni</li>
              <li> 1 segítség állomásonként</li>
              <li> 3 hiba után újrakezdés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;