// components/Welcome.jsx
import React, { useState } from 'react';

const Welcome = ({ onGameCodeSubmit }) => {
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Alapvető frontend validáció (a részletes validáció a backend-ben történik)
    if (!gameCode.trim()) {
      setError('Add meg a játék kódot!');
      return;
    }

    onGameCodeSubmit(gameCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-orange-800 to-black text-white flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        <div className="bg-black bg-opacity-60 rounded-lg p-8 shadow-2xl border border-orange-500">
          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-4xl font-bold text-orange-400 mb-2">
              Halloween Kincskereső
            </h1>
            <p className="text-gray-300 text-lg">
              Üdvözöljük a kalandos játékban!
            </p>
          </div>

          {/* Játék kód megadás */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="gameCode" className="block text-lg font-medium mb-3 text-center">
                Add meg a játék kódot:
              </label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-orange-500 focus:border-transparent
                         text-white placeholder-gray-400 text-center text-lg font-mono tracking-widest"
                placeholder="ABC123"
                maxLength={6}
                autoFocus
              />
              <p className="text-sm text-gray-400 text-center mt-2">
                A kódot az admin adta meg
              </p>
            </div>

            {/* Hibaüzenet */}
            {error && (
              <div className="bg-red-600 bg-opacity-80 text-white p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Belépés gomb */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-purple-600 
                       hover:from-orange-500 hover:to-purple-500 
                       text-white font-bold py-4 px-6 rounded-lg 
                       transition-all duration-200 text-lg"
            >
              Csatlakozás a játékhoz! 🎮
            </button>
          </form>

          {/* Admin gomb */}
          <div className="mt-6">
            <button
              onClick={() => onGameCodeSubmit('ADMIN')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 
                       hover:from-green-500 hover:to-blue-500 
                       text-white font-bold py-3 px-6 rounded-lg 
                       transition-all duration-200"
            >
              🛠️ Admin felület
            </button>
          </div>

          {/* Játékszabályok */}
          <div className="mt-8 p-4 bg-gray-900 bg-opacity-50 rounded-lg">
            <h4 className="font-semibold text-orange-300 mb-3 text-center">📋 Játékszabályok:</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• 4 játékos, 2 csapat (2-2 fő)</li>
              <li>• Először külön versenyeztek</li>
              <li>• Majd együtt a közös cél felé</li>
              <li>• QR kódokat kell megtalálni</li>
              <li>• 1 segítség állomásonként</li>
              <li>• 3 hiba után újrakezdés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
