import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto overflow-x-hidden">
      <div className="bg-gradient-to-b from-purple-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-mobile max-w-md w-full mx-4 border border-orange-500/20 my-4">
        <div className="flex justify-between items-center mb-mobile">
          <h3 className="text-lg sm:text-xl font-bold text-orange-400 font-spooky drop-shadow-glow-orange">QR Kód Beolvasás</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-400 transition-colors duration-200 transform hover:scale-110"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-mobile p-mobile bg-gradient-to-b from-red-600/80 to-red-700/80 border-2 border-red-400 text-white rounded-xl font-spooky">
            {error}
          </div>
        )}

        <div className="mb-mobile">
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
                  <div className="text-3xl sm:text-4xl mb-2 animate-float">📷</div>
                  <p className="text-gray-200 font-spooky text-sm sm:text-base">Kamera engedély szükséges</p>
                </div>
              </div>
            )}
            
            {hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 border-dashed rounded-xl p-mobile bg-gradient-to-b from-green-400/20 to-green-500/20">
                  <div className="text-white text-center">
                    <div className="text-xl sm:text-2xl mb-2 animate-float">📱</div>
                    <p className="text-xs sm:text-sm font-semibold">QR kód keresése...</p>
                    <p className="text-xs mt-1">Mutasd a QR kódot a kamerának</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-mobile">
          <h4 className="text-sm font-bold mb-mobile text-orange-300 font-spooky">Vagy add meg manuálisan:</h4>
          <div className="flex-mobile-row">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="QR kód szövege..."
              className="input-primary flex-1"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="btn-primary"
            >
              Beküld
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Mégse
          </button>
        </div>

        <div className="mt-mobile text-xs text-gray-300 text-center font-spooky">
          <p>💡 Tipp: Mutasd a QR kódot a kamerának, vagy írd be manuálisan</p>
        </div>
      </div>
    </div>
  );
};

QRScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default QRScanner;
