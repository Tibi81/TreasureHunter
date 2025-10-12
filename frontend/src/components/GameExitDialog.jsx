// components/GameExitDialog.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const GameExitDialog = ({ onExit, loading, showDialog, setShowDialog }) => {
  const [selectedOption, setSelectedOption] = useState('exit'); // 'exit' vagy 'logout'

  const handleConfirmAction = async () => {
    // Átadjuk a választott opciót az App.js-nek
    await onExit(selectedOption);
    // A dialógus bezárása késleltetve, hogy a toast megjelenhessen
    setTimeout(() => {
      setShowDialog(false);
    }, 100);
  };

  const handleCancelAction = () => {
    setShowDialog(false);
  };

  // Ha nincs megjelenítendő modal, ne rendereljünk semmit
  if (!showDialog) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[99999] container-mobile overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
    >
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto border border-orange-500/20 relative my-4">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl mb-4 animate-float">🚪</div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-mobile text-orange-300 font-spooky drop-shadow-glow-orange">
            Hogyan szeretnél kilépni?
          </h3>
          
          {/* Választási lehetőségek */}
          <div className="space-y-2 sm:space-y-3 mb-mobile text-left">
            <label className="flex items-start gap-2 sm:gap-3 p-mobile bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl cursor-pointer hover:from-yellow-900/20 hover:to-yellow-800/20 transition-all duration-200 border border-gray-600 hover:border-yellow-500/50">
              <input
                type="radio"
                name="exitType"
                value="exit"
                checked={selectedOption === 'exit'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-yellow-400 flex items-center gap-2 font-spooky text-sm sm:text-base">
                  <span>⏸️</span>
                  Szüneteltetés
                </div>
                <div className="text-xs sm:text-sm text-gray-200 mt-1 font-spooky">
                  Később visszatérhetsz ugyanabba a játékba
                </div>
              </div>
            </label>

            <label className="flex items-start gap-2 sm:gap-3 p-mobile bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl cursor-pointer hover:from-red-900/20 hover:to-red-800/20 transition-all duration-200 border border-gray-600 hover:border-red-500/50">
              <input
                type="radio"
                name="exitType"
                value="logout"
                checked={selectedOption === 'logout'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-red-400 flex items-center gap-2 font-spooky text-sm sm:text-base">
                  <span>🚪</span>
                  Végleges kilépés
                </div>
                <div className="text-xs sm:text-sm text-gray-200 mt-1 font-spooky">
                  Nem térhetsz vissza ebbe a játékba
                </div>
              </div>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
            <button
              onClick={handleCancelAction}
              className="btn-secondary"
            >
              Mégse
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={loading}
              className={`${
                selectedOption === 'exit' 
                  ? 'btn-success' 
                  : 'btn-danger'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kilépés...
                </>
              ) : (
                <>
                  <span>{selectedOption === 'exit' ? '⏸️' : '🚪'}</span>
                  Kilépés
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

GameExitDialog.propTypes = {
  onExit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  showDialog: PropTypes.bool.isRequired,
  setShowDialog: PropTypes.func.isRequired,
};

export default GameExitDialog;