import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';
import { STRINGS } from '../../constants';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const onScanRef = useRef(onScan);

  // Keep the ref up to date without re-triggering useEffect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
    };

    const scanner = new Html5QrcodeScanner('reader', scannerConfig, false);

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScanRef.current(decodedText);
      },
      (err) => {
        // We can ignore frequent scanning errors unless it's a fatal camera error
        console.warn(err);
      }
    );

    return () => {
      scanner.clear().catch((e) => console.error('Failed to clear scanner', e));
    };
  }, []); // Empty deps — scanner initializes once

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
        >
          <FiX className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">{STRINGS.ADMIN.BARCODE_SCANNER.SCAN_BARCODE}</h2>
        <div id="reader" className="w-full overflow-hidden rounded-xl border border-gray-200"></div>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        <p className="text-gray-500 text-sm mt-4 text-center">
          {STRINGS.ADMIN.BARCODE_SCANNER.SCAN_INSTRUCTIONS}
        </p>
      </div>
    </div>
  );
};

export default BarcodeScanner;

