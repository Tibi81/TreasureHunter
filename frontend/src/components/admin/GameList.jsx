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
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-6">
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
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 w-full sm:w-auto"
            />
            <button
              onClick={loadGames}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 
                       text-white font-bold py-2 px-4 rounded-lg 
                       transition-all duration-200 disabled:cursor-not-allowed"
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
                className="mt-4 bg-gradient-to-r from-green-600 to-blue-600 
                         hover:from-green-500 hover:to-blue-500 
                         text-white font-bold py-3 px-6 rounded-lg 
                         transition-all duration-200"
              >
                ➕ Új játék létrehozása
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <div key={game.id} className="bg-white rounded-lg p-4 border border-gray-300 shadow-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-orange-600 mb-2 break-words">{game.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kód:</span>
                      <span className="font-mono text-green-600">{game.game_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Állapot:</span>
                      <span className={getStatusColor(game.status)}>
                        {getStatusText(game.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Játékosok:</span>
                      <span className="text-blue-600">{game.total_players}/4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Létrehozta:</span>
                      <span className="text-purple-600">{game.created_by}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Létrehozva:</span>
                      <span className="text-gray-500">
                        {new Date(game.created_at).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectGame(game)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 
                             text-white text-sm font-bold py-2 px-3 rounded 
                             transition-all duration-200"
                  >
                    ⚙️ Kezelés
                  </button>
                  <button
                    onClick={() => setEditingGame(game)}
                    className="bg-yellow-600 hover:bg-yellow-500 
                             text-white text-sm font-bold py-2 px-3 rounded 
                             transition-all duration-200"
                  >
                    ✏️
                  </button>
                  {(game.status === 'separate' || game.status === 'together') && (
                    <button
                      onClick={() => handleStopGame(game.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 
                               text-white text-sm font-bold py-2 px-3 rounded 
                               transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      ⏹️
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    disabled={loading}
                    className="bg-red-800 hover:bg-red-700 disabled:bg-gray-600 
                             text-white text-sm font-bold py-2 px-3 rounded 
                             transition-all duration-200 disabled:cursor-not-allowed"
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
