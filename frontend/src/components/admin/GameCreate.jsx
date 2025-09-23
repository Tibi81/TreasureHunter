// components/admin/GameCreate.jsx
import React from 'react';

const GameCreate = ({ 
  adminName, 
  setAdminName, 
  gameName, 
  setGameName, 
  loading, 
  handleCreateGame, 
  setView 
}) => {
  return (
    <div className="bg-black bg-opacity-60 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">
        Új játék létrehozása
      </h2>
      
      <form onSubmit={handleCreateGame} className="space-y-6">
        <div>
          <label htmlFor="adminName" className="block text-lg font-medium mb-3">
            Admin neve:
          </label>
          <input
            type="text"
            id="adminName"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     text-white placeholder-gray-400"
            placeholder="Add meg a neved..."
            required
          />
        </div>

        <div>
          <label htmlFor="gameName" className="block text-lg font-medium mb-3">
            Játék neve:
          </label>
          <input
            type="text"
            id="gameName"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     text-white placeholder-gray-400"
            placeholder="Halloween Kincskereső"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex-1 bg-gray-600 hover:bg-gray-500 
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition-all duration-200"
          >
            Vissza
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 
                     hover:from-green-500 hover:to-blue-500 
                     disabled:from-gray-600 disabled:to-gray-600
                     text-white font-bold py-3 px-6 rounded-lg 
                     transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Létrehozás...' : 'Játék létrehozása'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameCreate;
