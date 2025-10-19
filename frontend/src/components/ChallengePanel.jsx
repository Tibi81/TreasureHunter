// components/ChallengePanel.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import QRScanner from './QRScanner';
import { useCurrentChallenge, useValidateQR, useGetHelp } from '../hooks/useGameAPI';
import useTypewriter from '../hooks/useTypewriter';

const ChallengePanel = ({ gameId, teamName, gameStatus }) => {
  const [qrCode, setQrCode] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // React Query hooks
  const { data: challenge, isLoading: challengeLoading, error: challengeError, refetch: refetchChallenge } = useCurrentChallenge(
    gameId, 
    teamName,
    { 
      enabled: !!gameId && !!teamName && (gameStatus === 'separate' || gameStatus === 'together')
    }
  );
  const validateQRMutation = useValidateQR();
  const getHelpMutation = useGetHelp();

  // Typewriter effect for challenge description
  const challengeDescription = challenge?.challenge?.description || challenge?.description || '';
  const { displayedText: typewriterText, isTyping } = useTypewriter(challengeDescription, 30, !!challenge);

  // ✅ JAVÍTOTT: ScanResult törlése új challenge betöltésekor
  useEffect(() => {
    if (challenge) {
      setScanResult(null); // Töröljük a korábbi eredményt új feladat betöltésekor
    }
  }, [challenge]);

  // QR kód beküldése - EGYSZERŰSÍTETT verzió
  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setScanResult(null);
    try {
      const result = await validateQRMutation.mutateAsync({
        gameId,
        teamName,
        qrCode: qrCode.trim()
      });
      
      setScanResult({
        success: result.success,
        message: result.message,
        bonus: result.bonus,
        gameFinished: result.game_finished,
        reset: result.reset
      });
      
      // ✅ CSAK QR kód törlése - cache automatikusan frissül
      if (result.success || result.reset) {
        setQrCode('');
        // ❌ NINCS MANUÁLIS REFETCH - cache automatikusan frissül!
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Hiba a QR kód ellenőrzésekor'
      });
    }
  };

  // QR kód scanner kezelése - EGYSZERŰSÍTETT verzió
  const handleQRScan = async (scannedCode) => {
    setShowQRScanner(false);
    setQrCode(scannedCode);
    
    // Automatikusan beküldjük a beolvasott kódot
    setScanResult(null);
    try {
      const result = await validateQRMutation.mutateAsync({
        gameId,
        teamName,
        qrCode: scannedCode
      });
      
      setScanResult({
        success: result.success,
        message: result.message,
        bonus: result.bonus,
        gameFinished: result.game_finished,
        reset: result.reset
      });
      
      // ✅ CSAK QR kód törlése - cache automatikusan frissül
      if (result.success || result.reset) {
        setQrCode('');
        // ❌ NINCS MANUÁLIS REFETCH - cache automatikusan frissül!
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Hiba a QR kód ellenőrzésekor'
      });
    }
  };

  // Segítség kérése
  const handleGetHelpClick = async () => {
    try {
      const helpData = await getHelpMutation.mutateAsync({
        gameId,
        teamName
      });
      
      if (helpData && helpData.success !== false) {
        setHelpText(helpData.help_text || '');
        setShowHelp(true);
      } else {
        console.error('Segítség kérés sikertelen:', helpData);
      }
    } catch (error) {
      console.error('Hiba a segítség kérésekor:', error);
    }
  };

  // Loading állapot
  if (challengeLoading) {
    return (
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile text-center border border-orange-500/20">
        <div className="text-3xl sm:text-4xl mb-4 animate-spin">⏳</div>
        <h3 className="text-xl sm:text-2xl font-bold text-orange-400 mb-2 font-spooky drop-shadow-glow-orange">
          Feladat betöltése...
        </h3>
        <p className="text-gray-200 font-spooky leading-relaxed text-sm sm:text-base">
          Kérjük várjon, amíg betöltjük a feladatot.
        </p>
      </div>
    );
  }

  // Error állapot
  if (challengeError) {
    return (
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile text-center border border-orange-500/20">
        <div className="text-3xl sm:text-4xl mb-4">❌</div>
        <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-2 font-spooky drop-shadow-glow-orange">
          Hiba történt
        </h3>
        <p className="text-gray-200 font-spooky leading-relaxed text-sm sm:text-base">
          {challengeError.message || 'Hiba a feladat betöltésében'}
        </p>
      </div>
    );
  }

  // Ha nincs aktív feladat
  if (!challenge) {
    return (
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile text-center border border-orange-500/20">
        <div className="text-3xl sm:text-4xl mb-4 animate-float">⏳</div>
        <h3 className="text-xl sm:text-2xl font-bold text-orange-400 mb-2 font-spooky drop-shadow-glow-orange">
          Várakozás...
        </h3>
        <p className="text-gray-200 font-spooky leading-relaxed text-sm sm:text-base">
          {gameStatus === 'setup' ? 'Várakozás a játék indítására... (Admin indítja el)' : 
           gameStatus === 'waiting' ? 'Várakozás játékosokra... (Legalább 1 játékos szükséges)' :
           'Várakozás a feladatra...'}
        </p>
        {gameStatus === 'setup' && (
          <div className="mt-mobile p-mobile bg-gradient-to-b from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/20">
            <p className="text-sm text-orange-200 font-spooky">
              💡 Tipp: Oszd meg a játék azonosítóját a többi játékossal!
            </p>
          </div>
        )}
        {gameStatus === 'waiting' && (
          <div className="mt-mobile p-mobile bg-gradient-to-b from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/20">
            <p className="text-sm text-blue-200 font-spooky">
              🎮 Várjuk a többi játékos csatlakozását...
            </p>
            <p className="text-xs text-blue-300 mt-2 font-spooky">
              A játék automatikusan setup állapotba kerül, amikor legalább 1 játékos csatlakozik!
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile border border-orange-500/20 overflow-hidden">
      {/* Feladat fejléc */}
      <div className="text-center mb-mobile">
        <div className="text-4xl sm:text-6xl mb-4 animate-float">{challenge.station?.icon || '🎯'}</div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-400 mb-3 font-spooky drop-shadow-glow-orange">
          {challenge.challenge?.title || challenge.title}
        </h2>
        <div className="text-base sm:text-lg text-gray-200 mb-2 font-spooky">
          {challenge.station?.name}
        </div>
        <div className="text-xs sm:text-sm text-purple-300 bg-gradient-to-b from-purple-900/30 to-purple-800/30 rounded-full px-3 sm:px-4 py-2 inline-block border border-purple-500/20 font-spooky">
          {challenge.is_save ? '🆘 Mentesítő feladat' :
           challenge.team_type ? 
            (challenge.team_type === 'pumpkin' ? '🎃 Tök Csapat feladata' : '👻 Szellem Csapat feladata') : 
            '🤝 Közös feladat'
          }
        </div>
      </div>

      {/* Feladat leírása */}
      <div className="mb-mobile">
        <h3 className="text-lg sm:text-xl font-bold text-orange-300 mb-mobile font-spooky">
          📋 Feladat:
        </h3>
        <div className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-mobile border border-orange-500/20">
          <p className="text-gray-200 leading-relaxed font-spooky text-sm sm:text-base">
            {typewriterText}
            {isTyping && <span className="animate-pulse text-orange-400">|</span>}
          </p>
        </div>
      </div>

      {/* QR kód beolvasás */}
      <div className="mb-mobile">
        <h3 className="text-lg sm:text-xl font-bold text-orange-300 mb-mobile font-spooky">
          📱 QR kód beolvasása:
        </h3>
        <form onSubmit={handleQRSubmit} className="form-container">
          <div>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Írd be vagy olvasd be a QR kódot..."
              className="input-primary text-center"
              disabled={validateQRMutation.isPending}
            />
          </div>
          <div className="flex-mobile-row">
            <button
              type="submit"
              disabled={validateQRMutation.isPending || !qrCode.trim()}
              className="btn-primary flex-1"
            >
              {validateQRMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ellenőrzés...
                </span>
              ) : (
                'QR kód ellenőrzése 🔍'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              disabled={validateQRMutation.isPending}
              className="btn-small"
              title="QR kód beolvasása kamerával"
            >
              📷
            </button>
          </div>
        </form>
      </div>

      {/* Eredmény megjelenítése */}
      {scanResult && (
        <div className={`mb-mobile p-mobile rounded-xl text-center font-spooky ${
          scanResult.success ? 'bg-gradient-to-b from-green-600/80 to-green-700/80' : 'bg-gradient-to-b from-red-600/80 to-red-700/80'
        } text-white border-2 ${
          scanResult.success ? 'border-green-400' : 'border-red-400'
        }`}>
          <div className="text-xl sm:text-2xl mb-2">
            {scanResult.success ? '✅' : '❌'}
          </div>
          <div className="font-bold text-base sm:text-lg">
            {scanResult.message}
          </div>
          {scanResult.bonus && (
            <div className="text-sm mt-2 text-yellow-200">
              🎉 Bónusz pont!
            </div>
          )}
          {scanResult.gameFinished && (
            <div className="text-sm mt-2 text-yellow-200">
              🏆 Játék befejezve!
            </div>
          )}
          {scanResult.reset && (
            <div className="text-sm mt-2 text-orange-200">
              ⚠️ Túl sok hiba! Újrakezdés...
            </div>
          )}
        </div>
      )}

      {/* Segítség */}
      <div className="mb-mobile">
        <div className="flex items-center justify-between mb-mobile">
          <h3 className="text-lg sm:text-xl font-bold text-orange-300 font-spooky">
            💡 Segítség:
          </h3>
          <button
            onClick={handleGetHelpClick}
            disabled={getHelpMutation.isPending}
            className="btn-small"
          >
            {getHelpMutation.isPending ? 'Kérés...' : 'Segítség kérése'}
          </button>
        </div>
        
        {showHelp && helpText && (
          <div className="bg-gradient-to-b from-purple-900/50 to-purple-800/50 rounded-xl p-mobile border border-purple-500/20">
            <p className="text-purple-200 leading-relaxed font-spooky text-sm sm:text-base">
              {helpText}
            </p>
          </div>
        )}
      </div>

      {/* Játékszabályok */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl p-mobile border border-orange-500/20">
        <h4 className="font-bold text-orange-300 mb-mobile text-base sm:text-lg font-spooky">📋 Emlékeztető:</h4>
        <ul className="text-xs sm:text-sm text-gray-200 space-y-1 sm:space-y-2 font-spooky leading-relaxed">
          <li className="flex items-center">
            <span className="text-orange-400 mr-2 text-sm">⚠️</span>
            3 hibás próbálkozás után újrakezdés
          </li>
          <li className="flex items-center">
            <span className="text-orange-400 mr-2 text-sm">🪄</span>
            1 segítség állomásonként
          </li>
          <li className="flex items-center">
            <span className="text-orange-400 mr-2 text-sm">📱</span>
            QR kódot pontosan add meg
          </li>
          <li className="flex items-center">
            <span className="text-orange-400 mr-2 text-sm">💡</span>
            Ha elakadsz, kérj segítséget!
          </li>
        </ul>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  );
};

ChallengePanel.propTypes = {
  gameId: PropTypes.number.isRequired,
  teamName: PropTypes.string.isRequired,
  gameStatus: PropTypes.string,
};

export default ChallengePanel;
