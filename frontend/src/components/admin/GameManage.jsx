// components/admin/GameManage.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { getStatusColor, getStatusText } from '../../utils/gameUtils';
import ProgressDisplay from '../ProgressDisplay';
import { useGame } from '../../hooks/useGameAPI';

const GameManage = ({ 
  currentGame, 
  loading, 
  setAddingPlayer, 
  handleMovePlayer, 
  handleRemovePlayer, 
  handleStartGame, 
  handleResetGame
}) => {
  // Debug: Ellenőrizzük a currentGame adatokat
  console.log('🔍 GameManage - currentGame:', currentGame);

  // Részletes játékadatok (gyors refetch miatt ez frissül a leggyorsabban)
  const gameId = currentGame.id || currentGame.game?.id;
  const { data: detailData } = useGame(gameId);
  const effectiveTeams = detailData?.teams || currentGame?.teams || currentGame?.game?.teams || [];
  console.log('🔍 GameManage - effectiveTeams:', effectiveTeams);
  
  // Debug: Ellenőrizzük a játékosokat
  const pumpkinTeam = effectiveTeams.find(t => t.name === 'pumpkin');
  const ghostTeam = effectiveTeams.find(t => t.name === 'ghost');
  console.log('🔍 GameManage - pumpkinTeam:', pumpkinTeam);
  console.log('🔍 GameManage - ghostTeam:', ghostTeam);
  console.log('🔍 GameManage - pumpkinPlayers:', pumpkinTeam?.players);
  console.log('🔍 GameManage - ghostPlayers:', ghostTeam?.players);
  
  // Indíthatóság számítása backend logika szerint
  const status = currentGame.status || currentGame.game?.status;
  const teams = effectiveTeams;
  const teamCount = currentGame.team_count || currentGame.game?.team_count || 2;
  const pumpkinCount = teams.find(t => t.name === 'pumpkin')?.players?.length || 0;
  const ghostCount = teams.find(t => t.name === 'ghost')?.players?.length || 0;
  const totalPlayers = (currentGame.total_players || currentGame.game?.total_players || (pumpkinCount + ghostCount));
  const canStart = (
    (status === 'waiting' || status === 'setup') && (
      (teamCount === 1 && totalPlayers >= 1) ||
      (teamCount >= 2 && pumpkinCount >= 1 && ghostCount >= 1)
    )
  );

  return (
    <div className="space-y-6">
      {/* Csapatok haladása - csak ha a játék fut */}
      {((currentGame.status || currentGame.game?.status) === 'separate' || 
        (currentGame.status || currentGame.game?.status) === 'together' || 
        (currentGame.status || currentGame.game?.status) === 'finished') && (
        <ProgressDisplay
          gameId={currentGame.id || currentGame.game?.id}
          showAllTeams={true}
        />
      )}

      {/* Játék információk */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center">
          Játék információk
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-gray-300">Játék neve:</p>
            <p className="text-xl font-semibold text-orange-400">{currentGame.name || currentGame.game?.name}</p>
          </div>
          <div>
            <p className="text-gray-300">Játék kód:</p>
            <p className="text-xl font-mono font-bold text-green-400">{currentGame.game_code || currentGame.game?.game_code}</p>
          </div>
          <div>
            <p className="text-gray-300">Állapot:</p>
            <p className={`text-xl font-semibold ${getStatusColor(currentGame.status || currentGame.game?.status)}`}>
              {getStatusText(currentGame.status || currentGame.game?.status)}
            </p>
          </div>
          <div>
            <p className="text-gray-300">Létrehozta:</p>
            <p className="text-xl font-semibold text-blue-400">{currentGame.created_by || currentGame.game?.created_by}</p>
          </div>
        </div>
      </div>

      {/* Játékosok listája */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-orange-400">
            Játékosok
          </h3>
          <button
            onClick={() => setAddingPlayer(true)}
            className="bg-green-600 hover:bg-green-500 
                     text-white font-bold py-2 px-4 rounded-lg 
                     transition-all duration-200"
          >
            ➕ Játékos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tök Csapat */}
          <div className="bg-orange-900 bg-opacity-20 rounded-lg p-4 border border-orange-600">
            <h4 className="text-lg font-semibold text-orange-400 mb-3 text-center">
              🎃 Tök Csapat
            </h4>
            <div className="space-y-2">
              {effectiveTeams
                .find(t => t.name === 'pumpkin')?.players?.map((player, index) => (
                <div key={index} className="bg-orange-800 bg-opacity-30 rounded p-2 flex justify-between items-center">
                  <span>{player.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMovePlayer(currentGame.id || currentGame.game?.id, player.id, 'ghost')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 
                               text-white text-xs font-bold py-1 px-2 rounded 
                               transition-all duration-200 disabled:cursor-not-allowed"
                      title="Áthelyezés Szellem csapatba"
                    >
                      👻
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(currentGame.id || currentGame.game?.id, player.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                               text-white text-xs font-bold py-1 px-2 rounded 
                               transition-all duration-200 disabled:cursor-not-allowed"
                      title="Eltávolítás"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )) || []}
              {!((effectiveTeams)
                .find(t => t.name === 'pumpkin')?.players?.length) && (
                <div className="text-gray-400 text-center py-2">
                  Nincs játékos
                </div>
              )}
            </div>
          </div>

          {/* Szellem Csapat */}
          <div className="bg-purple-900 bg-opacity-20 rounded-lg p-4 border border-purple-600">
            <h4 className="text-lg font-semibold text-purple-400 mb-3 text-center">
              👻 Szellem Csapat
            </h4>
            <div className="space-y-2">
              {effectiveTeams
                .find(t => t.name === 'ghost')?.players?.map((player, index) => (
                <div key={index} className="bg-purple-800 bg-opacity-30 rounded p-2 flex justify-between items-center">
                  <span>{player.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMovePlayer(currentGame.id || currentGame.game?.id, player.id, 'pumpkin')}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 
                               text-white text-xs font-bold py-1 px-2 rounded 
                               transition-all duration-200 disabled:cursor-not-allowed"
                      title="Áthelyezés Tök csapatba"
                    >
                      🎃
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(currentGame.id || currentGame.game?.id, player.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                               text-white text-xs font-bold py-1 px-2 rounded 
                               transition-all duration-200 disabled:cursor-not-allowed"
                      title="Eltávolítás"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )) || []}
              {!((effectiveTeams)
                .find(t => t.name === 'ghost')?.players?.length) && (
                <div className="text-gray-400 text-center py-2">
                  Nincs játékos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin műveletek */}
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">
          Admin műveletek
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Játék indítás gomb a pontos feltételek szerint */}
          {canStart ? (
            <button
              onClick={handleStartGame}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-blue-600 
                       hover:from-green-500 hover:to-blue-500 
                       disabled:from-gray-600 disabled:to-gray-600
                       text-white font-bold py-3 px-6 rounded-lg 
                       transition-all duration-200 disabled:cursor-not-allowed
                       min-w-32 sm:min-w-56"
            >
              {loading ? 'Indítás...' : '🚀 Játék indítása'}
            </button>
          ) : (
            status === 'waiting' || status === 'setup' ? (
              <div className="bg-gradient-to-r from-gray-600 to-gray-500 
                          text-gray-200 font-bold py-3 px-6 rounded-lg 
                          transition-all duration-200 min-w-32 sm:min-w-56 text-center">
                ⏳ Indításhoz szükséges: {teamCount >= 2 ? 'mindkét csapatból legalább 1 játékos' : 'legalább 1 játékos'}
                <div className="text-xs mt-1">
                  🎃 {pumpkinCount} játékos • 👻 {ghostCount} játékos
                </div>
              </div>
            ) : null
          )}
          
          {/* Játék állapot megjelenítése */}
          {((currentGame.status || currentGame.game?.status) === 'separate' || 
            (currentGame.status || currentGame.game?.status) === 'together') && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 
                           text-white font-bold py-3 px-6 rounded-lg 
                           min-w-32 sm:min-w-56 text-center">
              🎮 Játék fut!
            </div>
          )}
          
          <button
            onClick={handleResetGame}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 
                     hover:from-red-500 hover:to-orange-500 
                     disabled:from-gray-600 disabled:to-gray-600
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition-all duration-200 disabled:cursor-not-allowed
                     min-w-56"
          >
            {loading ? 'Visszaállítás...' : '🔄 Játék visszaállítása'}
          </button>

          
        </div>
      </div>
    </div>
  );
};

GameManage.propTypes = {
  currentGame: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    game_code: PropTypes.string,
    status: PropTypes.string,
    created_by: PropTypes.string,
    max_players: PropTypes.number,
    teams: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        players: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
          })
        ),
      })
    ),
    game: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      game_code: PropTypes.string,
      status: PropTypes.string,
      created_by: PropTypes.string,
      max_players: PropTypes.number,
      teams: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          players: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.number.isRequired,
              name: PropTypes.string.isRequired,
            })
          ),
        })
      ),
    }),
  }).isRequired,
  loading: PropTypes.bool,
  setAddingPlayer: PropTypes.func.isRequired,
  handleMovePlayer: PropTypes.func.isRequired,
  handleRemovePlayer: PropTypes.func.isRequired,
  handleStartGame: PropTypes.func.isRequired,
  handleResetGame: PropTypes.func.isRequired,
};

export default GameManage;
