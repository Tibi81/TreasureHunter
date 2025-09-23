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
    <div className="game-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-8">
        {/* Fehér tartalom blokk */}
        <div className="white-content-block border-4 border-orange-500">
          {/* Cím */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎃👻</div>
            <h1 className="text-4xl font-bold mb-2 text-orange">
              Csatlakozás a játékhoz
            </h1>
            <p className="text-lg text-gray">
              Játék: <span className="text-orange font-semibold">{gameData.game.name}</span>
            </p>
            <p className="text-sm text-gray">
              Kód: <span className="font-mono text-orange">{gameData.game.game_code}</span>
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
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="dark-input text-xl w-48 sm:w-56 md:w-64 box-border"
                  placeholder="Írd be a neved..."
                  maxLength={20}
                  autoFocus
                />
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
                <div className="error-message text-xl w-48 sm:w-56 md:w-64 box-border">
                  {error}
                </div>
              )}

              {/* Gombok */}
              <div className="flex flex-col items-center" style={{ gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn-primary text-xl w-48 sm:w-56 md:w-64 box-border"
                >
                  Csatlakozás! 🎮
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="btn-secondary text-xl w-48 sm:w-56 md:w-64 box-border"
                >
                  Vissza
                </button>
              </div>
            </form>
          </div>

          {/* Játék állapot */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-orange mb-3 text-center">
              📊 Játék állapot:
            </h4>
            <div className="text-sm text-gray space-y-2">
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
