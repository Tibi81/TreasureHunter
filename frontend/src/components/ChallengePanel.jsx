// components/ChallengePanel.jsx
import React, { useState } from 'react';

const ChallengePanel = ({ challenge, onQRScan, onGetHelp, loading, gameStatus }) => {
  const [qrCode, setQrCode] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // QR kód beküldése
  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setScanResult(null);
    const result = await onQRScan(qrCode.trim());
    setScanResult(result);
    
    if (result.success) {
      setQrCode('');
    }
  };

  // Segítség kérése
  const handleGetHelpClick = async () => {
    try {
      const helpData = await onGetHelp();
      setShowHelp(true);
    } catch (error) {
      console.error('Hiba a segítség kérésekor:', error);
    }
  };

  // Ha nincs aktív feladat
  if (!challenge) {
    return (
      <div className="bg-black bg-opacity-60 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h3 className="text-xl font-semibold text-orange-400 mb-2">
          Várakozás...
        </h3>
        <p className="text-gray-300">
          {gameStatus === 'setup' ? 'Várakozás a játék indítására... (Admin indítsa el)' : 
           gameStatus === 'waiting' ? 'Várakozás játékosokra... (Legalább 1 játékos szükséges)' :
           'Várakozás a feladatra...'}
        </p>
        {gameStatus === 'setup' && (
          <div className="mt-4 p-4 bg-orange-900 bg-opacity-30 rounded-lg">
            <p className="text-sm text-orange-200">
              💡 Tipp: Oszd meg a játék azonosítóját a többi játékossal!
            </p>
          </div>
        )}
        {gameStatus === 'waiting' && (
          <div className="mt-4 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
            <p className="text-sm text-blue-200">
              🎮 Várjuk a többi játékos csatlakozását...
            </p>
            <p className="text-xs text-blue-300 mt-2">
              A játék automatikusan setup állapotba kerül, amikor legalább 1 játékos csatlakozik!
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-black bg-opacity-60 rounded-lg p-6">
      {/* Feladat fejléc */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{challenge.station?.icon || '🎯'}</div>
        <h2 className="text-3xl font-bold text-orange-400 mb-3">
          {challenge.challenge?.title || challenge.title}
        </h2>
        <div className="text-lg text-gray-300 mb-2">
          {challenge.station?.name}
        </div>
        <div className="text-sm text-purple-300 bg-purple-900 bg-opacity-30 rounded-full px-4 py-2 inline-block">
          {challenge.team_type ? 
            (challenge.team_type === 'pumpkin' ? '🎃 Tök Csapat feladata' : '👻 Szellem Csapat feladata') : 
            '🤝 Közös feladat'
          }
        </div>
      </div>

      {/* Feladat leírása */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-3">
          📋 Feladat:
        </h3>
        <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
          <p className="text-gray-200 leading-relaxed">
            {challenge.challenge?.description || challenge.description}
          </p>
        </div>
      </div>

      {/* QR kód beolvasás */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-3">
          📱 QR kód beolvasása:
        </h3>
        <form onSubmit={handleQRSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Írd be vagy olvasd be a QR kódot..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       text-white placeholder-gray-400 text-center text-lg"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !qrCode.trim()}
            className="w-full bg-gradient-to-r from-orange-600 to-purple-600 
                     hover:from-orange-500 hover:to-purple-500 
                     disabled:from-gray-600 disabled:to-gray-600
                     text-white font-bold py-3 px-4 rounded-lg 
                     transition-all duration-200 
                     disabled:cursor-not-allowed"
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
        </form>
      </div>

      {/* Eredmény megjelenítése */}
      {scanResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          scanResult.success ? 'bg-green-600 bg-opacity-80' : 'bg-red-600 bg-opacity-80'
        } text-white text-center`}>
          <div className="text-2xl mb-2">
            {scanResult.success ? '✅' : '❌'}
          </div>
          <div className="font-semibold">
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-purple-300">
            💡 Segítség:
          </h3>
          <button
            onClick={handleGetHelpClick}
            disabled={loading || showHelp}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600
                     text-white px-4 py-2 rounded-lg text-sm font-semibold
                     transition-all duration-200 disabled:cursor-not-allowed"
          >
            {showHelp ? 'Segítség megjelenítve' : 'Segítség kérése'}
          </button>
        </div>
        
        {showHelp && challenge.help_text && (
          <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 border border-purple-500">
            <p className="text-purple-200 leading-relaxed">
              {challenge.help_text}
            </p>
          </div>
        )}
      </div>

      {/* Játékszabályok */}
      <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
        <h4 className="font-semibold text-orange-300 mb-2">📋 Emlékeztető:</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• 3 hibás próbálkozás után újrakezdés</li>
          <li>• 1 segítség állomásonként</li>
          <li>• QR kódot pontosan add meg</li>
          <li>• Ha elakadsz, kérj segítséget!</li>
        </ul>
      </div>
    </div>
  );
};

export default ChallengePanel;
