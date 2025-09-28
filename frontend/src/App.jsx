/* eslint-disable no-unused-vars */
// App.js
import React, { useState, useEffect, useCallback } from 'react';
import Welcome from './components/Welcome';
import PlayerRegistration from './components/PlayerRegistration';
import AdminPanel from './components/AdminPanel';
import ProgressDisplay from './components/ProgressDisplay';
import ChallengePanel from './components/ChallengePanel';
import GameResults from './components/GameResults';
import GameExitDialog from './components/GameExitDialog';
import Toast from './components/Toast';
import { gameAPI } from './services/api';
import './App.css';

function App() {
  const [appState, setAppState] = useState('welcome'); // welcome, registration, admin, game, finished
  const [playerName, setPlayerName] = useState('');
  const [gameData, setGameData] = useState(null);
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

  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Aktuális feladat betöltése - javított verzió
  const loadCurrentChallenge = useCallback(async () => {
    // Csak akkor próbáljunk feladatot betölteni, ha a játék aktív
    if (!gameState.gameId || !gameState.currentPlayer || 
        gameState.status !== 'separate' && gameState.status !== 'together') {
      setCurrentChallenge(null);
      return;
    }
    
    try {
      const response = await gameAPI.getCurrentChallenge(
        gameState.gameId, 
        gameState.currentPlayer.team_name || gameState.currentPlayer.team
      );
      
      // Ha reset szükséges, frissítsük a játék állapotát
      if (response.reset_required) {
        await updateGameStatus();
        // Próbáljuk újra betölteni a feladatot
        const newResponse = await gameAPI.getCurrentChallenge(
          gameState.gameId, 
          gameState.currentPlayer.team_name || gameState.currentPlayer.team
        );
        setCurrentChallenge(newResponse);
      } else {
        setCurrentChallenge(response);
      }
    } catch (err) {
      // Ha a játék még nem indult el, ne jelezzük hibaként
      if (err.status === 400) {
        setCurrentChallenge(null);
      } else {
        console.error('Hiba a feladat betöltésében:', err.message);
        setCurrentChallenge(null);
      }
    }
  }, [gameState.gameId, gameState.currentPlayer, gameState.status, updateGameStatus]);

  // Feladat betöltés próbálása amikor a játék állapot változik
  useEffect(() => {
    if (gameState.gameId && gameState.currentPlayer && 
        (gameState.status === 'separate' || gameState.status === 'together')) {
      loadCurrentChallenge();
    }
  }, [gameState.status, gameState.gameId, gameState.currentPlayer, loadCurrentChallenge]);

  // Automatikus frissítés - csak játék indítás után - optimalizált verzió
  useEffect(() => {
    if (gameState.gameId && gameState.status !== 'finished' && 
        gameState.status !== 'setup' && gameState.status !== 'waiting') {
      const interval = setInterval(async () => {
        try {
          await updateGameStatus();
          await loadCurrentChallenge();
        } catch (error) {
          console.error('Hiba a játék frissítésében:', error.message);
          // Ne dobj tovább a hibát, hanem logold csak
        }
      }, 10000); // 10 másodperc - optimalizált gyakoriság

      return () => clearInterval(interval);
    }
  }, [gameState.gameId, gameState.status, gameState.currentPlayer, updateGameStatus, loadCurrentChallenge]);

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

  // Játék kód megadása kezelése
  const handleGameCodeSubmit = async (gameCode) => {
    console.log('handleGameCodeSubmit called with:', gameCode);
    
    if (gameCode === 'ADMIN') {
      setAppState('admin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Calling findGameByCode with:', gameCode);
      const response = await gameAPI.findGameByCode(gameCode);
      console.log('Game response:', response);
      
      // Ellenőrizzük, hogy van-e session token ehhez a játékhoz
      const sessionToken = localStorage.getItem('session_token');
      console.log('Session token from localStorage:', sessionToken);
      if (sessionToken) {
        try {
          const restoreResponse = await gameAPI.restoreSession(sessionToken);
          console.log('Restore response:', restoreResponse);
          if (restoreResponse.player && restoreResponse.game && restoreResponse.game.id === response.game.id) {
            // Ha van érvényes session token ehhez a játékhoz, visszacsatlakozunk
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
            setLoading(false);
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
      setGameData(response);
      setAppState('registration');
    } catch (err) {
      setError(err.message || 'Nem található játék ezzel a kóddal');
    } finally {
      setLoading(false);
    }
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
    setGameData(null);
    setGameState({
      gameId: null,
      status: 'setup',
      currentPlayer: null,
      teams: [],
      players: []
    });
    setCurrentChallenge(null);
    setError('');
    // Toast-ok törlése
    setToasts([]);
  };

  // QR kód validálás
  const handleQRValidation = async (qrCode) => {
    if (!gameState.gameId || !gameState.currentPlayer) return;

    setLoading(true);
    try {
      const response = await gameAPI.validateQR(
        gameState.gameId,
        gameState.currentPlayer.team_name || gameState.currentPlayer.team,
        qrCode
      );

      if (response.success) {
        // Siker esetén frissítsük az állapotot
        await updateGameStatus();
        // Csak akkor töltjük be a challenge-et, ha a játék már elindult
        if (gameState.status === 'separate' || gameState.status === 'together') {
          await loadCurrentChallenge();
        }
        
        return {
          success: true,
          message: response.message,
          bonus: response.bonus || false,
          gameFinished: response.game_finished || false
        };
      } else {
        // Ha újrakezdés szükséges, frissítsük a játék állapotát
        if (response.reset) {
          await updateGameStatus();
          await loadCurrentChallenge();
        }
        
        return {
          success: false,
          message: response.message,
          reset: response.reset || false
        };
      }
    } catch (err) {
      return {
        success: false,
        message: 'Hiba a QR kód ellenőrzésekor'
      };
    } finally {
      setLoading(false);
    }
  };

  // Segítség kérése
  const handleGetHelp = async () => {
    if (!gameState.gameId || !gameState.currentPlayer) return;

    try {
      const response = await gameAPI.getHelp(
        gameState.gameId,
        gameState.currentPlayer.team_name || gameState.currentPlayer.team
      );
      return response;
    } catch (err) {
      console.error('Segítség kérés hiba:', err);
      return {
        success: false,
        message: 'Hiba a segítség kérésekor',
        error: true
      };
    }
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

      setCurrentChallenge(null);
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
      setCurrentChallenge(null);
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
      setCurrentChallenge(null);
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
            gameData={gameData}
            onJoinGame={handlePlayerJoin}
            onBack={handleBackToWelcome}
          />
        );
      
      case 'admin':
        return <AdminPanel onBack={handleBackToWelcome} />;
      
      case 'game':
        // Ha a játék befejeződött
        if (gameState.status === 'finished') {
          return (
            <GameResults 
              teams={gameState.teams}
              players={gameState.players}
              onRestart={handleBackToWelcome}
            />
          );
        }

        // Aktív játék
        return (
          <div className="game-container">
            <ProgressDisplay 
              currentPlayer={gameState.currentPlayer}
              teams={gameState.teams}
              gameStatus={gameState.status}
              gameInfo={gameState.gameInfo}
              gameName={gameState.gameName}
              showAllTeams={true}
            />
            
            <ChallengePanel
              challenge={currentChallenge}
              onQRScan={handleQRValidation}
              onGetHelp={handleGetHelp}
              loading={loading}
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
        <div className="bg-black bg-opacity-60 rounded-lg p-4">
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
                <GameExitDialog
                  onExit={handleGameExit}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-4 text-center">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 underline"
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

export default App;