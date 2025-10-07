// components/ProgressDisplay.jsx
import React from 'react';

const ProgressDisplay = ({ currentPlayer, teams, gameStatus, gameInfo, gameName, showAllTeams = false }) => {
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

  // Összes csapat állapotának lekérdezése
  const getAllTeamsStatus = () => {
    if (!teams || teams.length === 0) return [];
    
    return teams.map(team => ({
      name: team.name,
      displayName: team.display_name,
      currentStation: team.current_station,
      completed: team.completed_at !== null,
      attempts: team.attempts,
      helpUsed: team.help_used,
      separatePhaseSaveUsed: team.separate_phase_save_used,
      togetherPhaseSaveUsed: team.together_phase_save_used,
      players: team.players || []
    }));
  };

  // Aktív csapatok lekérdezése (csak azok, ahol van játékos)
  const getActiveTeamsStatus = () => {
    const allTeams = getAllTeamsStatus();
    return allTeams.filter(team => team.players && team.players.length > 0);
  };

  // Döntés arról, hogy mit mutassunk
  const shouldShowAllTeams = () => {
    if (!showAllTeams) return false;
    
    const activeTeams = getActiveTeamsStatus();
    // Ha nincs currentPlayer (admin oldal), mindig mutassuk az aktív csapatokat
    if (!currentPlayer) {
      return activeTeams.length > 0;
    }
    // Ha van currentPlayer (játékos oldal), csak akkor mutassuk mindkettőt, ha több aktív csapat van
    return activeTeams.length > 1;
  };

  // Összes állomás száma (fix érték)
  const totalStations = 6;
  
  // A backend már kiszámítja ezeket, csak használjuk a gameInfo adatokat
  const getCompletedStations = () => {
    if (shouldShowAllTeams()) {
      // Ha mindkét csapatot mutatjuk, akkor az átlagos haladást számítjuk
      const activeTeams = getActiveTeamsStatus();
      if (!activeTeams || activeTeams.length === 0) return 0;
      
      // Ha a játék befejeződött, minden állomás kész
      if (gameStatus === 'finished') return totalStations;
      
      // Átlagos haladás számítása
      let totalProgress = 0;
      activeTeams.forEach(team => {
        if (gameStatus === 'separate') {
          totalProgress += Math.max(0, team.currentStation - 1);
        } else if (gameStatus === 'together') {
          totalProgress += 4 + (team.currentStation - 5);
        }
      });
      
      return Math.round(totalProgress / activeTeams.length);
    } else {
      // Egyedi csapat haladása
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
    }
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
  const allTeamsStatus = getAllTeamsStatus();
  
  // Ha showAllTeams true, akkor minden csapatot mutatunk, különben csak a jelenlegi játékos csapatát
  if (showAllTeams) {
    if (!allTeamsStatus || allTeamsStatus.length === 0) return null;
  } else {
    if (!teamStatus) return null;
  }

  const completed = getCompletedStations();
  const remaining = getRemainingStations();
  const percentage = getProgressPercentage();

  return (
    <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-orange-500/20 relative">
      <div className="text-center">
        {/* Játék név */}
        {gameName && (
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-400 mb-2 font-spooky drop-shadow-glow-orange">
              {gameName}
            </h1>
            {gameInfo && (
              <div className="text-sm text-gray-200 font-spooky">
                Játékosok: {gameInfo.total_players}/{gameInfo.max_players} 
                {gameInfo.available_slots > 0 && (
                  <span className="text-green-400 ml-2">
                    ({gameInfo.available_slots} szabad hely)
                  </span>
                )}
                {gameStatus === 'waiting' && gameInfo.total_players < 1 && (
                  <div className="text-xs text-blue-300 mt-1 font-spooky">
                    Várjuk az első játékos csatlakozását...
                  </div>
                )}
                {gameStatus === 'setup' && (
                  <div className="text-xs text-orange-300 mt-1 font-spooky">
                    Készen áll az indításra! Admin indítja el a játékot.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-orange-400 mb-6 font-spooky">
          Haladás
        </h2>
        
        {/* Haladás sáv */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-200 mb-3 font-spooky">
            <span>Befejezve: {completed}/{totalStations}</span>
            <span>Hátra: {remaining}</span>
          </div>
          
          {/* Csapat logók a sáv felett és alatt */}
          {showAllTeams && allTeamsStatus && allTeamsStatus.length >= 2 && (
            <div className="flex justify-between items-center mb-3">
              {allTeamsStatus.map(team => (
                <div key={team.name} className="flex items-center gap-2">
                  <span className="text-2xl animate-float">
                    {team.name === 'pumpkin' ? '🎃' : 
                     team.name === 'ghost' ? '👻' : 
                     team.name === 'main' ? '🎮' : '🎯'}
                  </span>
                  <span className="text-xs text-orange-300 font-spooky">
                    {team.currentStation || 1}. állomás
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-400 to-yellow-400 h-4 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${percentage}%` }}
            ></div>
            
            {/* Csapat pozíciók jelölése a sávon */}
            {shouldShowAllTeams() && getActiveTeamsStatus().length >= 2 && (
              <>
                {getActiveTeamsStatus().map(team => (
                  <div 
                    key={team.name}
                    className="absolute -top-1 w-4 h-6 bg-orange-300 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                    style={{ 
                      left: `${Math.min(100, Math.max(0, ((team.currentStation || 1) - 1) / totalStations * 100))}%`,
                      transform: 'translateX(-50%)'
                    }}
                    title={team.displayName}
                  >
                    {team.name === 'pumpkin' ? '🎃' : 
                     team.name === 'ghost' ? '👻' : 
                     team.name === 'main' ? '🎮' : '🎯'}
                  </div>
                ))}
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-200 mt-2 font-spooky font-bold">
            {percentage}% kész
          </div>
        </div>

        {/* Csapatok állapota */}
        {shouldShowAllTeams() ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {getActiveTeamsStatus().map((team) => (
              <div key={team.name} className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-4 border border-orange-500/20 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2 animate-float">
                    {team.name === 'pumpkin' ? '🎃' : '👻'}
                  </div>
                  <div className="font-bold text-orange-300 text-lg font-spooky">
                    {team.displayName}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-300 font-spooky">Jelenlegi állomás</div>
                    <div className="text-xl font-bold text-purple-300 font-spooky">
                      {team.currentStation}. állomás
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gradient-to-b from-orange-900/30 to-orange-800/30 rounded-xl p-3 text-center border border-orange-500/20">
                      <div className="text-orange-300 font-bold font-spooky">Próbálkozások</div>
                      <div className="text-sm font-spooky">
                        {team.attempts}/3
                        {team.attempts >= 2 && <span className="text-red-400 ml-1">⚠️</span>}
                      </div>
                    </div>
                    <div className="bg-gradient-to-b from-purple-900/30 to-purple-800/30 rounded-xl p-3 text-center border border-purple-500/20">
                      <div className="text-purple-300 font-bold font-spooky">Segítség</div>
                      <div className="text-sm font-spooky">
                        {team.helpUsed ? 'Használva' : 'Elérhető'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-b from-green-900/30 to-green-800/30 rounded-xl p-3 text-center border border-green-500/20">
                      <div className="text-green-300 font-bold font-spooky">Mentesítő</div>
                      <div className="text-sm font-spooky">
                        {gameStatus === 'separate' ? 
                          (team.separatePhaseSaveUsed ? 'Használva' : 'Elérhető') :
                          (team.togetherPhaseSaveUsed ? 'Használva' : 'Elérhető')
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-300 text-center font-spooky">
                    {gameStatus === 'separate' ? 'Külön fázis' : 'Közös fázis'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-4 border border-orange-500/20">
            {teamStatus ? (
              <>
                <div className="text-lg font-bold text-purple-300 mb-2 font-spooky">
                  Jelenlegi állomás: {teamStatus.currentStation}. 
                </div>
                <div className="text-sm text-gray-200 font-spooky">
                  {gameStatus === 'separate' ? 'Külön fázis' : 'Közös fázis'}
                </div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-400 mb-2 font-spooky">
                Nincs aktív játékos
              </div>
            )}
          </div>
        )}

        {/* Játékosok listája - csak ha nem showAllTeams módban vagyunk */}
        {!showAllTeams && teams && teams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-orange-300 mb-4 font-spooky">
              Játékosok
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.name} className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-4 border border-orange-500/20 shadow-lg">
                  <div className="text-center mb-3">
                    <div className="text-3xl mb-2 animate-float">
                      {team.name === 'pumpkin' ? '🎃' : '👻'}
                    </div>
                    <div className="font-bold text-orange-300 font-spooky">
                      {team.display_name}
                    </div>
                    <div className="text-sm text-gray-300 font-spooky">
                      {team.player_count}/{team.max_players} játékos
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {team.players.map((player, index) => (
                      <div key={index} className="text-sm text-gray-200 flex items-center justify-between font-spooky">
                        <span className="truncate">{player.name}</span>
                        {player.name === currentPlayer?.name && (
                          <span className="text-orange-400 text-xs ml-1 font-bold">(Te)</span>
                        )}
                      </div>
                    ))}
                    
                    {team.available_slots > 0 && (
                      <div className="text-xs text-gray-400 text-center mt-2 font-spooky">
                        {team.available_slots} szabad hely
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próbálkozások, segítség és mentesítő feladat - csak ha nem showAllTeams módban vagyunk */}
        {!showAllTeams && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-b from-orange-900/30 to-orange-800/30 rounded-xl p-4 text-center border border-orange-500/20">
              <div className="text-sm text-orange-300 font-bold mb-2 font-spooky">Próbálkozások</div>
              <div className="text-lg font-spooky">
                {teamStatus.attempts}/3
                {teamStatus.attempts >= 2 && (
                  <span className="text-red-400 ml-1">⚠️</span>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-b from-purple-900/30 to-purple-800/30 rounded-xl p-4 text-center border border-purple-500/20">
              <div className="text-sm text-purple-300 font-bold mb-2 font-spooky">Segítség</div>
              <div className="text-lg font-spooky">
                {teamStatus.helpUsed ? 'Használva' : 'Elérhető'}
              </div>
            </div>
            <div className="bg-gradient-to-b from-green-900/30 to-green-800/30 rounded-xl p-4 text-center border border-green-500/20">
              <div className="text-sm text-green-300 font-bold mb-2 font-spooky">Mentesítő</div>
              <div className="text-lg font-spooky">
                {gameStatus === 'separate' ? 
                  (teamStatus.separatePhaseSaveUsed ? 'Használva' : 'Elérhető') :
                  (teamStatus.togetherPhaseSaveUsed ? 'Használva' : 'Elérhető')
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDisplay;