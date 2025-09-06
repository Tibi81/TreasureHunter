// components/GameResults.jsx
import React from 'react';
import { utils } from '../services/api';

const GameResults = ({ teams, players, onRestart }) => {
  // Csapatok rendezése eredmény szerint
  const sortedTeams = [...teams].sort((a, b) => {
    // Először a befejezési idő szerint
    if (a.completed_at && b.completed_at) {
      return new Date(a.completed_at) - new Date(b.completed_at);
    }
    // Ha csak az egyik fejeződött be
    if (a.completed_at && !b.completed_at) return -1;
    if (!a.completed_at && b.completed_at) return 1;
    // Ha egyik sem fejeződött be, akkor állomás szerint
    return b.current_station - a.current_station;
  });

  // Győztes csapat meghatározása
  const winner = sortedTeams[0];
  const isTie = sortedTeams.length > 1 && 
    sortedTeams[0].completed_at && 
    sortedTeams[1].completed_at &&
    Math.abs(new Date(sortedTeams[0].completed_at) - new Date(sortedTeams[1].completed_at)) < 1000; // 1 másodperc tolerancia

  // Statisztikák számítása
  const totalPlayers = players.length;
  const completedTeams = teams.filter(team => team.completed_at).length;
  const totalAttempts = teams.reduce((sum, team) => sum + team.attempts, 0);
  const helpUsed = teams.filter(team => team.help_used).length;

  // Idő formázása
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Időtartam számítása
  const getDuration = (team) => {
    if (!team.completed_at) return 'N/A';
    // Feltételezzük, hogy a játék most fejeződött be
    const now = new Date();
    const completed = new Date(team.completed_at);
    const diffMs = now - completed;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Győztes kihirdetése */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">
          {isTie ? '🤝' : winner?.name === 'pumpkin' ? '🎃' : '👻'}
        </div>
        <h1 className="text-4xl font-bold text-orange-400 mb-2">
          {isTie ? 'Döntetlen!' : `${utils.formatTeamName(winner?.name)} nyert!`}
        </h1>
        <p className="text-xl text-purple-300">
          Gratulálunk a játékosoknak! 🎉
        </p>
      </div>

      {/* Eredmények táblázat */}
      <div className="bg-black bg-opacity-60 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-center text-orange-400 mb-6">
          🏆 Végeredmény
        </h2>
        
        <div className="space-y-4">
          {sortedTeams.map((team, index) => (
            <div key={team.name} className={`p-4 rounded-lg border-2 ${
              index === 0 ? 'border-yellow-400 bg-yellow-900 bg-opacity-30' :
              index === 1 ? 'border-gray-400 bg-gray-800 bg-opacity-30' :
              'border-gray-600 bg-gray-900 bg-opacity-30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-orange-400">
                    #{index + 1}
                  </div>
                  <div className="text-3xl">
                    {team.name === 'pumpkin' ? '🎃' : '👻'}
                  </div>
                  <div>
                    <div className="text-xl font-semibold">
                      {utils.formatTeamName(team.name)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {team.completed_at ? 'Befejezve' : `${team.current_station}. állomás`}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {team.completed_at ? (
                    <div>
                      <div className="text-lg font-semibold text-green-400">
                        {formatTime(team.completed_at)}
                      </div>
                      <div className="text-sm text-gray-300">
                        Időtartam: {getDuration(team)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-orange-400">
                      Folyamatban...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Csapat részletek */}
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Próbálkozások:</span>
                  <span className="ml-2 font-semibold">{team.attempts}</span>
                </div>
                <div>
                  <span className="text-gray-400">Segítség:</span>
                  <span className="ml-2 font-semibold">
                    {team.help_used ? '✅ Használva' : '❌ Nem'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Játékosok listája */}
      <div className="bg-black bg-opacity-60 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-center text-orange-400 mb-6">
          👥 Játékosok
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.name} className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3">
                  {team.name === 'pumpkin' ? '🎃' : '👻'}
                </div>
                <div className="font-semibold text-lg">
                  {utils.formatTeamName(team.name)}
                </div>
              </div>
              
              <div className="space-y-2">
                {team.players?.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-2">
                    <span className="text-gray-200">{player.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(player.joined_at).toLocaleTimeString('hu-HU')}
                    </span>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm">Nincs játékos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statisztikák */}
      <div className="bg-black bg-opacity-60 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-center text-orange-400 mb-6">
          📊 Játék statisztikák
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400">{totalPlayers}</div>
            <div className="text-sm text-gray-300">Játékos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{completedTeams}</div>
            <div className="text-sm text-gray-300">Befejezett csapat</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{totalAttempts}</div>
            <div className="text-sm text-gray-300">Összes próbálkozás</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{helpUsed}</div>
            <div className="text-sm text-gray-300">Segítség használva</div>
          </div>
        </div>
      </div>

      {/* Újrakezdés gomb */}
      <div className="text-center">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-orange-600 to-purple-600 
                   hover:from-orange-500 hover:to-purple-500 
                   text-white font-bold py-4 px-8 rounded-lg 
                   transition-all duration-200 text-xl"
        >
          🎮 Új játék indítása
        </button>
      </div>
    </div>
  );
};

export default GameResults;
