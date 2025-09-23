// components/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { gameAPI } from '../services/api';
import GameList from './admin/GameList';
import GameCreate from './admin/GameCreate';
import GameManage from './admin/GameManage';
import GameEditModal from './admin/GameEditModal';
import PlayerAddModal from './admin/PlayerAddModal';

const AdminPanel = ({ onBack }) => {
  const [adminName, setAdminName] = useState('');
  const [gameName, setGameName] = useState('Halloween Kincskereső');
  const [currentGame, setCurrentGame] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list', 'create', 'manage'
  const [editingGame, setEditingGame] = useState(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('pumpkin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGames, setFilteredGames] = useState([]);

  // Játékok betöltése
  const loadGames = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gameAPI.listGames();
      setGames(response.games || []);
    } catch (err) {
      setError(err.message || 'Hiba a játékok betöltésében');
    } finally {
      setLoading(false);
    }
  }, []);

  // Játékok betöltése komponens mount-kor
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  // Keresés szűrése
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGames(games);
    } else {
      const filtered = games.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.game_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGames(filtered);
    }
  }, [games, searchTerm]);

  // Játék létrehozása
  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    // Alapvető frontend validáció (a részletes validáció a backend-ben történik)
    if (!adminName.trim()) {
      setError('Add meg az admin nevét!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await gameAPI.createGame(gameName, adminName.trim());
      setCurrentGame(response);
      setView('manage');
      await loadGames(); // Frissítsük a játékok listáját
    } catch (err) {
      setError(err.message || 'Hiba a játék létrehozásakor');
    } finally {
      setLoading(false);
    }
  };

  // Játék szerkesztése
  const handleEditGame = async (gameId, gameData) => {
    setLoading(true);
    setError('');
    try {
      await gameAPI.updateGame(gameId, gameData);
      await loadGames(); // Frissítsük a játékok listáját
      setEditingGame(null);
    } catch (err) {
      setError(err.message || 'Hiba a játék szerkesztésében');
    } finally {
      setLoading(false);
    }
  };

  // Játék törlése
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a játékot? Ez a művelet nem vonható vissza!')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await gameAPI.deleteGame(gameId);
      await loadGames(); // Frissítsük a játékok listáját
      if (currentGame && currentGame.id === gameId) {
        setCurrentGame(null);
        setView('list');
      }
    } catch (err) {
      setError(err.message || 'Hiba a játék törlésében');
    } finally {
      setLoading(false);
    }
  };

  // Játék leállítása
  const handleStopGame = async (gameId) => {
    setLoading(true);
    setError('');
    try {
      await gameAPI.stopGame(gameId);
      await loadGames(); // Frissítsük a játékok listáját
    } catch (err) {
      setError(err.message || 'Hiba a játék leállításában');
    } finally {
      setLoading(false);
    }
  };

  // Játék kiválasztása kezeléshez
  const handleSelectGame = (game) => {
    setCurrentGame(game);
    setView('manage');
  };

  // Játékos eltávolítása - javított verzió
  const handleRemovePlayer = async (gameId, playerId) => {
    if (!window.confirm('Biztosan eltávolítod ezt a játékost?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await gameAPI.removePlayer(gameId, playerId);
      
      // A response már tartalmazza a frissített játék adatokat
      if (response.game) {
        setCurrentGame(response.game);
      }
      
      // Frissítsük a játékok listáját is
      await loadGames();
      
      console.log(response.message || 'Játékos eltávolítva!');
    } catch (err) {
      setError(err.message || 'Hiba a játékos eltávolításában');
    } finally {
      setLoading(false);
    }
  };

  // Játékos áthelyezése
  const handleMovePlayer = async (gameId, playerId, newTeam) => {
    setLoading(true);
    setError('');
    try {
      await gameAPI.movePlayer(gameId, playerId, newTeam);
      await loadGames(); // Frissítsük a játékok listáját
      // Frissítsük a jelenlegi játékot is
      if (currentGame && currentGame.id === gameId) {
        const response = await gameAPI.getGameStatus(gameId);
        setCurrentGame(response.game);
      }
    } catch (err) {
      setError(err.message || 'Hiba a játékos áthelyezésében');
    } finally {
      setLoading(false);
    }
  };

  // Játékos hozzáadása
  const handleAddPlayer = async (gameId) => {
    if (!newPlayerName.trim()) {
      setError('Add meg a játékos nevét!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await gameAPI.addPlayer(gameId, newPlayerName.trim(), newPlayerTeam);
      setNewPlayerName('');
      setAddingPlayer(false);
      await loadGames(); // Frissítsük a játékok listáját
      // Frissítsük a jelenlegi játékot is
      if (currentGame && currentGame.id === gameId) {
        const response = await gameAPI.getGameStatus(gameId);
        setCurrentGame(response.game);
      }
    } catch (err) {
      setError(err.message || 'Hiba a játékos hozzáadásában');
    } finally {
      setLoading(false);
    }
  };

  // Játék indítása
  const handleStartGame = async () => {
    if (!currentGame) return;

    setLoading(true);
    setError('');

    try {
      const gameId = currentGame.id || currentGame.game?.id;
      if (!gameId) {
        setError('Játék azonosító nem található');
        return;
      }
      
      await gameAPI.startGame(gameId);
      // Frissítsük a játék állapotot
      const response = await gameAPI.getGameStatus(gameId);
      setCurrentGame(response.game);
      await loadGames(); // Frissítsük a játékok listáját
    } catch (err) {
      setError(err.message || 'Hiba a játék indításakor');
    } finally {
      setLoading(false);
    }
  };

  // Játék visszaállítása
  const handleResetGame = async () => {
    if (!currentGame) return;

    setLoading(true);
    setError('');

    try {
      const gameId = currentGame.id || currentGame.game?.id;
      if (!gameId) {
        setError('Játék azonosító nem található');
        return;
      }
      
      const response = await gameAPI.resetGame(gameId);
      setCurrentGame(response.game);
      await loadGames(); // Frissítsük a játékok listáját
    } catch (err) {
      setError(err.message || 'Hiba a játék visszaállításakor');
    } finally {
      setLoading(false);
    }
  };

  // Játék állapot frissítése - javított verzió
  const updateGameStatus = useCallback(async () => {
    if (!currentGame) return;

    try {
      // currentGame.id vagy currentGame.game.id - attól függően, hogy milyen formátumban van
      const gameId = currentGame.id || currentGame.game?.id;
      
      if (!gameId) {
        return;
      }
      
      const response = await gameAPI.getGameStatus(gameId);
      
      // Frissítsük a teljes játék adatokat, ne csak a game részt
      if (response.game) {
        setCurrentGame({
          ...response,
          id: response.game.id,
          game: response.game
        });
      }
    } catch (err) {
      console.error('Hiba a játék állapot frissítésében:', err);
      // Ne állítsuk be a hibát, mert az megszakítaná a frissítést
    }
  }, [currentGame]);

  // Automatikus frissítés - javított verzió
  useEffect(() => {
    if (!currentGame) return;
    
    const gameId = currentGame.id || currentGame.game?.id;
    if (!gameId) return;
    
    const interval = setInterval(async () => {
      try {
        // Frissítsük a jelenlegi játékot
        await updateGameStatus();
        
        // Frissítsük a játékok listáját is, hogy lássuk a változásokat
        await loadGames();
        
        // Ha a jelenlegi játék törlődött vagy megváltozott, frissítsük
        const updatedGames = await gameAPI.listGames();
        const updatedCurrentGame = updatedGames.games?.find(g => g.id === gameId);
        if (updatedCurrentGame && updatedCurrentGame !== currentGame) {
          setCurrentGame(updatedCurrentGame);
        }
      } catch (error) {
        console.error('Hiba a játék állapot frissítésében:', error.message);
        // Ne dobj tovább a hibát, hanem logold csak
      }
    }, 5000); // 5 másodperc - gyorsabb frissítés
    
    return () => clearInterval(interval);
  }, [currentGame, updateGameStatus, loadGames]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-orange-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Fejléc */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-400 mb-2">
            🛠️ Admin Felület
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Játékok kezelése és létrehozása
          </p>
          <button
            onClick={loadGames}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600
                     text-white px-4 py-2 rounded-lg font-semibold
                     transition-all duration-200 disabled:cursor-not-allowed
                     flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Frissítés...
              </>
            ) : (
              <>
                🔄 Frissítés
              </>
            )}
          </button>
        </div>

        {/* Hibaüzenet */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 text-center max-w-md mx-auto">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 underline"
            >
              Bezárás
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Navigáció */}
          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={() => setView('list')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                view === 'list' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              📋 Játékok listája
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                view === 'create' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              ➕ Új játék
            </button>
            {currentGame && (
              <button
                onClick={() => setView('manage')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                  view === 'manage' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                ⚙️ Játék kezelése
              </button>
            )}
          </div>

          {/* Játékok listája */}
          {view === 'list' && (
            <div className="space-y-6">
              <div className="bg-black bg-opacity-60 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-orange-400">
                    Játékok listája ({filteredGames.length})
                  </h2>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Keresés játékok között..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
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
                      <div key={game.id} className="bg-gray-800 bg-opacity-60 rounded-lg p-4 border border-gray-600">
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-orange-400 mb-2">{game.name}</h3>
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
          )}

          {/* Új játék létrehozása */}
          {view === 'create' && (
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
          )}

          {/* Játék kezelése */}
          {view === 'manage' && currentGame && (
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
          )}

          {/* Játék szerkesztése modal */}
          {editingGame && (
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
          )}

          {/* Játékos hozzáadása modal */}
          {addingPlayer && (
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
          )}

          {/* Vissza gomb */}
          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-500 
                       text-white font-bold py-3 px-6 rounded-lg 
                       transition-all duration-200"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
