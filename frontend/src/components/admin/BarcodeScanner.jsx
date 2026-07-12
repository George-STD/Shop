import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';
import { STRINGS } from '../../constants';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startScanner = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } else {
        scannerRef.current = new Html5Qrcode("reader");
      }

      // Configuration for highest possible resolution and continuous focus
      const config = {
        fps: 15, // 15 is optimal for balancing CPU and speed
        aspectRatio: 1.777778, // 16:9
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Uses Google/Apple Native barcode detector if available (100x faster)
        },
        videoConstraints: {
          facingMode: "environment", // Force back camera
          width: { min: 640, ideal: 1920 }, // High resolution
          height: { min: 480, ideal: 1080 },
          advanced: [{ focusMode: "continuous" }] // Force continuous auto-focus
        }
      };

      // Always try to start with the back camera first
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText);
              }).catch(console.error);
            } else {
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore frequent frame errors
          }
        );
      } catch (backCameraError) {
        console.warn('Back camera not found or failed, falling back to any available camera (laptop mode)...', backCameraError);
        // Fallback for laptops or devices without a back camera
        await scannerRef.current.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText);
              }).catch(console.error);
            } else {
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore frequent frame errors
          }
        );
      }
      
      setIsInitializing(false);
    } catch (err) {
      console.error(err);
      setError('تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحيات وعدم استخدام الكاميرا في تطبيق آخر.');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      <style>
        {`
          @keyframes scan-line {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          #reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
          }
        `}
      </style>

      {/* Header Actions */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-lg font-bold tracking-wide">مسح الباركود</h2>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            className="p-3 text-white bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-md transition-all active:scale-95"
          >
            <FiX size={24} />
          </button>
        </div>
      </div>

      {/* Camera Viewfinder */}
      <div className="absolute inset-0 overflow-hidden flex justify-center items-center pointer-events-none">
        <div id="reader" className="w-full h-full pointer-events-auto"></div>
        
        {/* Overlay Cutout (Dark background outside the square) */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            {/* Dark overlay using giant box-shadow technique */}
            <div 
              className="relative rounded-xl border-2 border-green-400/80 overflow-hidden"
              style={{
                width: '280px',
                height: '180px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)'
              }}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>

              {/* Animated Laser Line */}
              <div 
                className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.8)]"
                style={{ animation: 'scan-line 2.5s ease-in-out infinite' }}
              ></div>
            </div>
            <p className="absolute bottom-24 text-white/80 font-medium tracking-wide bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm">
              قم بتوجيه الكاميرا نحو الباركود
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isInitializing && !error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute bottom-12 left-6 right-6 bg-red-500/90 text-white p-4 rounded-xl text-center z-50 shadow-lg backdrop-blur-sm border border-red-400">
          <p className="font-medium mb-2">{error}</p>
          <button 
            onClick={() => startScanner(activeCameraId)}
            className="px-6 py-2 bg-white text-red-600 rounded-full font-bold text-sm hover:bg-red-50 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;

