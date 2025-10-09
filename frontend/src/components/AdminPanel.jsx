// components/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { gameAPI } from '../services/api';
import GameList from './admin/GameList';
import GameCreate from './admin/GameCreate';
import GameManage from './admin/GameManage';
import GameEditModal from './admin/GameEditModal';
import PlayerAddModal from './admin/PlayerAddModal';
import ProgressDisplay from './ProgressDisplay';

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

  // Globális frissítés a játékok listájához (5 másodpercenként)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await gameAPI.listGames();
        setGames(response.games || []);
      } catch (error) {
        console.error('Hiba a játékok listájának frissítésében:', error.message);
      }
    }, 5000); // 5 másodperc - gyors frissítés a játékok listájához
    
    return () => clearInterval(interval);
  }, []);

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
  const handleCreateGame = async (e, gameConfig = null) => {
    e.preventDefault();
    
    // Alapvető frontend validáció (a részletes validáció a backend-ben történik)
    if (!adminName.trim()) {
      setError('Add meg az admin nevét!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await gameAPI.createGame(
        gameName, 
        adminName.trim(),
        gameConfig?.maxPlayers || 4,
        gameConfig?.teamCount || 2
      );
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

  // Játék állapot frissítése - javított verzió (villogás nélkül)
  const updateGameStatus = useCallback(async () => {
    if (!currentGame) return;

    try {
      const gameId = currentGame.id || currentGame.game?.id;
      if (!gameId) return;
      
      const response = await gameAPI.getGameStatus(gameId);
      
      if (response.game) {
        setCurrentGame({
          ...response,
          id: response.game.id,
          game: response.game
        });
      }
    } catch (err) {
      console.error('Hiba a játék állapot frissítésében:', err);
    }
  }, [currentGame]);

  // Automatikus frissítés - gyorsabb verzió (3 másodperces intervallum, villogás nélkül)
  useEffect(() => {
    if (!currentGame) return;
    
    const gameId = currentGame.id || currentGame.game?.id;
    if (!gameId) return;
    
    const interval = setInterval(async () => {
      try {
        await updateGameStatus();
        // Csak a játékok listáját frissítjük, ha szükséges
        const updatedGames = await gameAPI.listGames();
        const updatedCurrentGame = updatedGames.games?.find(g => g.id === gameId);
        if (updatedCurrentGame && JSON.stringify(updatedCurrentGame) !== JSON.stringify(currentGame)) {
          setCurrentGame(updatedCurrentGame);
        }
      } catch (error) {
        console.error('Hiba a játék állapot frissítésében:', error.message);
      }
    }, 3000); // 3 másodperc - gyorsabb frissítés, de nem villog
    
    return () => clearInterval(interval);
  }, [currentGame, updateGameStatus]);


  return (
    <div className=" text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Fejléc */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-400 mb-2">
              🛠️ Admin Felület
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Játékok kezelése és létrehozása
            </p>
            
            {/* Navigációs gombok 2x2 grid elrendezésben - függőleges kártyák */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
            {/* Frissítés gomb */}
            <button
              onClick={loadGames}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs">Frissítés...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🔄</span>
                  <span className="text-xs">Frissítés</span>
                </>
              )}
            </button>

            {/* Játékok listája gomb */}
            <button
              onClick={() => setView('list')}
              className={`flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
                view === 'list' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white'
              }`}
            >
              <span className="text-xl">📋</span>
              <span className="text-xs">Játékok listája</span>
            </button>

            {/* Új játék gomb */}
            <button
              onClick={() => setView('create')}
              className={`flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
                view === 'create' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white'
              }`}
            >
              <span className="text-xl">➕</span>
              <span className="text-xs">Új játék</span>
            </button>

            {/* Játékok kezelése gomb */}
            <button
              onClick={() => setView('manage')}
              disabled={!currentGame}
              className={`flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
                view === 'manage' && currentGame
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white' 
                  : currentGame
                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white'
                    : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-xl">⚙️</span>
              <span className="text-xs">Játékok kezelése</span>
            </button>
          </div>
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

AdminPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default AdminPanel;
