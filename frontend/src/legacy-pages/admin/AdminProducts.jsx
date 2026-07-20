import { useState } from 'react';
import { STRINGS } from '../../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, categoriesAPI, occasionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/admin/BarcodeScanner';
import BulkVisionUploader from '../../components/admin/BulkVisionUploader';

// Extracted Components
import AdminProductsHeader from '../../components/admin/products/AdminProductsHeader';
import AdminProductsTable from '../../components/admin/products/AdminProductsTable';
import ProductFormModal from '../../components/admin/products/ProductFormModal';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAiUploader, setShowAiUploader] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const initialFormState = {
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: [],
    stock: '',
    sku: '',
    images: [{ url: '', alt: '', variantTags: {} }],
    hasColors: false,
    colors: [],
    hasShapes: false,
    shapes: [],
    hasVariantGroups: false,
    variantGroups: [],
    occasions: [],
    recipients: [],
    isActive: true,
    isFeatured: false,
    isBestseller: false,
    canBeAddedToBox: false,
    isCustomBox: false,
    boxSlots: [],
  };

  const [formData, setFormData] = useState(initialFormState);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', { search, category: categoryFilter, page }],
    queryFn: () =>
      adminAPI
        .getProducts({
          search: search || undefined,
          category: categoryFilter || undefined,
          page,
          limit: 20,
        })
        .then((res) => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data.data),
  });

  const { data: occasionsList } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (data) => adminAPI.bulkProductAction(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-products']);
      setSelectedIds([]);
      toast.success(res.data?.message || 'تم التنفيذ بنجاح');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل تنفيذ الإجراء');
    }
  });

  const handleBulkAction = (action, categoryId = null) => {
    if (selectedIds.length === 0) return;
    
    let confirmMsg = '';
    if (action === 'delete') confirmMsg = 'هل أنت متأكد من حذف المنتجات المحددة نهائياً؟';
    else confirmMsg = 'هل أنت متأكد من تطبيق هذا الإجراء على المنتجات المحددة؟';
    
    if (!window.confirm(confirmMsg)) return;

    bulkMutation.mutate({
      productIds: selectedIds,
      action,
      data: categoryId ? { categoryId } : undefined
    });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      comparePrice: product.comparePrice || '',
      category: Array.isArray(product.category)
        ? product.category.map((c) => c._id || c)
        : product.category
          ? [product.category._id || product.category]
          : [],
      stock: product.stock,
      sku: product.sku || '',
      images: product.images?.length
        ? product.images.map((img) => ({
            url: img.url,
            alt: img.alt || '',
            variantTags: img.variantTags || {},
          }))
        : [{ url: '', alt: '', variantTags: {} }],
      hasColors: product.colors && product.colors.length > 0,
      colors: product.colors || [],
      hasShapes: product.shapes && product.shapes.length > 0,
      shapes: product.shapes || [],
      hasVariantGroups: product.variantGroups && product.variantGroups.length > 0,
      variantGroups: product.variantGroups || [],
      occasions: product.occasions || [],
      recipients: product.recipients || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      isBestseller: product.isBestseller || false,
      canBeAddedToBox: product.canBeAddedToBox || false,
      isCustomBox: product.isCustomBox || false,
      boxSlots: product.boxSlots || [],
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: Number(formData.price),
      comparePrice: formData.comparePrice ? Number(formData.comparePrice) : undefined,
      stock: Number(formData.stock),
      images: formData.images.filter((img) => img.url),
      variantGroups: formData.hasVariantGroups
        ? formData.variantGroups
            .filter((g) => g.name)
            .map((g) => ({
              ...g,
              options: g.options.filter((o) => o.name),
            }))
        : [],
    };
    delete data.hasColors;
    delete data.hasShapes;
    delete data.hasVariantGroups;

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_PRODUCT(product.name))) {
      deleteMutation.mutate(product._id);
    }
  };

  const handleSelectAll = (isChecked, allIds) => {
    if (isChecked) {
      const newSelected = [...new Set([...selectedIds, ...allIds])];
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(selectedIds.filter(id => !allIds.includes(id)));
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false);
    const toastId = toast.loading(STRINGS.ADMIN.NOTIFICATIONS.SEARCHING_BARCODE);
    try {
      const res = await adminAPI.barcodeLookup(barcode);
      const { success, source, data } = res.data;

      if (success && source === 'local') {
        // Product found in our database — open edit form with all its data
        toast.success('تم العثور على المنتج في المتجر', { id: toastId });
        handleEdit(data);
        return;
      }

      // Smart Defaults Logic
      const getSmartDefaults = (name, desc) => {
        const text = `${name || ''} ${desc || ''}`.toLowerCase();
        let matchedOccs = new Set();
        let matchedRecs = new Set();
        
        const matches = (keywords) => keywords.some(k => text.includes(k));

        if (matches(['شوكولاتة', 'شيكولاتة', 'chocolate', 'حلوى', 'حلويات', 'كيك', 'cake', 'candy', 'مورو', 'moro'])) {
          ['عيد الحب', 'عيد ميلاد', 'تخرج', 'عيد الأم'].forEach(o => matchedOccs.add(o));
          ['زوجة', 'صديقة', 'أم', 'أطفال', 'أخت', 'صديق'].forEach(r => matchedRecs.add(r));
        }
        if (matches(['ورد', 'زهور', 'flower', 'rose', 'باقة'])) {
          ['عيد الحب', 'ذكرى زواج', 'عيد الأم'].forEach(o => matchedOccs.add(o));
          ['زوجة', 'أم', 'صديقة'].forEach(r => matchedRecs.add(r));
        }
        if (matches(['رجالي', 'men', 'حلاقة', 'محفظة', 'ساعة رجالي', 'عطر رجالي', 'مكينة'])) {
          ['زوج', 'أب', 'أخ', 'صديق'].forEach(r => matchedRecs.add(r));
          ['عيد ميلاد', 'تخرج'].forEach(o => matchedOccs.add(o));
        }
        if (matches(['حريمي', 'نسائي', 'women', 'مكياج', 'ميكب', 'عطر نسائي'])) {
          ['زوجة', 'صديقة', 'أم', 'أخت'].forEach(r => matchedRecs.add(r));
          ['عيد الحب', 'عيد ميلاد'].forEach(o => matchedOccs.add(o));
        }
        if (matches(['لعبة', 'ألعاب', 'دبدوب', 'toy', 'kids', 'أطفال', 'بيبي', 'baby'])) {
          ['أطفال'].forEach(r => matchedRecs.add(r));
          ['عيد ميلاد', 'نجاح'].forEach(o => matchedOccs.add(o));
        }

        const availableOccs = occasionsList ? occasionsList.map(o => o.name) : [];
        const availableRecs = STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST || [];

        let finalOccs = [...matchedOccs].filter(o => availableOccs.includes(o));
        let finalRecs = [...matchedRecs].filter(r => availableRecs.includes(r));
        let finalCats = categories ? categories.filter(c => matches([c.name.toLowerCase()])).map(c => c._id) : [];

        // Fallbacks if no keywords matched
        if (finalOccs.length === 0) finalOccs = availableOccs;
        if (finalRecs.length === 0) finalRecs = availableRecs;
        if (finalCats.length === 0) finalCats = categories ? categories.map(c => c._id) : [];

        return { finalOccs, finalRecs, finalCats };
      };

      if (success && (source === 'openfoodfacts' || source === 'upcitemdb')) {
        const { finalOccs, finalRecs, finalCats } = getSmartDefaults(data.name, data.description);

        // Product found in external database — pre-fill the add form
        resetForm();
        setFormData((prev) => ({
          ...prev,
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          stock: 10,
          sku: data.sku || barcode,
          category: finalCats,
          images: data.images?.length ? data.images : [{ url: '', alt: '', variantTags: {} }],
          occasions: finalOccs,
          recipients: finalRecs,
        }));
        setShowModal(true);
        toast.success(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_FOUND, { id: toastId });
        return;
      }

      // Not found anywhere — open empty form with barcode as SKU
      toast.error(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_NOT_FOUND, { id: toastId });
      const { finalOccs: emptyOccs, finalRecs: emptyRecs, finalCats: emptyCats } = getSmartDefaults('', '');
      resetForm();
      setFormData((prev) => ({ 
        ...prev, 
        sku: barcode,
        category: emptyCats,
        occasions: emptyOccs,
        recipients: emptyRecs,
      }));
      setShowModal(true);
    } catch (error) {
      console.error(error);
      toast.error(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_ERROR, { id: toastId });
      const availableOccs = occasionsList ? occasionsList.map(o => o.name) : [];
      const availableRecs = STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST || [];
      const allCats = categories ? categories.map(c => c._id) : [];
      resetForm();
      setFormData((prev) => ({ 
        ...prev, 
        sku: barcode,
        category: allCats,
        occasions: availableOccs,
        recipients: availableRecs,
      }));
      setShowModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <AdminProductsHeader
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        setShowScanner={setShowScanner}
        setShowAiUploader={setShowAiUploader}
        setShowModal={setShowModal}
        resetForm={resetForm}
      />

      {selectedIds.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm animate-fade-in-up">
          <div className="text-purple-800 font-medium text-sm flex items-center gap-2">
            <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded-full text-xs font-bold">{selectedIds.length}</span>
            <span>منتجات محددة</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select 
              className="px-3 py-2 rounded-lg border-purple-200 text-purple-800 bg-white focus:ring-purple-500 focus:border-purple-500 shadow-sm outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAction('addCategory', e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">إضافة لفئة...</option>
              {categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <button onClick={() => handleBulkAction('activate')} className="px-4 py-2 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors shadow-sm font-medium">
              تفعيل
            </button>
            <button onClick={() => handleBulkAction('deactivate')} className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium">
              تعطيل
            </button>
            <button onClick={() => handleBulkAction('delete')} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm font-medium">
              حذف
            </button>
          </div>
        </div>
      )}

      <AdminProductsTable
        products={products}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        selectedIds={selectedIds}
        handleSelect={handleSelect}
        handleSelectAll={handleSelectAll}
      />

      <ProductFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        categories={categories}
        occasionsList={occasionsList}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />

      {showScanner && (
        <BarcodeScanner onClose={() => setShowScanner(false)} onScan={handleBarcodeScan} />
      )}

      <BulkVisionUploader 
        isOpen={showAiUploader} 
        onClose={() => setShowAiUploader(false)} 
        categories={categories}
        occasionsList={occasionsList}
        onSuccess={() => queryClient.invalidateQueries(['admin-products'])}
      />
    </div>
  );
};

export default AdminProducts;
