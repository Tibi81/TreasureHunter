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
        <div className="text-6xl mb-4 animate-float">
          {isTie ? '🤝' : winner?.name === 'pumpkin' ? '🎃' : '👻'}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-400 mb-2 font-spooky drop-shadow-glow-orange">
          {isTie ? 'Döntetlen!' : `${utils.formatTeamName(winner?.name)} nyert!`}
        </h1>
        <p className="text-xl text-purple-300 font-spooky">
          Gratulálunk a játékosoknak! 🎉
        </p>
      </div>

      {/* Eredmények táblázat */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-orange-500/20">
        <h2 className="text-3xl font-bold text-center text-orange-400 mb-6 font-spooky drop-shadow-glow-orange">
          🏆 Végeredmény
        </h2>
        
        <div className="space-y-4">
          {sortedTeams.map((team, index) => (
            <div key={team.name} className={`p-6 rounded-xl border-2 shadow-lg ${
              index === 0 ? 'border-yellow-400 bg-gradient-to-b from-yellow-900/30 to-yellow-800/30' :
              index === 1 ? 'border-gray-400 bg-gradient-to-b from-gray-800/30 to-gray-700/30' :
              'border-gray-600 bg-gradient-to-b from-purple-900/30 to-gray-800/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-orange-400 font-spooky">
                    #{index + 1}
                  </div>
                  <div className="text-4xl animate-float">
                    {team.name === 'pumpkin' ? '🎃' : '👻'}
                  </div>
                  <div>
                    <div className="text-xl font-bold font-spooky">
                      {utils.formatTeamName(team.name)}
                    </div>
                    <div className="text-sm text-gray-200 font-spooky">
                      {team.completed_at ? 'Befejezve' : `${team.current_station}. állomás`}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {team.completed_at ? (
                    <div>
                      <div className="text-lg font-bold text-green-400 font-spooky">
                        {formatTime(team.completed_at)}
                      </div>
                      <div className="text-sm text-gray-200 font-spooky">
                        Időtartam: {getDuration(team)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-orange-400 font-spooky">
                      Folyamatban...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Csapat részletek */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-300 font-spooky">Próba:</span>
                  <span className="ml-2 font-bold text-orange-400 font-spooky">{team.attempts}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-300 font-spooky">Segítség:</span>
                  <span className="ml-2 font-bold font-spooky">
                    {team.help_used ? '✅ Használva' : '❌ Nem'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Játékosok listája */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-orange-500/20">
        <h2 className="text-3xl font-bold text-center text-orange-400 mb-6 font-spooky drop-shadow-glow-orange">
          👥 Játékosok
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.name} className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-4 border border-orange-500/20 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3 animate-float">
                  {team.name === 'pumpkin' ? '🎃' : '👻'}
                </div>
                <div className="font-bold text-lg font-spooky">
                  {utils.formatTeamName(team.name)}
                </div>
              </div>
              
              <div className="space-y-2">
                {team.players?.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 rounded-xl p-3 border border-gray-600">
                    <span className="text-gray-200 font-spooky">{player.name}</span>
                    <span className="text-xs text-gray-400 font-spooky">
                      {new Date(player.joined_at).toLocaleTimeString('hu-HU')}
                    </span>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm font-spooky">Nincs játékos</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statisztikák */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-orange-500/20">
        <h2 className="text-3xl font-bold text-center text-orange-400 mb-6 font-spooky drop-shadow-glow-orange">
          📊 Játék statisztikák
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-gradient-to-b from-orange-900/20 to-orange-800/20 rounded-xl p-4 border border-orange-500/20">
            <div className="text-3xl font-bold text-orange-400 font-spooky">{totalPlayers}</div>
            <div className="text-sm text-gray-200 font-spooky">Játékos</div>
          </div>
          <div className="text-center bg-gradient-to-b from-green-900/20 to-green-800/20 rounded-xl p-4 border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 font-spooky">{completedTeams}</div>
            <div className="text-sm text-gray-200 font-spooky">Befejezett csapat</div>
          </div>
          <div className="text-center bg-gradient-to-b from-purple-900/20 to-purple-800/20 rounded-xl p-4 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 font-spooky">{totalAttempts}</div>
            <div className="text-sm text-gray-200 font-spooky">Összes próbálkozás</div>
          </div>
          <div className="text-center bg-gradient-to-b from-yellow-900/20 to-yellow-800/20 rounded-xl p-4 border border-yellow-500/20">
            <div className="text-3xl font-bold text-yellow-400 font-spooky">{helpUsed}</div>
            <div className="text-sm text-gray-200 font-spooky">Segítség használva</div>
          </div>
        </div>
      </div>

      {/* Újrakezdés gomb */}
      <div className="text-center">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-orange-500 to-purple-600 
                   hover:from-orange-400 hover:to-purple-500 
                   text-white font-bold py-4 px-8 rounded-xl 
                   transition-all duration-200 text-xl transform hover:scale-105
                   shadow-md hover:shadow-orange-400/40 font-spooky"
        >
          🎮 Új játék indítása
        </button>
      </div>
    </div>
  );
};

export default GameResults;
