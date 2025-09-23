// components/admin/PlayerAddModal.jsx
import React from 'react';

const PlayerAddModal = ({ 
  addingPlayer, 
  setAddingPlayer, 
  newPlayerName, 
  setNewPlayerName, 
  newPlayerTeam, 
  setNewPlayerTeam, 
  loading, 
  handleAddPlayer, 
  currentGame 
}) => {
  if (!addingPlayer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-orange-400 mb-4">
          Játékos hozzáadása
        </h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleAddPlayer(currentGame.id || currentGame.game?.id);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Játékos neve:</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Add meg a játékos nevét..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Csapat:</label>
              <select
                value={newPlayerTeam}
                onChange={(e) => setNewPlayerTeam(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="pumpkin">🎃 Tök Csapat</option>
                <option value="ghost">👻 Szellem Csapat</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setAddingPlayer(false);
                setNewPlayerName('');
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 
                       text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed"
            >
              {loading ? 'Hozzáadás...' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerAddModal;
