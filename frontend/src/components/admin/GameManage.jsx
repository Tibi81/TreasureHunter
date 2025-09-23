// components/admin/GameManage.jsx
import React from 'react';
import { getStatusColor, getStatusText } from '../../utils/gameUtils';

const GameManage = ({ 
  currentGame, 
  loading, 
  setAddingPlayer, 
  handleMovePlayer, 
  handleRemovePlayer, 
  handleStartGame, 
  handleResetGame, 
  setView 
}) => {
  return (
    <div className="space-y-6">
      {/* Játék információk */}
      <div className="bg-black bg-opacity-60 rounded-lg p-6">
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
      <div className="bg-black bg-opacity-60 rounded-lg p-6">
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
            ➕ Játékos hozzáadása
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tök Csapat */}
          <div className="bg-orange-900 bg-opacity-20 rounded-lg p-4 border border-orange-600">
            <h4 className="text-lg font-semibold text-orange-400 mb-3 text-center">
              🎃 Tök Csapat
            </h4>
            <div className="space-y-2">
              {(currentGame.teams || currentGame.game?.teams || [])
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
              {!((currentGame.teams || currentGame.game?.teams || [])
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
              {(currentGame.teams || currentGame.game?.teams || [])
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
              {!((currentGame.teams || currentGame.game?.teams || [])
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
      <div className="bg-black bg-opacity-60 rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">
          Admin műveletek
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {(currentGame.status || currentGame.game?.status) === 'setup' && (
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-blue-600 
                         hover:from-green-500 hover:to-blue-500 
                         disabled:from-gray-600 disabled:to-gray-600
                         text-white font-bold py-3 px-6 rounded-lg 
                         transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Indítás...' : '🚀 Játék indítása'}
              </button>
              <p className="text-xs text-gray-300 mt-2">
                A játék már készen áll az indításra! (Legalább 1 játékos szükséges)
              </p>
            </div>
          )}
          
          <button
            onClick={handleResetGame}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 
                     hover:from-red-500 hover:to-orange-500 
                     disabled:from-gray-600 disabled:to-gray-600
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Visszaállítás...' : '🔄 Játék visszaállítása'}
          </button>

          <button
            onClick={() => setView('list')}
            className="bg-gray-600 hover:bg-gray-500 
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition-all duration-200"
          >
            Vissza a listához
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameManage;
