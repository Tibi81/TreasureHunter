// components/PlayerJoin.js
import React, { useState } from 'react';

const PlayerJoin = ({ onJoin, loading, error, teams = [] }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [nameError, setNameError] = useState('');

  // Csapatok játékosszáma
  const getTeamPlayerCount = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    return team ? team.players.length : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNameError('');

    // Validációk
    if (!playerName.trim()) {
      setNameError('Add meg a neved!');
      return;
    }

    if (playerName.trim().length < 2) {
      setNameError('A névnek legalább 2 karakter hosszúnak kell lennie!');
      return;
    }

    if (!selectedTeam) {
      setNameError('Válassz csapatot!');
      return;
    }

    // Ellenőrizzük, hogy a csapat nem tele-e
    if (getTeamPlayerCount(selectedTeam) >= 2) {
      setNameError('Ez a csapat már tele van!');
      return;
    }

    onJoin(playerName.trim(), selectedTeam);
  };

  const isTeamFull = (teamName) => getTeamPlayerCount(teamName) >= 2;

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-black bg-opacity-60 rounded-lg p-6 shadow-2xl border border-orange-500">
        <h2 className="text-2xl font-bold text-center mb-6 text-orange-400">
          Csatlakozás a játékhoz
        </h2>

        {/* Jelenlegi játékosok megjelenítése */}
        {teams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-purple-300">
              Jelenlegi játékosok:
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.name} className="text-center">
                  <div className={`p-3 rounded-lg border-2 ${
                    team.name === 'pumpkin' 
                      ? 'border-orange-500 bg-orange-900 bg-opacity-30' 
                      : 'border-purple-500 bg-purple-900 bg-opacity-30'
                  }`}>
                    <div className="text-2xl mb-2">
                      {team.name === 'pumpkin' ? '🎃' : '👻'}
                    </div>
                    <div className="font-semibold text-sm">
                      {team.display_name}
                    </div>
                    <div className="text-xs mt-1">
                      ({team.players.length}/2 játékos)
                    </div>
                    <div className="mt-2">
                      {team.players.map((player, index) => (
                        <div key={index} className="text-xs text-gray-300">
                          {player.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Név input */}
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium mb-2">
              A te neved:
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       text-white placeholder-gray-400"
              placeholder="Írd be a neved..."
              maxLength={20}
              disabled={loading}
            />
          </div>

          {/* Csapat választás */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Válassz csapatot:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedTeam('pumpkin')}
                disabled={loading || isTeamFull('pumpkin')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedTeam === 'pumpkin'
                    ? 'border-orange-400 bg-orange-600 bg-opacity-50 scale-105'
                    : 'border-orange-600 bg-orange-900 bg-opacity-20 hover:bg-orange-800 hover:bg-opacity-40'
                } ${isTeamFull('pumpkin') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:hover:bg-orange-900 disabled:hover:bg-opacity-20 disabled:scale-100`}
              >
                <div className="text-3xl mb-2">🎃</div>
                <div className="font-semibold">Tök Csapat</div>
                <div className="text-xs mt-1">
                  {getTeamPlayerCount('pumpkin')}/2 játékos
                </div>
                {isTeamFull('pumpkin') && (
                  <div className="text-xs text-red-300 mt-1">TELE</div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeam('ghost')}
                disabled={loading || isTeamFull('ghost')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedTeam === 'ghost'
                    ? 'border-purple-400 bg-purple-600 bg-opacity-50 scale-105'
                    : 'border-purple-600 bg-purple-900 bg-opacity-20 hover:bg-purple-800 hover:bg-opacity-40'
                } ${isTeamFull('ghost') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:hover:bg-purple-900 disabled:hover:bg-opacity-20 disabled:scale-100`}
              >
                <div className="text-3xl mb-2">👻</div>
                <div className="font-semibold">Szellem Csapat</div>
                <div className="text-xs mt-1">
                  {getTeamPlayerCount('ghost')}/2 játékos
                </div>
                {isTeamFull('ghost') && (
                  <div className="text-xs text-red-300 mt-1">TELE</div>
                )}
              </button>
            </div>
          </div>

          {/* Hibaüzenet */}
          {(nameError || error) && (
            <div className="bg-red-600 bg-opacity-80 text-white p-3 rounded-lg text-sm text-center">
              {nameError || error}
            </div>
          )}

          {/* Csatlakozás gomb */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-purple-600 
                     hover:from-orange-500 hover:to-purple-500 
                     disabled:from-gray-600 disabled:to-gray-600
                     text-white font-bold py-3 px-4 rounded-lg 
                     transition-all duration-200 
                     disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Csatlakozás...
              </span>
            ) : (
              'Csatlakozás a játékhoz! 🎮'
            )}
          </button>
        </form>

        {/* Játékszabályok */}
        <div className="mt-6 p-4 bg-gray-900 bg-opacity-50 rounded-lg">
          <h4 className="font-semibold text-orange-300 mb-2">📋 Játékszabályok:</h4>
          <ul className="text-xs text-gray-300 space-y-1">
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
  );
};

export default PlayerJoin;