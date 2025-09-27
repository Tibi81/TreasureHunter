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
  const [gameConfig, setGameConfig] = React.useState({
    maxPlayers: 4,
    teamCount: 2
  });

  const getPlayerOptions = () => {
    if (gameConfig.teamCount === 1) {
      return [
        { value: 1, label: '1 játékos (választhat csapatot)' },
        { value: 2, label: '2 játékos (választhat csapatot)' },
        { value: 3, label: '3 játékos (választhat csapatot)' },
        { value: 4, label: '4 játékos (választhat csapatot)' },
        { value: 5, label: '5 játékos (választhat csapatot)' },
        { value: 6, label: '6 játékos (választhat csapatot)' },
        { value: 7, label: '7 játékos (választhat csapatot)' },
        { value: 8, label: '8 játékos (választhat csapatot)' }
      ];
    } else {
      return [
        { value: 2, label: '2 játékos (1-1 csapatonként)' },
        { value: 4, label: '4 játékos (2-2 csapatonként)' },
        { value: 6, label: '6 játékos (3-3 csapatonként)' },
        { value: 8, label: '8 játékos (4-4 csapatonként)' }
      ];
    }
  };

  const handleTeamCountChange = (count) => {
    setGameConfig(prev => ({
      ...prev,
      teamCount: count,
      maxPlayers: count === 1 ? Math.max(prev.maxPlayers, 1) : 
                 prev.maxPlayers % 2 === 0 ? prev.maxPlayers : prev.maxPlayers + 1
    }));
  };

  const handleCreateGameWithConfig = (e) => {
    e.preventDefault();
    handleCreateGame(e, gameConfig);
  };
  return (
    <div className="bg-black bg-opacity-60 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">
        Új játék létrehozása
      </h2>
      
      <form onSubmit={handleCreateGameWithConfig} className="space-y-6">
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

        <div>
          <label htmlFor="teamCount" className="block text-lg font-medium mb-3">
            Csapatok száma:
          </label>
          <select
            id="teamCount"
            value={gameConfig.teamCount}
            onChange={(e) => handleTeamCountChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     text-white"
          >
            <option value={1}>1 csapat (egyedül/együtt)</option>
            <option value={2}>2 csapat (verseny)</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block text-lg font-medium mb-3">
            Játékosok száma:
          </label>
          <select
            id="maxPlayers"
            value={gameConfig.maxPlayers}
            onChange={(e) => setGameConfig(prev => ({...prev, maxPlayers: parseInt(e.target.value)}))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     text-white"
          >
            {getPlayerOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {gameConfig.teamCount === 1 && (
          <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4">
            <p className="text-green-200 text-sm">
              ℹ️ Egy játékos játék - mindkét csapat elérhető, a játékos választhat
            </p>
          </div>
        )}
        {gameConfig.teamCount === 2 && (
          <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              ℹ️ Minden csapatban {gameConfig.maxPlayers / 2} játékos lesz
            </p>
          </div>
        )}

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
