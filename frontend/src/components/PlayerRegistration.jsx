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
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-orange-800 to-black text-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-black bg-opacity-60 rounded-lg p-8 shadow-2xl border border-orange-500">
          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-4xl font-bold text-orange-400 mb-2">
              Csatlakozás a játékhoz
            </h1>
            <p className="text-gray-300 text-lg">
              Játék: <span className="text-orange-400 font-semibold">{gameData.game.name}</span>
            </p>
            <p className="text-gray-400 text-sm">
              Kód: <span className="font-mono text-orange-300">{gameData.game.game_code}</span>
            </p>
          </div>

          {/* Regisztráció form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Név megadás */}
            <div>
              <label htmlFor="playerName" className="block text-lg font-medium mb-3 text-center">
                Add meg a neved:
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-orange-500 focus:border-transparent
                         text-white placeholder-gray-400 text-center text-lg"
                placeholder="Írd be a neved..."
                maxLength={20}
                autoFocus
              />
            </div>

            {/* Csapat választás */}
            <div>
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
                      className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                        selectedTeam === 'pumpkin'
                          ? 'border-orange-500 bg-orange-900 bg-opacity-40'
                          : teamStatus.isFull
                          ? 'border-gray-600 bg-gray-800 bg-opacity-30 opacity-50 cursor-not-allowed'
                          : 'border-orange-600 bg-orange-900 bg-opacity-20 hover:bg-orange-800 hover:bg-opacity-40 cursor-pointer'
                      }`}
                    >
                      <div className="text-4xl mb-3">🎃</div>
                      <div className="font-semibold text-lg">Tök Csapat</div>
                      <div className="text-sm mt-2">
                        {teamStatus.count}/2 játékos
                      </div>
                      {teamStatus.isFull && (
                        <div className="text-sm text-red-300 mt-1">TELE</div>
                      )}
                      {teamStatus.players.length > 0 && (
                        <div className="text-xs text-gray-300 mt-2">
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
                      className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                        selectedTeam === 'ghost'
                          ? 'border-purple-500 bg-purple-900 bg-opacity-40'
                          : teamStatus.isFull
                          ? 'border-gray-600 bg-gray-800 bg-opacity-30 opacity-50 cursor-not-allowed'
                          : 'border-purple-600 bg-purple-900 bg-opacity-20 hover:bg-purple-800 hover:bg-opacity-40 cursor-pointer'
                      }`}
                    >
                      <div className="text-4xl mb-3">👻</div>
                      <div className="font-semibold text-lg">Szellem Csapat</div>
                      <div className="text-sm mt-2">
                        {teamStatus.count}/2 játékos
                      </div>
                      {teamStatus.isFull && (
                        <div className="text-sm text-red-300 mt-1">TELE</div>
                      )}
                      {teamStatus.players.length > 0 && (
                        <div className="text-xs text-gray-300 mt-2">
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
              <div className="bg-red-600 bg-opacity-80 text-white p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Gombok */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-gray-600 hover:bg-gray-500 
                         text-white font-bold py-3 px-6 rounded-lg 
                         transition-all duration-200"
              >
                Vissza
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-purple-600 
                         hover:from-orange-500 hover:to-purple-500 
                         text-white font-bold py-3 px-6 rounded-lg 
                         transition-all duration-200"
              >
                Csatlakozás! 🎮
              </button>
            </div>
          </form>

          {/* Játék állapot */}
          <div className="mt-6 p-4 bg-gray-900 bg-opacity-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Játékosok: {gameData.game_info.total_players}/4
              </p>
              <p className="text-sm text-gray-400">
                Állapot: {gameData.game.status === 'waiting' ? 'Várakozás játékosokra' : 
                         gameData.game.status === 'setup' ? 'Készen áll az indításra' : 
                         gameData.game.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRegistration;
