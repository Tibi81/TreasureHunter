// components/Toast.jsx
import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // 4 másodperc után eltűnik

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 max-w-sm border-2 font-spooky";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-gradient-to-b from-green-600 to-green-700 text-white border-green-400`;
      case 'error':
        return `${baseStyles} bg-gradient-to-b from-red-600 to-red-700 text-white border-red-400`;
      case 'warning':
        return `${baseStyles} bg-gradient-to-b from-yellow-600 to-yellow-700 text-white border-yellow-400`;
      default:
        return `${baseStyles} bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-400`;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <span className="font-bold">{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors duration-200 transform hover:scale-110"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;