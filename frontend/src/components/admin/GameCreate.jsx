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
    <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-orange-500/20">
      <h2 className="text-3xl font-extrabold text-orange-400 mb-6 text-center font-spooky drop-shadow-glow-orange">
        Új játék létrehozása
      </h2>
      
      <form onSubmit={handleCreateGameWithConfig} className="space-y-6">
        <div>
          <label htmlFor="adminName" className="block text-xl font-bold mb-3 text-orange-300 font-spooky">
            Admin neve:
          </label>
          <input
            type="text"
            id="adminName"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border-2 border-orange-400 rounded-xl 
                     focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     text-white placeholder-gray-400 font-spooky transition-all duration-200"
            placeholder="Add meg a neved..."
            required
          />
        </div>

        <div>
          <label htmlFor="gameName" className="block text-xl font-bold mb-3 text-orange-300 font-spooky">
            Játék neve:
          </label>
          <input
            type="text"
            id="gameName"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="w-full px-4 py-4 bg-gray-800 border-2 border-orange-400 rounded-xl 
                     focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     text-white placeholder-gray-400 font-spooky transition-all duration-200"
            placeholder="Halloween Kincskereső"
          />
        </div>

        <div>
          <label htmlFor="teamCount" className="block text-xl font-bold mb-3 text-orange-300 font-spooky">
            Csapatok száma:
          </label>
          <select
            id="teamCount"
            value={gameConfig.teamCount}
            onChange={(e) => handleTeamCountChange(parseInt(e.target.value))}
            className="w-full px-4 py-4 bg-gray-800 border-2 border-orange-400 rounded-xl 
                     focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     text-white font-spooky transition-all duration-200"
          >
            <option value={1}>1 csapat (egyedül/együtt)</option>
            <option value={2}>2 csapat (verseny)</option>
          </select>
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block text-xl font-bold mb-3 text-orange-300 font-spooky">
            Játékosok száma:
          </label>
          <select
            id="maxPlayers"
            value={gameConfig.maxPlayers}
            onChange={(e) => setGameConfig(prev => ({...prev, maxPlayers: parseInt(e.target.value)}))}
            className="w-full px-4 py-4 bg-gray-800 border-2 border-orange-400 rounded-xl 
                     focus:ring-2 focus:ring-orange-400 focus:border-transparent
                     text-white font-spooky transition-all duration-200"
          >
            {getPlayerOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {gameConfig.teamCount === 1 && (
          <div className="bg-gradient-to-b from-green-900/50 to-green-800/50 border border-green-500/50 rounded-xl p-4">
            <p className="text-green-200 text-sm font-spooky">
              ℹ️ Egy játékos játék - mindkét csapat elérhető, a játékos választhat
            </p>
          </div>
        )}
        {gameConfig.teamCount === 2 && (
          <div className="bg-gradient-to-b from-blue-900/50 to-blue-800/50 border border-blue-500/50 rounded-xl p-4">
            <p className="text-blue-200 text-sm font-spooky">
              ℹ️ Minden csapatban {gameConfig.maxPlayers / 2} játékos lesz
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 
                     text-white font-bold py-4 px-6 rounded-xl 
                     transition-all duration-200 transform hover:scale-105
                     shadow-md hover:shadow-gray-400/40 font-spooky"
          >
            Vissza
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 
                     hover:from-green-500 hover:to-blue-500 
                     disabled:from-gray-600 disabled:to-gray-700
                     text-white font-bold py-4 px-6 rounded-xl 
                     transition-all duration-200 disabled:cursor-not-allowed
                     transform hover:scale-105 shadow-md hover:shadow-green-400/40 font-spooky"
          >
            {loading ? 'Létrehozás...' : 'Játék létrehozása'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameCreate;
