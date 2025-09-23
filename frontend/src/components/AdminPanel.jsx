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
            <GameList
              games={games}
              filteredGames={filteredGames}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              loadGames={loadGames}
              handleSelectGame={handleSelectGame}
              setEditingGame={setEditingGame}
              handleStopGame={handleStopGame}
              handleDeleteGame={handleDeleteGame}
              setView={setView}
            />
          )}

          {/* Új játék létrehozása */}
          {view === 'create' && (
            <GameCreate
              adminName={adminName}
              setAdminName={setAdminName}
              gameName={gameName}
              setGameName={setGameName}
              loading={loading}
              handleCreateGame={handleCreateGame}
              setView={setView}
            />
          )}

          {/* Játék kezelése */}
          {view === 'manage' && currentGame && (
            <GameManage
              currentGame={currentGame}
              loading={loading}
              setAddingPlayer={setAddingPlayer}
              handleMovePlayer={handleMovePlayer}
              handleRemovePlayer={handleRemovePlayer}
              handleStartGame={handleStartGame}
              handleResetGame={handleResetGame}
              setView={setView}
            />
          )}

          {/* Játék szerkesztése modal */}
          <GameEditModal
            editingGame={editingGame}
            setEditingGame={setEditingGame}
            loading={loading}
            handleEditGame={handleEditGame}
          />

          {/* Játékos hozzáadása modal */}
          <PlayerAddModal
            addingPlayer={addingPlayer}
            setAddingPlayer={setAddingPlayer}
            newPlayerName={newPlayerName}
            setNewPlayerName={setNewPlayerName}
            newPlayerTeam={newPlayerTeam}
            setNewPlayerTeam={setNewPlayerTeam}
            loading={loading}
            handleAddPlayer={handleAddPlayer}
            currentGame={currentGame}
          />

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
