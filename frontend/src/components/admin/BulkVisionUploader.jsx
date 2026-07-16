import { useState, useRef, useCallback, useEffect } from 'react';
import { FiUploadCloud, FiX, FiCheck, FiCpu, FiImage, FiSave, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const BulkVisionUploader = ({ isOpen, onClose, categories = [], occasionsList = [], onSuccess }) => {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Reset all state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      // Revoke all blob URLs to prevent memory leaks
      items.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
      setItems([]);
      setIsProcessing(false);
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newItems = imageFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle', // idle | processing | success | error
      data: null,
      errorMessage: '',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateItem = (id, updates) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const updateItemData = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.data) {
          return { ...item, data: { ...item.data, [field]: value } };
        }
        return item;
      })
    );
  };

  const processAll = async () => {
    const idleItems = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (idleItems.length === 0) return toast('لا توجد صور جديدة للمعالجة');

    setIsProcessing(true);
    let successCount = 0;

    for (const item of idleItems) {
      updateItem(item.id, { status: 'processing' });
      try {
        const formData = new FormData();
        formData.append('images', item.file);

        const res = await adminAPI.aiVisionAnalyze(formData);
        const { success, data, message } = res.data;

        if (success) {
          // Map AI-returned category names → our category IDs
          const matchedCategoryIds = [];
          if (data.categories && Array.isArray(data.categories)) {
            data.categories.forEach((catName) => {
              const matched = categories.find(
                (c) => c.name === catName || c.name.includes(catName) || catName.includes(c.name)
              );
              if (matched) matchedCategoryIds.push(matched._id);
            });
          }

          // Map AI-returned occasion names → our occasion names
          const matchedOccasions = [];
          if (data.occasions && Array.isArray(data.occasions)) {
            data.occasions.forEach((occName) => {
              const matched = occasionsList.find(
                (o) => o.name === occName || o.name.includes(occName) || occName.includes(o.name)
              );
              if (matched) matchedOccasions.push(matched.name);
            });
          }

          updateItem(item.id, {
            status: 'success',
            data: {
              ...data,
              price: data.price || '',
              category: matchedCategoryIds.length
                ? matchedCategoryIds
                : categories.length
                  ? [categories[0]._id]
                  : [],
              occasions: matchedOccasions,
              stock: 10,
            },
          });
          successCount++;
        } else {
          updateItem(item.id, { status: 'error', errorMessage: message || 'فشل التحليل' });
        }
      } catch (err) {
        updateItem(item.id, {
          status: 'error',
          errorMessage: err.response?.data?.message || 'فشل في الاتصال بالذكاء الاصطناعي',
        });
      }
    }

    setIsProcessing(false);
    if (successCount > 0) {
      toast.success(`تم معالجة ${successCount} صورة بنجاح`);
    }
  };

  const saveAll = async () => {
    const readyItems = items.filter((i) => i.status === 'success' && i.data);
    if (readyItems.length === 0) return toast.error('لا توجد منتجات جاهزة للحفظ');

    // Validate prices
    const missingPrice = readyItems.find(
      (i) => !i.data.price || isNaN(Number(i.data.price)) || Number(i.data.price) <= 0
    );
    if (missingPrice) {
      return toast.error('الرجاء التأكد من كتابة سعر صالح لجميع المنتجات قبل الحفظ');
    }

    setIsSaving(true);
    const toastId = toast.loading('جاري حفظ المنتجات في المتجر...');

    try {
      const productsPayload = readyItems.map((item) => ({
        name: item.data.name,
        description: item.data.description,
        price: Number(item.data.price),
        stock: Number(item.data.stock) || 10,
        category: item.data.category,
        occasions: item.data.occasions,
        recipients: item.data.recipients,
        images: item.data.images,
      }));

      const res = await adminAPI.createBulkProducts({ products: productsPayload });
      if (res.data.success) {
        toast.success(`تم حفظ ${res.data.count} منتج بنجاح! 🎉`, { id: toastId });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ المنتجات', { id: toastId });
    }
    setIsSaving(false);
  };

  const successCount = items.filter((i) => i.status === 'success').length;
  const pendingCount = items.filter((i) => i.status === 'idle' || i.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FiCpu size={24} className={isProcessing ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Auto Data Entry Robot</h2>
              <p className="text-sm text-gray-500">ارفع الصور ودع الذكاء الاصطناعي يستخرج البيانات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isSaving}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            /* ---- Drop Zone ---- */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group"
            >
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiUploadCloud size={40} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">اسحب وأفلت صور المنتجات هنا</h3>
              <p className="text-gray-500">أو اضغط لاختيار الصور من جهازك</p>
              <p className="text-gray-400 text-sm mt-2">JPG, PNG, WebP — حد أقصى 5 ميجا للصورة</p>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = ''; // allow re-selecting the same files
                }}
              />
            </div>
          ) : (
            <>
              {/* ---- Toolbar ---- */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 font-semibold rounded-lg text-sm">
                    {items.length} صور
                  </span>
                  {successCount > 0 && (
                    <span className="px-3 py-1 bg-green-50 text-green-600 font-semibold rounded-lg text-sm">
                      {successCount} جاهز
                    </span>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-semibold text-gray-600 hover:text-blue-600 flex items-center gap-2"
                  >
                    <FiImage /> إضافة صور أخرى
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={processAll}
                    disabled={isProcessing || pendingCount === 0}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isProcessing ? <FiCpu className="animate-spin" /> : <FiCpu />}
                    {isProcessing ? 'جاري التحليل...' : 'بدء التحليل بالذكاء الاصطناعي'}
                  </button>
                  <button
                    onClick={saveAll}
                    disabled={isSaving || successCount === 0}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isSaving ? <FiSave className="animate-pulse" /> : <FiCheck />}
                    حفظ المنتجات الجاهزة ({successCount})
                  </button>
                </div>
              </div>

              {/* ---- Grid ---- */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="relative h-48 bg-gray-100 border-b border-gray-100">
                      <img src={item.preview} alt="preview" className="w-full h-full object-contain" />
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isProcessing}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg backdrop-blur-sm transition-colors disabled:opacity-50"
                      >
                        <FiX size={18} />
                      </button>

                      {/* Status Badge */}
                      <div
                        className={`absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md shadow-sm ${item.status === 'idle'
                            ? 'bg-white/80 text-gray-600'
                            : item.status === 'processing'
                              ? 'bg-blue-500/90 text-white animate-pulse'
                              : item.status === 'success'
                                ? 'bg-green-500/90 text-white'
                                : 'bg-red-500/90 text-white'
                          }`}
                      >
                        {item.status === 'idle' && 'في الانتظار'}
                        {item.status === 'processing' && (
                          <>
                            <FiCpu className="animate-spin" /> جاري التحليل...
                          </>
                        )}
                        {item.status === 'success' && (
                          <>
                            <FiCheck /> جاهز للمراجعة
                          </>
                        )}
                        {item.status === 'error' && (
                          <>
                            <FiAlertCircle /> خطأ
                          </>
                        )}
                      </div>
                    </div>

                    {/* Item Form / Data */}
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      {item.status === 'success' && item.data ? (
                        <>
                          <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">اسم المنتج</label>
                            <input
                              type="text"
                              value={item.data.name}
                              onChange={(e) => updateItemData(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-1 block">السعر (ج.م) *</label>
                              <input
                                type="number"
                                value={item.data.price}
                                onChange={(e) => updateItemData(item.id, 'price', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-orange-200 bg-orange-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 mb-1 block">الكمية المتاحة</label>
                              <input
                                type="number"
                                value={item.data.stock}
                                onChange={(e) => updateItemData(item.id, 'stock', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">الفئة المقترحة</label>
                            <select
                              value={item.data.category?.[0] || ''}
                              onChange={(e) => updateItemData(item.id, 'category', [e.target.value])}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
                            >
                              <option value="">-- اختر الفئة --</option>
                              {categories.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">الوصف</label>
                            <textarea
                              value={item.data.description}
                              onChange={(e) => updateItemData(item.id, 'description', e.target.value)}
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm resize-none"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-4">
                          {item.status === 'error' ? (
                            <p className="text-sm text-red-500 font-medium">{item.errorMessage}</p>
                          ) : (
                            <p className="text-sm text-gray-400">
                              في انتظار التحليل بالذكاء الاصطناعي لملء البيانات أوتوماتيكياً...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkVisionUploader;
