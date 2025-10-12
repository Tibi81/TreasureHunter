// components/admin/GameList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { getStatusColor, getStatusText } from '../../utils/gameUtils';

const GameList = ({ 
  games, 
  filteredGames, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  loadGames, 
  handleSelectGame, 
  setEditingGame, 
  handleStopGame, 
  handleDeleteGame,
  setView
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-mobile">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-orange-400">
            Játékok listája ({filteredGames.length})
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Keresés játékok között..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary w-full sm:w-auto"
            />
            <button
              onClick={loadGames}
              disabled={loading}
              className="btn-admin"
            >
              {loading ? 'Frissítés...' : '🔄 Frissítés'}
            </button>
          </div>
        </div>

        {loading && games.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-4">⏳</div>
            <p className="text-gray-300">Játékok betöltése...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-4">🎮</div>
            <p className="text-gray-300">
              {searchTerm ? 'Nincs találat a keresésre' : 'Még nincsenek játékok'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setView('create')}
                className="btn-success mt-mobile"
              >
                ➕ Új játék létrehozása
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <div key={game.id} className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-lg p-mobile border border-orange-500/20 shadow-lg">
                <div className="mb-mobile">
                  <h3 className="text-lg font-bold text-orange-400 mb-2 break-words font-spooky">{game.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Kód:</span>
                      <span className="font-mono text-green-400">{game.game_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Állapot:</span>
                      <span className={getStatusColor(game.status)}>
                        {getStatusText(game.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Játékosok:</span>
                      <span className="text-blue-400">{game.total_players}/4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Létrehozta:</span>
                      <span className="text-purple-400">{game.created_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Létrehozva:</span>
                      <span className="text-gray-400">
                        {new Date(game.created_at).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-mobile-row">
                  <button
                    onClick={() => handleSelectGame(game)}
                    className="btn-admin flex-1"
                  >
                    ⚙️ Kezelés
                  </button>
                  <button
                    onClick={() => setEditingGame(game)}
                    className="btn-small"
                  >
                    ✏️
                  </button>
                  {(game.status === 'separate' || game.status === 'together') && (
                    <button
                      onClick={() => handleStopGame(game.id)}
                      disabled={loading}
                      className="btn-danger"
                    >
                      ⏹️
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    disabled={loading}
                    className="btn-danger"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

GameList.propTypes = {
  games: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      game_code: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      total_players: PropTypes.number,
      created_by: PropTypes.string,
      created_at: PropTypes.string,
    })
  ).isRequired,
  filteredGames: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      game_code: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      total_players: PropTypes.number,
      created_by: PropTypes.string,
      created_at: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  loadGames: PropTypes.func.isRequired,
  handleSelectGame: PropTypes.func.isRequired,
  setEditingGame: PropTypes.func.isRequired,
  handleStopGame: PropTypes.func.isRequired,
  handleDeleteGame: PropTypes.func.isRequired,
  setView: PropTypes.func.isRequired,
};

export default GameList;
