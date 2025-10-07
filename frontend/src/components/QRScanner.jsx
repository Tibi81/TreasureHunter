import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);

      if (videoRef.current) {
        // QR Scanner inicializálása
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR kód beolvasva:', result);
            onScan(result.data);
            stopCamera();
          },
          {
            onDecodeError: (error) => {
              // Csak debug üzenetek, nem hibák
              if (error.name !== 'NotFoundException') {
                console.log('QR dekódolási hiba:', error);
              }
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        // Kamera indítása
        await qrScannerRef.current.start();
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Kamera hiba:', err);
      setError('Kamera nem elérhető. Ellenőrizd az engedélyeket!');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setHasPermission(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleManualInput = () => {
    const input = prompt('Add meg a QR kódot manuálisan:');
    if (input && input.trim()) {
      onScan(input.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 max-w-md w-full mx-4 border border-orange-500/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-orange-400 font-spooky drop-shadow-glow-orange">QR Kód Beolvasás</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-400 transition-colors duration-200 transform hover:scale-110"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-gradient-to-b from-red-600/80 to-red-700/80 border-2 border-red-400 text-white rounded-xl font-spooky">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-orange-500/20" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {!hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <div className="text-4xl mb-2 animate-float">📷</div>
                  <p className="text-gray-200 font-spooky">Kamera engedély szükséges</p>
                </div>
              </div>
            )}
            
            {hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 border-dashed rounded-xl p-4 bg-gradient-to-b from-green-400/20 to-green-500/20">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-2 animate-float">📱</div>
                    <p className="text-sm font-semibold">QR kód keresése...</p>
                    <p className="text-xs mt-1">Mutasd a QR kódot a kamerának</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-bold mb-2 text-orange-300 font-spooky">Vagy add meg manuálisan:</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="QR kód szövege..."
              className="flex-1 px-3 py-3 border-2 border-orange-400 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 font-spooky"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-xl font-bold transform hover:scale-105 shadow-md hover:shadow-orange-400/40 font-spooky"
            >
              Beküld
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-xl font-bold transform hover:scale-105 shadow-md hover:shadow-gray-400/40 font-spooky"
          >
            Mégse
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-300 text-center font-spooky">
          <p>💡 Tipp: Mutasd a QR kódot a kamerának, vagy írd be manuálisan</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
