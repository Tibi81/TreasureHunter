/* eslint-disable no-unused-vars */
// App.js
import React, { useState, useEffect, useCallback } from 'react';
import PlayerJoin from './components/PlayerJoin';
import GameMap from './components/GameMap';
import ChallengePanel from './components/ChallengePanel';
import GameResults from './components/GameResults';
import { gameAPI } from './services/api';
import './App.css';

function App() {
  const [gameState, setGameState] = useState({
    gameId: null,
    status: 'setup', // setup, separate, together, finished
    currentPlayer: null,
    teams: [],
    players: []
  });

  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Játék állapot frissítése
  const updateGameStatus = useCallback(async () => {
    if (!gameState.gameId) return;
    
    try {
      const response = await gameAPI.getGameStatus(gameState.gameId);
      setGameState(prev => ({
        ...prev,
        status: response.game.status,
        teams: response.teams,
        players: response.players
      }));
    } catch (err) {
      setError('Hiba a játék állapot frissítésében');
    }
  }, [gameState.gameId]);

  // Aktuális feladat betöltése
  const loadCurrentChallenge = useCallback(async () => {
    if (!gameState.gameId || !gameState.currentPlayer) return;
    
    try {
      const response = await gameAPI.getCurrentChallenge(
        gameState.gameId, 
        gameState.currentPlayer.team
      );
      setCurrentChallenge(response);
    } catch (err) {
      setError('Hiba a feladat betöltésében');
    }
  }, [gameState.gameId, gameState.currentPlayer]);

  // Automatikus frissítés
  useEffect(() => {
    if (gameState.gameId && gameState.status !== 'finished') {
      const interval = setInterval(() => {
        updateGameStatus();
        loadCurrentChallenge();
      }, 3000); // 3 másodpercenként

      return () => clearInterval(interval);
    }
  }, [gameState.gameId, gameState.status, gameState.currentPlayer, updateGameStatus, loadCurrentChallenge]);

  // Játékos csatlakozás kezelése
  const handlePlayerJoin = async (playerName, teamName) => {
    setLoading(true);
    setError('');
    
    try {
      let gameId = gameState.gameId;
      
      // Ha még nincs játék, hozzunk létre egyet
      if (!gameId) {
        const gameResponse = await gameAPI.createGame();
        gameId = gameResponse.id;
        setGameState(prev => ({ ...prev, gameId }));
      }

      // Játékos csatlakoztatása
      const playerResponse = await gameAPI.joinGame(gameId, playerName, teamName);
      
      setGameState(prev => ({
        ...prev,
        currentPlayer: {
          name: playerName,
          team: teamName
        }
      }));

      // Frissítsük a játék állapotot
      await updateGameStatus();
      
    } catch (err) {
      setError(err.message || 'Hiba a csatlakozáskor');
    } finally {
      setLoading(false);
    }
  };

  // QR kód validálás
  const handleQRValidation = async (qrCode) => {
    if (!gameState.gameId || !gameState.currentPlayer) return;

    setLoading(true);
    try {
      const response = await gameAPI.validateQR(
        gameState.gameId,
        gameState.currentPlayer.team,
        qrCode
      );

      if (response.success) {
        // Siker esetén frissítsük az állapotot
        await updateGameStatus();
        await loadCurrentChallenge();
        
        return {
          success: true,
          message: response.message,
          bonus: response.bonus || false,
          gameFinished: response.game_finished || false
        };
      } else {
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
        gameState.currentPlayer.team
      );
      return response;
    } catch (err) {
      throw new Error('Hiba a segítség kérésekor');
    }
  };

  // Render logika
  const renderGameContent = () => {
    // Ha nincs játékos, mutassuk a csatlakozási felületet
    if (!gameState.currentPlayer) {
      return (
        <PlayerJoin 
          onJoin={handlePlayerJoin}
          loading={loading}
          error={error}
          teams={gameState.teams}
        />
      );
    }

    // Ha a játék befejeződött
    if (gameState.status === 'finished') {
      return (
        <GameResults 
          teams={gameState.teams}
          players={gameState.players}
          onRestart={() => window.location.reload()}
        />
      );
    }

    // Aktív játék
    return (
      <div className="game-container">
        <GameMap 
          teams={gameState.teams}
          currentPlayer={gameState.currentPlayer}
          gameStatus={gameState.status}
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-orange-800 to-black text-white">
      <header className="bg-black bg-opacity-50 p-4 text-center">
        <h1 className="text-3xl font-bold text-orange-400">
          🎃 Halloween Kincskereső 👻
        </h1>
        {gameState.currentPlayer && (
          <p className="text-lg mt-2">
            {gameState.currentPlayer.name} - {
              gameState.currentPlayer.team === 'pumpkin' ? '🎃 Tök Csapat' : '👻 Szellem Csapat'
            }
          </p>
        )}
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

        {renderGameContent()}
      </main>
    </div>
  );
}

export default App;