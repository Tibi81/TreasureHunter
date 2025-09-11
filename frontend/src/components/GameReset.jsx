// components/GameReset.jsx
import React, { useState } from 'react';

const GameReset = ({ onReset, onExit, loading }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState('reset'); // 'reset' or 'exit'

  const handleResetClick = () => {
    setConfirmType('reset');
    setShowConfirm(true);
  };

  const handleExitClick = () => {
    setConfirmType('exit');
    setShowConfirm(true);
  };

  const handleConfirmAction = () => {
    if (confirmType === 'reset') {
      onReset();
    } else {
      onExit();
    }
    setShowConfirm(false);
  };

  const handleCancelAction = () => {
    setShowConfirm(false);
  };

  if (!showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleExitClick}
          disabled={loading}
          className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700
                   text-white px-4 py-2 rounded-lg text-sm font-semibold
                   transition-all duration-200 disabled:cursor-not-allowed
                   flex items-center gap-2"
        >
          <span>🚪</span>
          Kilépés
        </button>
        <button
          onClick={handleResetClick}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600
                   text-white px-4 py-2 rounded-lg text-sm font-semibold
                   transition-all duration-200 disabled:cursor-not-allowed
                   flex items-center gap-2"
        >
          <span>🔄</span>
          Új játék
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-900 rounded-lg p-6 max-w-md mx-4 border ${
        confirmType === 'reset' ? 'border-red-500' : 'border-gray-500'
      }`}>
        <div className="text-center">
          <div className="text-4xl mb-4">
            {confirmType === 'reset' ? '⚠️' : '🚪'}
          </div>
          <h3 className={`text-xl font-bold mb-4 ${
            confirmType === 'reset' ? 'text-red-400' : 'text-gray-300'
          }`}>
            {confirmType === 'reset' ? 'Új játék indítása' : 'Kilépés a játékból'}
          </h3>
          <p className="text-gray-300 mb-6">
            {confirmType === 'reset' ? (
              <>
                Biztosan törölni szeretnéd az összes játékost és újra kezdeni a játékot?
                <br />
                <span className="text-red-300 font-semibold">
                  Ez a művelet nem vonható vissza!
                </span>
              </>
            ) : (
              <>
                Biztosan kilépnél a játékból?
                <br />
                <span className="text-gray-400">
                  A játék folytatódhat a többi játékossal.
                </span>
              </>
            )}
          </p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleCancelAction}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg
                       transition-all duration-200"
            >
              Mégse
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={loading}
              className={`${
                confirmType === 'reset' 
                  ? 'bg-red-600 hover:bg-red-500 disabled:bg-gray-600' 
                  : 'bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700'
              } text-white px-4 py-2 rounded-lg font-semibold
                       transition-all duration-200 disabled:cursor-not-allowed
                       flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {confirmType === 'reset' ? 'Törlés...' : 'Kilépés...'}
                </>
              ) : (
                <>
                  <span>{confirmType === 'reset' ? '🗑️' : '🚪'}</span>
                  {confirmType === 'reset' ? 'Igen, törölj!' : 'Igen, kilépek!'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameReset;
