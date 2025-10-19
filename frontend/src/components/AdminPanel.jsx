// components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGames, 
  useCreateGame, 
  useDeleteGame, 
  useStopGame, 
  useStartGame, 
  useResetGame,
  useAddPlayer,
  useRemovePlayer,
  useMovePlayer,
  useUpdateGame,
  gameKeys
} from '../hooks/useGameAPI';
import { useGeneralSSE } from '../hooks/useSSE';
import GameList from './admin/GameList';
import GameCreate from './admin/GameCreate';
import GameManage from './admin/GameManage';
import GameEditModal from './admin/GameEditModal';
import PlayerAddModal from './admin/PlayerAddModal';

const AdminPanel = ({ onBack }) => {
  const queryClient = useQueryClient();
  
  const [adminName, setAdminName] = useState('');
  const [gameName, setGameName] = useState('Halloween Kincskereső');
  const [currentGame, setCurrentGame] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [editingGame, setEditingGame] = useState(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTeam, setNewPlayerTeam] = useState('pumpkin');
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks
  const { data: games = [], isLoading: gamesLoading, error: gamesError } = useGames();
  
  // ✅ DEBUG: Games data logging
  React.useEffect(() => {
    console.log('🔍 AdminPanel - games data changed:', games);
    console.log('🔍 AdminPanel - games length:', games.length);
    games.forEach((game, index) => {
      console.log(`🔍 AdminPanel - game ${index}:`, {
        id: game.id,
        name: game.name,
        total_players: game.total_players,
        players: game.players,
        teams: game.teams
      });
    });
  }, [games]);

  // ✅ DEBUG: QueryClient cache monitoring
  React.useEffect(() => {
    const interval = setInterval(() => {
      const cache = queryClient.getQueryData(gameKeys.lists());
      console.log('🔍 AdminPanel - Cache check:', {
        cacheExists: !!cache,
        cacheLength: cache?.length || 0,
        cacheData: cache
      });
    }, 2000); // Minden 2 másodpercben ellenőrizzük

    return () => clearInterval(interval);
  }, [queryClient]);

  // ✅ POLLING kikapcsolva - IDEIGLENESEN KIKAPCSOLVA
  // React.useEffect(() => {
  //   console.log('🔄 AdminPanel - Polling started (every 1 second)');
  //   const interval = setInterval(() => {
  //     console.log('🔄 AdminPanel - Polling refresh triggered');
  //     queryClient.refetchQueries({ queryKey: gameKeys.lists() });
  //   }, 1000);

  //   return () => {
  //     console.log('🔄 AdminPanel - Polling stopped');
  //     clearInterval(interval);
  //   };
  // }, [queryClient]);

  // ✅ SSE kapcsolat azonnali frissítésekhez
  const { isConnected: sseConnected } = useGeneralSSE({
    enabled: true, // ✅ SSE VISSZAÁLLÍTVA
    onMessage: (data) => {
      console.log('🎮 AdminPanel SSE üzenet:', data);
      // Az SSE hook automatikusan frissíti a cache-t
    }
  });
  const createGameMutation = useCreateGame();
  const deleteGameMutation = useDeleteGame();
  const stopGameMutation = useStopGame();
  const startGameMutation = useStartGame();
  const resetGameMutation = useResetGame();
  const addPlayerMutation = useAddPlayer();
  const removePlayerMutation = useRemovePlayer();
  const movePlayerMutation = useMovePlayer();
  const updateGameMutation = useUpdateGame();


  // Szűrt játékok
  const filteredGames = games.filter(game => 
    !searchTerm.trim() || 
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.game_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ currentGame szinkronizálása a games listával - JAVÍTOTT
  useEffect(() => {
    if (currentGame && games.length > 0) {
      const updatedGame = games.find(g => g.id === currentGame.id);
      if (updatedGame) {
        // Csak akkor frissítjük, ha ténylegesen változott
        if (JSON.stringify(updatedGame) !== JSON.stringify(currentGame)) {
          console.log('🔄 Updating currentGame with fresh data from games list');
          setCurrentGame(updatedGame);
        }
      } else {
        // Ha a játék már nem létezik a listában (törölve lett)
        console.log('Játék már nem létezik a listában, visszatérés a listához');
        setCurrentGame(null);
        if (view === 'manage') {
          setView('list');
        }
      }
    }
  }, [games, currentGame?.id, view]); // ✅ JAVÍTOTT: currentGame.id helyett currentGame

  // Hiba kezelése
  useEffect(() => {
    if (gamesError) {
      setError(gamesError.message || 'Hiba a játékok betöltésében');
    }
  }, [gamesError]);

  // Manuális cache frissítés függvény - EGYSZERŰSÍTETT
  const refreshGames = () => {
    try {
      console.log('🔄 Manual cache refresh triggered...');
      // ✅ JAVÍTOTT: refetchQueries azonnali API hívást indít
      queryClient.refetchQueries({ queryKey: gameKeys.lists() });
    } catch (err) {
      console.error('Hiba a frissítésben:', err);
      setError('Hiba történt a frissítés során');
    }
  };

  // Játék létrehozása
  const handleCreateGame = async (e, gameConfig = null) => {
    e.preventDefault();
    
    if (!adminName.trim()) {
      setError('Add meg az admin nevét!');
      return;
    }

    setError('');

    try {
      const response = await createGameMutation.mutateAsync({
        gameName,
        adminName: adminName.trim(),
        maxPlayers: gameConfig?.maxPlayers || 4,
        teamCount: gameConfig?.teamCount || 2
      });
      
      // ✅ A response.game-t használjuk currentGame-ként
      setCurrentGame(response.game);
      setView('manage');
    } catch (err) {
      console.error('Játék létrehozási hiba:', err);
      setError(err.message || 'Hiba a játék létrehozásakor');
    }
  };

  // Játék szerkesztése
  const handleEditGame = async (gameId, gameData) => {
    setError('');
    try {
      await updateGameMutation.mutateAsync({ gameId, gameData });
      setEditingGame(null);
    } catch (err) {
      console.error('Játék szerkesztési hiba:', err);
      setError(err.message || 'Hiba a játék szerkesztésében');
    }
  };

  // Játék törlése
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a játékot? Ez a művelet nem vonható vissza!')) {
      return;
    }

    setError('');

    try {
      await deleteGameMutation.mutateAsync(gameId);
      
      if (currentGame && currentGame.id === gameId) {
        setCurrentGame(null);
        setView('list');
      }
      
      console.log('Játék sikeresen törölve!');
    } catch (err) {
      console.error('Játék törlési hiba:', err);
      // Ha 404 hiba, a játék már nem létezik
      if (err.status === 404) {
        console.log('Játék már nem létezik');
        setError('');
        if (currentGame && currentGame.id === gameId) {
          setCurrentGame(null);
          setView('list');
        }
      } else {
        setError(err.message || 'Hiba a játék törlésében');
      }
    }
  };

  // Játék leállítása
  const handleStopGame = async (gameId) => {
    setError('');

    try {
      await stopGameMutation.mutateAsync(gameId);
      console.log('Játék sikeresen leállítva!');
    } catch (err) {
      console.error('Játék leállítási hiba:', err);
      // Ha 404 hiba, a játék már nem létezik
      if (err.status === 404) {
        console.log('Játék már nem létezik');
        setError('');
        if (currentGame && currentGame.id === gameId) {
          setCurrentGame(null);
          setView('list');
        }
      } else {
        setError(err.message || 'Hiba a játék leállításában');
      }
    }
  };

  // Játék kiválasztása kezeléshez
  const handleSelectGame = (game) => {
    try {
      setCurrentGame(game);
      setView('manage');
    } catch (err) {
      console.error('Játék kiválasztási hiba:', err);
      setError('Hiba a játék kiválasztásában');
    }
  };

  // Játékos eltávolítása
  const handleRemovePlayer = async (gameId, playerId) => {
    if (!window.confirm('Biztosan eltávolítod ezt a játékost?')) {
      return;
    }

    setError('');

    try {
      await removePlayerMutation.mutateAsync({ gameId, playerId });
      console.log('Játékos sikeresen eltávolítva!');
    } catch (err) {
      console.error('Játékos eltávolítási hiba:', err);
      setError(err.message || 'Hiba a játékos eltávolításában');
    }
  };

  // Játékos áthelyezése
  const handleMovePlayer = async (gameId, playerId, newTeam) => {
    setError('');

    try {
      await movePlayerMutation.mutateAsync({ gameId, playerId, newTeam });
      console.log('Játékos sikeresen áthelyezve!');
    } catch (err) {
      console.error('Játékos áthelyezési hiba:', err);
      setError(err.message || 'Hiba a játékos áthelyezésében');
    }
  };

  // Játékos hozzáadása
  const handleAddPlayer = async (gameId) => {
    if (!newPlayerName.trim()) {
      setError('Add meg a játékos nevét!');
      return;
    }

    setError('');

    try {
      await addPlayerMutation.mutateAsync({ 
        gameId, 
        playerName: newPlayerName.trim(), 
        teamName: newPlayerTeam 
      });
      setNewPlayerName('');
      setAddingPlayer(false);
      console.log('Játékos sikeresen hozzáadva!');
    } catch (err) {
      console.error('Játékos hozzáadási hiba:', err);
      setError(err.message || 'Hiba a játékos hozzáadásában');
    }
  };

  // Játék indítása
  const handleStartGame = async () => {
    if (!currentGame) return;

    setError('');

    try {
      const gameId = currentGame.id || currentGame.game?.id;
      if (!gameId) {
        setError('Játék azonosító nem található');
        return;
      }
      
      await startGameMutation.mutateAsync(gameId);
      console.log('Játék sikeresen elindítva!');
    } catch (err) {
      console.error('Játék indítási hiba:', err);
      setError(err.message || 'Hiba a játék indításakor');
    }
  };

  // Játék visszaállítása
  const handleResetGame = async () => {
    if (!currentGame) return;

    setError('');

    try {
      const gameId = currentGame.id || currentGame.game?.id;
      if (!gameId) {
        setError('Játék azonosító nem található');
        return;
      }
      
      const response = await resetGameMutation.mutateAsync(gameId);
      setCurrentGame(response.game);
    } catch (err) {
      console.error('Játék visszaállítási hiba:', err);
      setError(err.message || 'Hiba a játék visszaállításakor');
    }
  };

  // Loading állapot összesítése
  const loading = gamesLoading || 
    createGameMutation.isPending || 
    deleteGameMutation.isPending || 
    stopGameMutation.isPending || 
    startGameMutation.isPending || 
    resetGameMutation.isPending || 
    addPlayerMutation.isPending || 
    removePlayerMutation.isPending || 
    movePlayerMutation.isPending ||
    updateGameMutation.isPending;

  return (
    <div className="text-white overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 overflow-x-hidden">
        <div className="max-w-2xl mx-auto overflow-x-hidden">
          {/* Fejléc */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-400 mb-2">
              🛠️ Admin Felület
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Játékok kezelése és létrehozása
            </p>
            
            {/* ✅ SSE kapcsolat státusz - IDEIGLENESEN KIKAPCSOLVA */}
            {/* <div className="flex items-center justify-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">
                SSE: {sseConnected ? 'Csatlakozva' : 'Kapcsolat megszakadt'}
              </span>
            </div> */}
            
            {/* Navigációs gombok */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6">
              {/* Frissítés gomb */}
              <button
                onClick={refreshGames}
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
                className={`flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
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
                className={`flex flex-col items-center justify-center gap-2 min-h-[120px] sm:min-h-[140px] w-full p-3 sm:p-4 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
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
                className="ml-4 underline hover:text-gray-200"
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

          {/* SSE kapcsolat státusza */}
          <div className="text-center mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              sseConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                sseConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {sseConnected ? 'SSE Kapcsolat Aktív' : 'SSE Kapcsolat Megszakadt'}
            </div>
          </div>

          {/* Vissza gomb */}
          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="btn-secondary"
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