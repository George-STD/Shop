import { useState } from 'react';
import { FiX, FiExternalLink, FiCheck } from 'react-icons/fi';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [manualBarcode, setManualBarcode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-gray-800 text-lg font-bold tracking-wide">مسح الباركود</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* External Scanner Link */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm text-blue-800 font-medium">
              للحصول على أفضل وأسرع نتيجة، قم باستخدام هذه الأداة الخارجية لمسح الباركود ثم انسخ الرقم والصقه هنا.
            </p>
            <a 
              href="https://www.barcodestalk.com/free-online-barcode-scanner" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
              <FiExternalLink size={18} />
              فتح أداة المسح (Barcodestalk)
            </a>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">أو</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-bold text-gray-700 mb-2">
                رقم الباركود
              </label>
              <input
                type="text"
                id="barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="أدخل رقم الباركود هنا..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-left text-lg font-mono tracking-widest text-gray-800 transition-all outline-none"
                dir="ltr"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={!manualBarcode.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <FiCheck size={20} />
              متابعة وبحث عن المنتج
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;

