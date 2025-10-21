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
    const maxPlayers = team ? team.max_players : 2;
    return {
      count: playerCount,
      isFull: playerCount >= maxPlayers,
      maxPlayers: maxPlayers,
      players: team ? team.players : []
    };
  };

  const getAvailableTeams = () => {
    // Mindig a játékban lévő csapatokat mutatjuk
    // 1 csapatos játék esetén csak egy csapat lesz, 2 csapatos játék esetén két csapat
    return gameData.teams.map(team => {
      // Csapat megjelenítési név és ikon meghatározása
      let displayName, icon;
      switch (team.name) {
        case 'pumpkin':
          displayName = 'Tök Csapat';
          icon = '🎃';
          break;
        case 'ghost':
          displayName = 'Szellem Csapat';
          icon = '👻';
          break;
        default:
          displayName = team.display_name || team.name;
          icon = '🎯';
      }
      
      return {
        name: team.name,
        displayName: displayName,
        icon: icon
      };
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center container-mobile">
      <div className="max-w-md mx-auto w-full">
        {/* Fehér tartalom blokk */}
        <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile border border-orange-500/20">
          {/* Cím */}
          <div className="text-center mb-mobile-lg">
            <div className="text-4xl sm:text-6xl mb-4">
              <span className="animate-float">🎃</span>
              <span className="animate-float" style={{ animationDelay: '1.5s' }}>👻</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-400 drop-shadow-glow-orange mb-2 font-spooky">
              Csatlakozás a játékhoz
            </h1>
            <p className="text-base sm:text-lg text-gray-200 font-spooky leading-relaxed">
              Játék: <span className="text-orange-400 font-semibold">{gameData.game.name}</span>
            </p>
            <p className="text-sm text-gray-300 font-spooky">
              Kód: <span className="font-mono text-orange-400">{gameData.game.game_code}</span>
            </p>
            <p className="text-sm text-gray-300 font-spooky">
              Játékosok: <span className="text-orange-400 font-semibold">
                {gameData.game_info?.total_players || 0}/{gameData.game_info?.max_players || gameData.game?.max_players || 4}
              </span>
            </p>
          </div>

        <div className="form-container">
          {/* Regisztráció form */}
          <form onSubmit={handleSubmit} className="form-container">
            {/* Név megadás */}
              <div className="mb-mobile">
                <label htmlFor="playerName" className="block text-lg sm:text-xl font-medium mb-mobile text-center text-orange-300 font-spooky">
                  Add meg a neved:
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="input-primary text-center"
                  placeholder="Írd be a neved..."
                  maxLength={20}
                  autoFocus
                />
              </div>

              {/* Csapat választás */}
              <div className="mb-mobile">
                <label className="block text-lg sm:text-xl font-medium mb-mobile text-center text-orange-300 font-spooky">
                  Válassz egy csapatot:
                </label>
                <div className={`grid-mobile ${getAvailableTeams().length === 1 ? 'grid-mobile-1' : 'grid-mobile-2'}`}>
                  {getAvailableTeams().map(team => {
                    const teamStatus = getTeamStatus(team.name);
                    return (
                      <button
                        key={team.name}
                        type="button"
                        onClick={() => setSelectedTeam(team.name)}
                        disabled={teamStatus.isFull}
                        className={`p-mobile rounded-2xl border-2 transition-all duration-200 transform hover:scale-105 ${
                          selectedTeam === team.name
                            ? 'border-orange-400 bg-gradient-to-b from-orange-500/20 to-orange-600/20 shadow-lg shadow-orange-400/40'
                            : teamStatus.isFull
                            ? 'border-gray-500 bg-gray-700 opacity-50 cursor-not-allowed'
                            : 'border-orange-400/50 bg-gradient-to-b from-gray-800 to-gray-700 hover:from-orange-500/10 hover:to-orange-600/10 cursor-pointer hover:shadow-lg hover:shadow-orange-400/20'
                        }`}
                      >
                        <div className="text-3xl sm:text-4xl mb-3 animate-float">{team.icon}</div>
                        <div className="font-bold text-base sm:text-lg text-orange-300 font-spooky">{team.displayName}</div>
                        <div className="text-sm mt-2 text-gray-300 font-spooky">
                          {teamStatus.count}/{teamStatus.maxPlayers} játékos
                        </div>
                        {teamStatus.isFull && (
                          <div className="text-sm text-red-400 mt-1 font-spooky font-bold">TELE</div>
                        )}
                        {teamStatus.players.length > 0 && (
                          <div className="text-xs text-gray-400 mt-2 font-spooky">
                            {teamStatus.players.map(p => p.name).join(', ')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hibaüzenet */}
              {error && (
                <div className="error-message text-center">
                  {error}
                </div>
              )}

              {/* Gombok */}
              <div className="form-container">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Csatlakozás! 🎮
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="btn-secondary"
                >
                  Vissza
                </button>
              </div>
            </form>
          </div>

          {/* Játék állapot */}
          <div className="mt-mobile-lg p-mobile bg-gradient-to-b from-gray-800 to-gray-700 rounded-2xl border-2 border-orange-500/20 shadow-lg">
            <h4 className="font-bold text-orange-400 mb-mobile text-center text-lg sm:text-xl font-spooky">
              📊 Játék állapot:
            </h4>
            <div className="text-gray-200 space-y-2 sm:space-y-3 font-spooky leading-relaxed text-sm sm:text-base">
              <p className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">👥</span>
                Játékosok: {gameData.game_info.total_players}/4
              </p>
              <p className="flex items-center">
                <span className="text-orange-400 mr-2 text-base">⚡</span>
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