import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX, FiRefreshCcw } from 'react-icons/fi';
import { STRINGS } from '../../constants';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startScanner = async (cameraId) => {
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

      const config = {
        fps: 15, // Higher FPS for faster scanning
        qrbox: { width: 250, height: 150 }, // Aspect ratio similar to standard barcodes
        aspectRatio: 1.777778, // 16:9
        videoConstraints: {
          advanced: [{ focusMode: "continuous" }] // Attempt to force continuous auto-focus
        }
      };

      await scannerRef.current.start(
        cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              onScan(decodedText);
            }).catch(console.error);
          } else {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Parse errors are very frequent as it scans frames without barcodes, so we ignore them.
        }
      );
      
      setIsInitializing(false);
    } catch (err) {
      console.error(err);
      setError('تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحيات.');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Get cameras and start
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prioritize back camera
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const targetCameraId = backCamera ? backCamera.id : devices[0].id;
        setActiveCameraId(targetCameraId);
        startScanner(targetCameraId);
      } else {
        startScanner(); // Fallback to environment facingMode
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
      startScanner(); // Fallback
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const switchCamera = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      setActiveCameraId(nextCamera.id);
      startScanner(nextCamera.id);
    }
  };

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
          {cameras.length > 1 && (
            <button 
              onClick={switchCamera} 
              className="p-3 text-white bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all active:scale-95"
            >
              <FiRefreshCcw size={24} />
            </button>
          )}
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

