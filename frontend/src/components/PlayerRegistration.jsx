// components/PlayerRegistration.jsx
import React, { useState } from 'react';

const PlayerRegistration = ({ gameData, onJoinGame, onBack }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Alapvető frontend validáció (a részletes validáció a backend-ben történik)
    if (!playerName.trim()) {
      setError('Add meg a neved!');
      return;
    }

    if (!selectedTeam) {
      setError('Válassz egy csapatot!');
      return;
    }

    onJoinGame(gameData.game.id, playerName.trim(), selectedTeam);
  };

  const getTeamStatus = (teamName) => {
    const team = gameData.teams.find(t => t.name === teamName);
    const playerCount = team ? team.players.length : 0;
    return {
      count: playerCount,
      isFull: playerCount >= 2,
      players: team ? team.players : []
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-orange-800 to-black flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        {/* Fehér tartalom blokk */}
        <div className="white-content-block border-4 border-orange-500">
          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-4xl font-bold mb-2 text-orange-600">
              Csatlakozás a játékhoz
            </h1>
            <p className="text-lg text-gray-600">
              Játék: <span className="text-orange-600 font-semibold">{gameData.game.name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Kód: <span className="font-mono text-orange-600">{gameData.game.game_code}</span>
            </p>
          </div>

        <div className="flex flex-col items-center gap-4">
          {/* Regisztráció form */}
          <form onSubmit={handleSubmit}>
            {/* Név megadás */}
              <div className="mb-6">
                <label htmlFor="playerName" className="block text-lg font-medium mb-3 text-center">
                  Add meg a neved:
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-48 sm:w-56 md:w-64 px-4 py-3 bg-gray-800 border border-orange-300 rounded-xl text-white text-xl text-center placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Írd be a neved..."
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </div>

              {/* Csapat választás */}
              <div className="mb-6">
                <label className="block text-lg font-medium mb-4 text-center">
                  Válassz egy csapatot:
                </label>
                <div className="grid grid-cols-2 gap-4">
                {/* Tök Csapat */}
                {(() => {
                  const teamStatus = getTeamStatus('pumpkin');
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTeam('pumpkin')}
                      disabled={teamStatus.isFull}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTeam === 'pumpkin'
                          ? 'border-orange-500 bg-orange-100'
                          : teamStatus.isFull
                          ? 'border-gray-400 bg-gray-100 opacity-50 cursor-not-allowed'
                          : 'border-orange-300 bg-orange-50 hover:bg-orange-100 cursor-pointer'
                      }`}
                    >
                      <div className="text-4xl mb-3">🎃</div>
                      <div className="font-semibold text-lg text-gray-800">Tök Csapat</div>
                      <div className="text-sm mt-2 text-gray-600">
                        {teamStatus.count}/2 játékos
                      </div>
                      {teamStatus.isFull && (
                        <div className="text-sm text-red-600 mt-1">TELE</div>
                      )}
                      {teamStatus.players.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          {teamStatus.players.map(p => p.name).join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })()}

                {/* Szellem Csapat */}
                {(() => {
                  const teamStatus = getTeamStatus('ghost');
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTeam('ghost')}
                      disabled={teamStatus.isFull}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedTeam === 'ghost'
                          ? 'border-purple-500 bg-purple-100'
                          : teamStatus.isFull
                          ? 'border-gray-400 bg-gray-100 opacity-50 cursor-not-allowed'
                          : 'border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                      }`}
                    >
                      <div className="text-4xl mb-3">👻</div>
                      <div className="font-semibold text-lg text-gray-800">Szellem Csapat</div>
                      <div className="text-sm mt-2 text-gray-600">
                        {teamStatus.count}/2 játékos
                      </div>
                      {teamStatus.isFull && (
                        <div className="text-sm text-red-600 mt-1">TELE</div>
                      )}
                      {teamStatus.players.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          {teamStatus.players.map(p => p.name).join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>

              {/* Hibaüzenet */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-xl w-48 sm:w-56 md:w-64 text-center">
                  {error}
                </div>
              )}

              {/* Gombok */}
              <div className="flex flex-col items-center" style={{ gap: '1rem' }}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-xl w-48 sm:w-56 md:w-64"
                >
                  Csatlakozás! 🎮
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-xl w-48 sm:w-56 md:w-64"
                >
                  Vissza
                </button>
              </div>
            </form>
          </div>

          {/* Játék állapot */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-orange-600 mb-3 text-center">
              📊 Játék állapot:
            </h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Játékosok: {gameData.game_info.total_players}/4</p>
              <p>Állapot: {gameData.game.status === 'waiting' ? 'Várakozás játékosokra' : 
                         gameData.game.status === 'setup' ? 'Készen áll az indításra' : 
                         gameData.game.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;
