/* eslint-disable no-unused-vars */
// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Welcome from './components/Welcome';
import PlayerRegistration from './components/PlayerRegistration';
import AdminPanel from './components/AdminPanel';
import ProgressDisplay from './components/ProgressDisplay';
import ChallengePanel from './components/ChallengePanel';
import GameResults from './components/GameResults';
import GameExitDialog from './components/GameExitDialog';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { gameAPI } from './services/api';
import './App.css';

// React Query client konfigurálása - OPTIMALIZÁLT azonnali frissítéshez
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000, // 1 másodperc - gyors frissítés
      cacheTime: 2 * 60 * 1000, // 2 perc cache
      refetchOnWindowFocus: true, // ✅ Frissítés ablak fókuszban
      refetchOnMount: 'always', // ✅ Mindig friss adat
      refetchInterval: 1000, // ✅ 1 másodperc polling - AZONNALI frissítés
      refetchIntervalInBackground: true, // ✅ Háttérben is frissít
      retry: 1,
    },
    mutations: {
      retry: 0, // ✅ Mutation-ök ne próbálkozzanak újra
    },
  },
});

function App() {
  const [appState, setAppState] = useState('welcome'); // welcome, registration, admin, game, finished
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [toasts, setToasts] = useState([]);
  const [gameState, setGameState] = useState({
    gameId: null,
    gameName: null,
    status: 'setup', // waiting, setup, separate, together, finished
    currentPlayer: null,
    teams: [],
    players: [],
    gameInfo: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Toast hozzáadása
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Toast eltávolítása
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Session ellenőrzése az oldal betöltésekor
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Először próbáljuk a régi session ellenőrzést
        const response = await gameAPI.checkPlayerSession();
        if (response.has_session) {
          // Ha van aktív session, állítsuk vissza a játékot
          setGameState(prev => ({
            ...prev,
            gameId: response.game.id,
            gameName: response.game.name,
            status: response.game.status,
            teams: response.teams,
            players: response.players,
            gameInfo: response.game_info,
            currentPlayer: response.current_player
          }));
          setAppState('game');
        }
      } catch (err) {
        console.log('Nincs aktív session:', err.message);
        
        // Ha nincs session, próbáljuk a session token alapú visszacsatlakozást
        const sessionToken = localStorage.getItem('session_token');
        if (sessionToken) {
          try {
            const restoreResponse = await gameAPI.restoreSession(sessionToken);
            if (restoreResponse.player) {
              // Ha sikerült a visszacsatlakozás, állítsuk vissza a játékot
              setGameState(prev => ({
                ...prev,
                gameId: restoreResponse.game.id,
                gameName: restoreResponse.game.name,
                status: restoreResponse.game.status,
                teams: restoreResponse.teams,
                players: restoreResponse.players,
                gameInfo: restoreResponse.game_info,
                currentPlayer: restoreResponse.player
              }));
              setAppState('game');
              setPlayerName(restoreResponse.player.name);
            }
          } catch (restoreError) {
            console.log('Session token érvénytelen:', restoreError.message);
            // Ha a token érvénytelen, töröljük a localStorage-ból
            localStorage.removeItem('session_token');
          }
        }
      }
    };

    checkSession();
  }, []);

  // Játék állapot frissítése
  const updateGameStatus = useCallback(async () => {
    if (!gameState.gameId) return;
    
    try {
      const response = await gameAPI.getGameStatus(gameState.gameId);
      
      // A backend már feldolgozta az adatokat, csak beállítjuk
      setGameState(prev => ({
        ...prev,
        gameName: response.game.name,
        status: response.game.status,
        teams: response.teams,
        players: response.players,
        gameInfo: response.game_info
      }));
    } catch (err) {
      setError('Hiba a játék állapot frissítésében');
    }
  }, [gameState.gameId]);


  // Automatikus frissítés - csak játék indítás után - optimalizált verzió
  useEffect(() => {
    if (gameState.gameId && gameState.status !== 'finished' && 
        gameState.status !== 'setup' && gameState.status !== 'waiting') {
      const interval = setInterval(async () => {
        try {
          await updateGameStatus();
        } catch (error) {
          console.error('Hiba a játék frissítésében:', error.message);
          // Ne dobj tovább a hibát, hanem logold csak
        }
      }, 10000); // 10 másodperc - optimalizált gyakoriság

      return () => clearInterval(interval);
    }
  }, [gameState.gameId, gameState.status, updateGameStatus]);

  // Setup állapot kezelése - csak játék állapot frissítés - optimalizált verzió
  useEffect(() => {
    if (gameState.gameId && gameState.status === 'setup') {
      const interval = setInterval(async () => {
        try {
          await updateGameStatus();
        } catch (error) {
          console.error('Hiba a setup frissítésében:', error.message);
          // Ne dobj tovább a hibát, hanem logold csak
        }
      }, 5000); // 5 másodperc - optimalizált gyakoriság

      return () => clearInterval(interval);
    }
  }, [gameState.gameId, gameState.status, updateGameStatus]);

  // Játék kód megadása kezelése - egyszerűsített verzió
  const handleGameCodeSubmit = async (gameCode) => {
    console.log('handleGameCodeSubmit called with:', gameCode);
    
    if (gameCode === 'ADMIN') {
      setAppState('admin');
      return;
    }

    setError('');

    // Ellenőrizzük, hogy van-e session token ehhez a játékhoz
    const sessionToken = localStorage.getItem('session_token');
    console.log('Session token from localStorage:', sessionToken);
    if (sessionToken) {
      try {
        const restoreResponse = await gameAPI.restoreSession(sessionToken);
        console.log('Restore response:', restoreResponse);
        if (restoreResponse.player && restoreResponse.game) {
          // Ha van érvényes session token, visszacsatlakozunk
          setGameState(prev => ({
            ...prev,
            gameId: restoreResponse.game.id,
            gameName: restoreResponse.game.name,
            status: restoreResponse.game.status,
            teams: restoreResponse.teams,
            players: restoreResponse.players,
            gameInfo: restoreResponse.game_info,
            currentPlayer: restoreResponse.player
          }));
          setAppState('game');
          setPlayerName(restoreResponse.player.name);
          addToast('Üdvözöllek újra a játékban!', 'success');
          return;
        } else {
          console.log('Session token nem ehhez a játékhoz tartozik');
          localStorage.removeItem('session_token');
        }
      } catch (restoreError) {
        console.log('Session token érvénytelen:', restoreError.message);
        // Ha a token érvénytelen, töröljük a localStorage-ból
        localStorage.removeItem('session_token');
      }
    }
    
    // Ha nincs érvényes session token, folytatjuk a regisztrációval
    setGameCode(gameCode);
    setAppState('registration');
  };

  // Játékos regisztráció - teljesen optimalizált verzió
  const handlePlayerJoin = async (gameId, playerName, teamName) => {
    setLoading(true);
    setError('');
    
    try {
      // Játékos csatlakoztatása
      const response = await gameAPI.joinGame(gameId, playerName, teamName);
      
      // Session token mentése localStorage-ba
      if (response.session_token) {
        localStorage.setItem('session_token', response.session_token);
      }
      
      // Csak a szükséges állapotot frissítjük
      setGameState(prev => ({
        ...prev,
        gameId,
        currentPlayer: {
          name: playerName,
          team: teamName
        }
      }));

      setAppState('game');
      
      // Egyszeri játék állapot frissítés a csatlakozás után
      try {
        await updateGameStatus();
      } catch (err) {
        console.error('Hiba a játék állapot frissítésében:', err.message);
        // Ne dobj hibát, a polling majd frissíti
      }
      
      addToast('Sikeresen csatlakoztál a játékhoz!', 'success');
      
    } catch (err) {
      setError(err.message || 'Hiba a csatlakozáskor');
    } finally {
      setLoading(false);
    }
  };

  // Vissza a kezdőlapra
  const handleBackToWelcome = () => {
    setAppState('welcome');
    setPlayerName('');
    setGameCode('');
    setGameState({
      gameId: null,
      status: 'setup',
      currentPlayer: null,
      teams: [],
      players: []
    });
    setError('');
    // Toast-ok törlése
    setToasts([]);
  };


  // Játék visszaállítása
  const handleGameReset = async () => {
    if (!gameState.gameId) return;

    setLoading(true);
    setError('');

    try {
      const response = await gameAPI.resetGame(gameState.gameId);
      
      // Frissítjük a játék állapotot
      setGameState(prev => ({
        ...prev,
        status: response.game.status,
        teams: response.teams,
        players: response.players,
        currentPlayer: null // Kijelentkeztetjük a jelenlegi játékost
      }));

      setError('');
      addToast('Játék sikeresen visszaállítva!', 'success');
    } catch (err) {
      setError(err.message || 'Hiba a játék visszaállításakor');
    } finally {
      setLoading(false);
    }
  };

  // Kilépés a játékból - javított verzió toast-okkal
  const handleGameExit = async (exitType = 'exit') => {
    setLoading(true);
    setError('');
    
    try {
      if (exitType === 'logout') {
        // Végleges kilépés - token törlése
        await gameAPI.logoutPlayer();
        localStorage.removeItem('session_token');
        // Toast hozzáadása a sikeres művelet után, de az állapot törlése előtt
        addToast('Sikeresen kijelentkeztél - nem térhetsz vissza ebbe a játékba', 'success');
      } else {
        // Szüneteltetés - token megmarad
        await gameAPI.exitGame();
        // Toast hozzáadása a sikeres művelet után, de az állapot törlése előtt
        addToast('Játék szüneteltetve - később folytathatod ugyanitt', 'success');
      }
      
      // Frontend állapot törlése mindkét esetben - toast után
      setAppState('welcome');
      setPlayerName('');
      setGameState({
        gameId: null,
        status: 'setup',
        currentPlayer: null,
        teams: [],
        players: []
      });
      setError('');
      
    } catch (err) {
      console.error('Hiba a kilépéskor:', err.message);
      addToast('Hiba történt a kilépéskor', 'error');
      // Hiba esetén is töröljük az állapotot
      setAppState('welcome');
      setPlayerName('');
      setGameState({
        gameId: null,
        status: 'setup',
        currentPlayer: null,
        teams: [],
        players: []
      });
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // Render logika
  const renderContent = () => {
    switch (appState) {
      case 'welcome':
        return <Welcome onGameCodeSubmit={handleGameCodeSubmit} />;
      
      case 'registration':
        return (
          <PlayerRegistration 
            gameCode={gameCode}
            onJoinGame={handlePlayerJoin}
            onBack={handleBackToWelcome}
          />
        );
      
      case 'admin':
        return (
          <ErrorBoundary>
            <AdminPanel onBack={handleBackToWelcome} />
          </ErrorBoundary>
        );
      
      case 'game':
        // Ha a játék befejeződött
        if (gameState.status === 'finished') {
          return (
            <GameResults 
              gameId={gameState.gameId}
              onRestart={handleBackToWelcome}
            />
          );
        }

        // Aktív játék
        return (
          <div className="game-container">
            <ProgressDisplay 
              gameId={gameState.gameId}
              showAllTeams={true}
            />
            
            <ChallengePanel
              gameId={gameState.gameId}
              teamName={gameState.currentPlayer?.team_name || gameState.currentPlayer?.team}
              gameStatus={gameState.status}
            />
          </div>
        );
      
      default:
        return <Welcome onGameCodeSubmit={handleGameCodeSubmit} />;
    }
  };

  // Ha welcome, registration vagy admin állapotban vagyunk, ne jelenítsük meg a header-t
  if (appState === 'welcome' || appState === 'registration' || appState === 'admin') {
    return (
      <div className="min-h-screen text-white">
        {/* Toast-ok megjelenítése */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* Toast-ok megjelenítése */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <header className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="order-2 sm:order-1 flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-orange-400">
                🎃 Halloween Kincskereső 👻
              </h1>
              {gameState.currentPlayer && (
                <p className="text-sm sm:text-lg mt-2">
                  {gameState.currentPlayer.name} - {
                    gameState.currentPlayer.team === 'pumpkin' ? '🎃 Tök Csapat' : '👻 Szellem Csapat'
                  }
                </p>
              )}
            </div>
            <div className="order-1 sm:order-2 flex justify-center sm:justify-end">
              {gameState.gameId && (
                <button
                  onClick={() => setShowExitDialog(true)}
                  disabled={loading}
                  className="btn-secondary text-xs sm:text-sm"
                >
                  <span className="text-sm">🚪</span>
                  <span>Kilépés</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* GameExitDialog modal - a header-en kívül, hogy megfelelően működjön */}
      {gameState.gameId && (
        <GameExitDialog
          onExit={handleGameExit}
          loading={loading}
          showDialog={showExitDialog}
          setShowDialog={setShowExitDialog}
        />
      )}

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-4 text-center">
            {error}
            <button 
              onClick={() => setError('')}
              className="btn-small ml-4"
            >
              Bezárás
            </button>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

// Fő App komponens QueryClientProvider-rel
function AppWithQueryClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default AppWithQueryClient;