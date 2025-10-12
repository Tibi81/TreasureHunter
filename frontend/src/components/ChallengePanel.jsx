// components/ChallengePanel.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import QRScanner from './QRScanner';

const ChallengePanel = ({ challenge, onQRScan, onGetHelp, loading, gameStatus }) => {
  const [qrCode, setQrCode] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // QR kód beküldése
  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setScanResult(null);
    const result = await onQRScan(qrCode.trim());
    setScanResult(result);
    
    // QR kód mező törlése sikeres validálás vagy reset esetén
    if (result.success || result.reset) {
      setQrCode('');
    }
  };

  // QR kód scanner kezelése
  const handleQRScan = async (scannedCode) => {
    setShowQRScanner(false);
    setQrCode(scannedCode);
    
    // Automatikusan beküldjük a beolvasott kódot
    setScanResult(null);
    const result = await onQRScan(scannedCode);
    setScanResult(result);
    
    if (result.success || result.reset) {
      setQrCode('');
    }
  };

  // Segítség kérése
  const handleGetHelpClick = async () => {
    try {
      const helpData = await onGetHelp();
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
            {challenge.challenge?.description || challenge.description}
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
              disabled={loading}
            />
          </div>
          <div className="flex-mobile-row">
            <button
              type="submit"
              disabled={loading || !qrCode.trim()}
              className="btn-primary flex-1"
            >
              {loading ? (
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
              disabled={loading}
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
            disabled={loading}
            className="btn-small"
          >
            Segítség kérése
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
  challenge: PropTypes.shape({
    station: PropTypes.shape({
      icon: PropTypes.string,
      name: PropTypes.string,
    }),
    challenge: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
    }),
    title: PropTypes.string,
    description: PropTypes.string,
    is_save: PropTypes.bool,
    team_type: PropTypes.string,
  }),
  onQRScan: PropTypes.func.isRequired,
  onGetHelp: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  gameStatus: PropTypes.string,
};

export default ChallengePanel;
