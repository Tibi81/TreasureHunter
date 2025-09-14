// components/ProgressDisplay.jsx
import React from 'react';

const ProgressDisplay = ({ currentPlayer, teams, gameStatus, gameInfo, gameName, onLogout }) => {
  // Jelenlegi csapat állapotának lekérdezése
  const getCurrentTeamStatus = () => {
    if (!currentPlayer) return null;
    const team = teams.find(t => t.name === (currentPlayer.team_name || currentPlayer.team));
    if (!team) return null;
    
    return {
      currentStation: team.current_station,
      completed: team.completed_at !== null,
      attempts: team.attempts,
      helpUsed: team.help_used,
      separatePhaseSaveUsed: team.separate_phase_save_used,
      togetherPhaseSaveUsed: team.together_phase_save_used
    };
  };

  // Összes állomás száma (fix érték)
  const totalStations = 6;
  
  // A backend már kiszámítja ezeket, csak használjuk a gameInfo adatokat
  const getCompletedStations = () => {
    const teamStatus = getCurrentTeamStatus();
    if (!teamStatus) return 0;
    
    // Ha a játék befejeződött, minden állomás kész
    if (gameStatus === 'finished') return totalStations;
    
    // Külön fázisban: a jelenlegi állomás - 1 (mert még nem fejezték be)
    if (gameStatus === 'separate') {
      return Math.max(0, teamStatus.currentStation - 1);
    }
    
    // Közös fázisban: 4 állomás + közös állomások
    if (gameStatus === 'together') {
      return 4 + (teamStatus.currentStation - 5); // 5. állomás = 4 + 1, 6. állomás = 4 + 2
    }
    
    return 0;
  };

  // Hátralévő állomások száma
  const getRemainingStations = () => {
    return totalStations - getCompletedStations();
  };

  // Haladás százaléka
  const getProgressPercentage = () => {
    return Math.round((getCompletedStations() / totalStations) * 100);
  };

  const teamStatus = getCurrentTeamStatus();
  if (!teamStatus) return null;

  const completed = getCompletedStations();
  const remaining = getRemainingStations();
  const percentage = getProgressPercentage();

  return (
    <div className="bg-black bg-opacity-60 rounded-lg p-4 mb-6">
      <div className="text-center">
        {/* Játék név */}
        {gameName && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-orange-400 mb-2">
              🎮 {gameName}
            </h1>
            {gameInfo && (
              <div className="text-sm text-gray-300">
                Játékosok: {gameInfo.total_players}/{gameInfo.max_players} 
                {gameInfo.available_slots > 0 && (
                  <span className="text-green-400 ml-2">
                    ({gameInfo.available_slots} szabad hely)
                  </span>
                )}
                {gameStatus === 'waiting' && gameInfo.total_players < 1 && (
                  <div className="text-xs text-blue-300 mt-1">
                    ⏳ Várjuk az első játékos csatlakozását...
                  </div>
                )}
                {gameStatus === 'setup' && (
                  <div className="text-xs text-orange-300 mt-1">
                    ✅ Készen áll az indításra! Admin indítsa el a játékot.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold text-orange-400 mb-4">
          📊 Haladás
        </h2>
        
        {/* Haladás sáv */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Befejezve: {completed}/{totalStations}</span>
            <span>Hátra: {remaining}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {percentage}% kész
          </div>
        </div>

        {/* Jelenlegi állomás */}
        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-purple-300 mb-1">
            Jelenlegi állomás: {teamStatus.currentStation}. 
          </div>
          <div className="text-sm text-gray-300">
            {gameStatus === 'separate' ? 'Külön fázis' : 'Közös fázis'}
          </div>
        </div>

        {/* Játékosok listája */}
        {teams && teams.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">
              👥 Játékosok
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.name} className="bg-gray-900 bg-opacity-50 rounded-lg p-3">
                  <div className="text-center mb-2">
                    <div className="text-2xl mb-1">
                      {team.name === 'pumpkin' ? '🎃' : '👻'}
                    </div>
                    <div className="font-semibold text-orange-300">
                      {team.display_name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {team.player_count}/{team.max_players} játékos
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {team.players.map((player, index) => (
                      <div key={index} className="text-sm text-gray-300 flex items-center justify-between">
                        <span>{player.name}</span>
                        {player.name === currentPlayer?.name && (
                          <span className="text-orange-400 text-xs">(Te)</span>
                        )}
                      </div>
                    ))}
                    
                    {team.available_slots > 0 && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        {team.available_slots} szabad hely
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próbálkozások, segítség és mentesítő feladat */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-orange-900 bg-opacity-30 rounded-lg p-2">
            <div className="text-sm text-orange-300 font-semibold">Próbálkozások</div>
            <div className="text-lg">
              {teamStatus.attempts}/3
              {teamStatus.attempts >= 2 && (
                <span className="text-red-400 ml-1">⚠️</span>
              )}
            </div>
          </div>
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-2">
            <div className="text-sm text-purple-300 font-semibold">Segítség</div>
            <div className="text-lg">
              {teamStatus.helpUsed ? '❌ Használva' : '✅ Elérhető'}
            </div>
          </div>
          <div className="bg-green-900 bg-opacity-30 rounded-lg p-2">
            <div className="text-sm text-green-300 font-semibold">Mentesítő</div>
            <div className="text-lg">
              {gameStatus === 'separate' ? 
                (teamStatus.separatePhaseSaveUsed ? '❌ Használva' : '✅ Elérhető') :
                (teamStatus.togetherPhaseSaveUsed ? '❌ Használva' : '✅ Elérhető')
              }
            </div>
          </div>
        </div>

        {/* Kijelentkezés gomb */}
        {onLogout && (
          <div className="mt-4 text-center">
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            >
              🚪 Kijelentkezés
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDisplay;
