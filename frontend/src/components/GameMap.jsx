// components/GameMap.jsx
import React from 'react';
import { utils } from '../services/api';

const GameMap = ({ teams, currentPlayer, gameStatus }) => {
  // Állomások definiálása
  const stations = [
    { number: 1, name: 'Kezdő állomás', icon: '🎃', phase: 'separate' },
    { number: 2, name: 'Kísértetek kastélya', icon: '👻', phase: 'separate' },
    { number: 3, name: 'Pókok barlangja', icon: '🕷️', phase: 'separate' },
    { number: 4, name: 'Denevérek tornya', icon: '🦇', phase: 'separate' },
    { number: 5, name: 'Találkozási pont', icon: '💀', phase: 'together' },
    { number: 6, name: 'Boszorkány ház', icon: '🧙‍♀️', phase: 'together' }
  ];

  // Csapat állapotának lekérdezése
  const getTeamStatus = (teamName) => {
    const team = teams.find(t => t.name === teamName);
    if (!team) return { currentStation: 1, completed: false };
    
    return {
      currentStation: team.current_station,
      completed: team.completed_at !== null,
      attempts: team.attempts,
      helpUsed: team.help_used
    };
  };

  // Állomás státuszának meghatározása
  const getStationStatus = (stationNumber, teamName) => {
    const teamStatus = getTeamStatus(teamName);
    
    if (stationNumber < teamStatus.currentStation) {
      return 'completed'; // Befejezett
    } else if (stationNumber === teamStatus.currentStation) {
      return 'current'; // Jelenlegi
    } else {
      return 'upcoming'; // Következő
    }
  };

  // Állomás színének meghatározása
  const getStationColor = (status, phase) => {
    if (status === 'completed') {
      return 'bg-green-600 border-green-400';
    } else if (status === 'current') {
      return phase === 'together' ? 'bg-purple-600 border-purple-400' : 'bg-orange-600 border-orange-400';
    } else {
      return 'bg-gray-600 border-gray-400';
    }
  };

  // Játék fázis szövege
  const getPhaseText = () => {
    const phases = {
      'setup': 'Várakozás játékosokra...',
      'separate': 'Külön fázis - versenyzés!',
      'together': 'Közös fázis - együttműködés!',
      'finished': 'Játék befejezve!'
    };
    return phases[gameStatus] || gameStatus;
  };

  return (
    <div className="bg-black bg-opacity-60 rounded-lg p-6 mb-6">
      {/* Játék fázis */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-orange-400 mb-2">
          {getPhaseText()}
        </h2>
        {gameStatus === 'separate' && (
          <p className="text-purple-300">
            Versenyezz a másik csapattal! Ki ér előbb a 4. állomásra?
          </p>
        )}
        {gameStatus === 'together' && (
          <p className="text-purple-300">
            Együttműködés! Dolgozzatok együtt a végső célért!
          </p>
        )}
      </div>

      {/* Állomások térképe */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stations.map((station, index) => {
          const pumpkinStatus = getStationStatus(station.number, 'pumpkin');
          const ghostStatus = getStationStatus(station.number, 'ghost');
          
          return (
            <div key={station.number} className="text-center">
              {/* Állomás */}
              <div className={`p-4 rounded-lg border-2 mb-2 ${getStationColor(
                gameStatus === 'together' ? 
                  (pumpkinStatus === 'completed' || ghostStatus === 'completed' ? 'completed' : 
                   pumpkinStatus === 'current' || ghostStatus === 'current' ? 'current' : 'upcoming') :
                  station.name === 'pumpkin' ? pumpkinStatus : ghostStatus,
                station.phase
              )}`}>
                <div className="text-3xl mb-2">{station.icon}</div>
                <div className="font-semibold text-sm">{station.name}</div>
                <div className="text-xs opacity-75">
                  {station.number}. állomás
                </div>
              </div>

              {/* Csapatok állapota */}
              <div className="space-y-1">
                <div className={`text-xs px-2 py-1 rounded ${
                  pumpkinStatus === 'completed' ? 'bg-green-800 text-green-200' :
                  pumpkinStatus === 'current' ? 'bg-orange-800 text-orange-200' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  🎃 {pumpkinStatus === 'completed' ? '✓' : pumpkinStatus === 'current' ? '→' : '○'}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  ghostStatus === 'completed' ? 'bg-green-800 text-green-200' :
                  ghostStatus === 'current' ? 'bg-purple-800 text-purple-200' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  👻 {ghostStatus === 'completed' ? '✓' : ghostStatus === 'current' ? '→' : '○'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jelenlegi csapat állapota */}
      {currentPlayer && (
        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-center mb-3">
            A te csapatod állapota
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {teams.map(team => {
              const teamStatus = getTeamStatus(team.name);
              const isCurrentTeam = team.name === currentPlayer.team;
              
              return (
                <div key={team.name} className={`p-3 rounded-lg border-2 ${
                  isCurrentTeam ? 'border-orange-400 bg-orange-900 bg-opacity-30' : 'border-gray-600 bg-gray-800 bg-opacity-30'
                }`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {team.name === 'pumpkin' ? '🎃' : '👻'}
                    </div>
                    <div className="font-semibold text-sm mb-1">
                      {utils.formatTeamName(team.name)}
                    </div>
                    <div className="text-xs text-gray-300">
                      {teamStatus.completed ? 'Befejezve!' : `${teamStatus.currentStation}. állomás`}
                    </div>
                    {isCurrentTeam && (
                      <div className="mt-2 text-xs">
                        <div>Próbálkozások: {teamStatus.attempts}/3</div>
                        <div>Segítség: {teamStatus.helpUsed ? 'Használva' : 'Elérhető'}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameMap;
