// components/admin/GameEditModal.jsx
import React from 'react';

const GameEditModal = ({ 
  editingGame, 
  setEditingGame, 
  loading, 
  handleEditGame 
}) => {
  if (!editingGame) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-orange-400 mb-4">
          Játék szerkesztése
        </h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleEditGame(editingGame.id, {
            name: formData.get('name'),
            created_by: formData.get('created_by')
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Játék neve:</label>
              <input
                type="text"
                name="name"
                defaultValue={editingGame.name}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Admin neve:</label>
              <input
                type="text"
                name="created_by"
                defaultValue={editingGame.created_by}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setEditingGame(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 
                       text-white font-bold py-2 px-4 rounded disabled:cursor-not-allowed"
            >
              {loading ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameEditModal;
