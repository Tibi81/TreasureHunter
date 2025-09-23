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
    
    <div className="game-background flex items-center justify-center">
    
      <div className="max-w-md mx-auto p-8">
      
        {/* Fehér tartalom blokk */}
        <div className="white-content-block border-4 border-orange-500">
          {/* Admin gomb */}
          <div className="mt-6">
            <button
              onClick={() => onGameCodeSubmit('ADMIN')}
              className="btn-secondary text-xl w-48 sm:w-56 md:w-64 box-border"
            >
              🛠️ Játék beállítások
            </button>
          </div>
          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-4xl font-bold mb-2 text-orange">
              Halloween Kincskereső
            </h1>
            <p className="text-lg text-gray">
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
                  className="dark-input text-xl w-48 sm:w-56 md:w-64 box-border"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary text-xl w-48 sm:w-56 md:w-64 box-border"
                >
                  Csatlakozás a játékhoz! 🎮
                </button>
                {error && (
                <div className="error-message text-xl w-48 sm:w-56 md:w-64 box-border">
                  {error}
                </div>
                )}
              </div>
              <p className="text-sm text-gray text-center mt-2">
                A kódot az admin adta meg
              </p>
              
            </div>
            
          </form>
          </div>

          

          {/* Játékszabályok */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-orange mb-3 text-center">
              📋 Játékszabályok:
            </h4>
            <ul className="text-sm text-gray space-y-2">
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