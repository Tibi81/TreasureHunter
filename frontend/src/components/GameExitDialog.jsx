// components/GameExitDialog.jsx
import React, { useState } from 'react';

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
      className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
    >
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto border border-orange-500/20 relative">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-4 animate-float">🚪</div>
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-orange-300 font-spooky drop-shadow-glow-orange">
            Hogyan szeretnél kilépni?
          </h3>
          
          {/* Választási lehetőségek */}
          <div className="space-y-3 mb-6 text-left">
            <label className="flex items-start gap-3 p-4 bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl cursor-pointer hover:from-yellow-900/20 hover:to-yellow-800/20 transition-all duration-200 border border-gray-600 hover:border-yellow-500/50">
              <input
                type="radio"
                name="exitType"
                value="exit"
                checked={selectedOption === 'exit'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-yellow-400 flex items-center gap-2 font-spooky">
                  <span>⏸️</span>
                  Szüneteltetés
                </div>
                <div className="text-sm text-gray-200 mt-1 font-spooky">
                  Később visszatérhetsz ugyanabba a játékba
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-gradient-to-b from-gray-800 to-gray-700 rounded-xl cursor-pointer hover:from-red-900/20 hover:to-red-800/20 transition-all duration-200 border border-gray-600 hover:border-red-500/50">
              <input
                type="radio"
                name="exitType"
                value="logout"
                checked={selectedOption === 'logout'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-red-400 flex items-center gap-2 font-spooky">
                  <span>🚪</span>
                  Végleges kilépés
                </div>
                <div className="text-sm text-gray-200 mt-1 font-spooky">
                  Nem térhetsz vissza ebbe a játékba
                </div>
              </div>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleCancelAction}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-3 rounded-xl font-bold
                       transition-all duration-200 w-full sm:w-auto transform hover:scale-105
                       shadow-md hover:shadow-gray-400/40 font-spooky"
            >
              Mégse
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={loading}
              className={`${
                selectedOption === 'exit' 
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
              } disabled:from-gray-700 disabled:to-gray-800 text-white px-4 py-3 rounded-xl font-bold
                       transition-all duration-200 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 w-full sm:w-auto transform hover:scale-105
                       shadow-md hover:shadow-orange-400/40 font-spooky`}
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

export default GameExitDialog;