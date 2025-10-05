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
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">QR Kód Beolvasás</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="relative bg-gray-200 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {!hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-600">Kamera engedély szükséges</p>
                </div>
              </div>
            )}
            
            {hasPermission && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 border-dashed rounded-lg p-4 bg-green-400 bg-opacity-20">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <p className="text-sm font-semibold">QR kód keresése...</p>
                    <p className="text-xs mt-1">Mutasd a QR kódot a kamerának</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Vagy add meg manuálisan:</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="QR kód szövege..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Beküld
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Mégse
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>💡 Tipp: Mutasd a QR kódot a kamerának, vagy írd be manuálisan</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
