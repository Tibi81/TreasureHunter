// components/GameExitDialog.jsx
import React, { useState } from 'react';

const GameExitDialog = ({ onExit, loading }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOption, setSelectedOption] = useState('exit'); // 'exit' vagy 'logout'

  const handleExitClick = () => {
    setShowDialog(true);
  };

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

  if (!showDialog) {
    return (
      <button
        onClick={handleExitClick}
        disabled={loading}
        className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700
                 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold
                 transition-all duration-200 disabled:cursor-not-allowed
                 flex items-center justify-center gap-1"
      >
        <span className="text-sm">🚪</span>
        <span className="hidden sm:inline">Kilépés</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md mx-4 border border-gray-500">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-4">🚪</div>
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-300">
            Hogyan szeretnél kilépni?
          </h3>
          
          {/* Választási lehetőségek */}
          <div className="space-y-3 mb-6 text-left">
            <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="exitType"
                value="exit"
                checked={selectedOption === 'exit'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-yellow-400 flex items-center gap-2">
                  <span>⏸️</span>
                  Szüneteltetés
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Később visszatérhetsz ugyanabba a játékba
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="exitType"
                value="logout"
                checked={selectedOption === 'logout'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-red-400 flex items-center gap-2">
                  <span>🚪</span>
                  Végleges kilépés
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  Nem térhetsz vissza ebbe a játékba
                </div>
              </div>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleCancelAction}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg
                       transition-all duration-200 w-full sm:w-auto"
            >
              Mégse
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={loading}
              className={`${
                selectedOption === 'exit' 
                  ? 'bg-yellow-600 hover:bg-yellow-500' 
                  : 'bg-red-600 hover:bg-red-500'
              } disabled:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold
                       transition-all duration-200 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 w-full sm:w-auto`}
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