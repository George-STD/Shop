import { useState } from 'react';
import { STRINGS } from '../../constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, categoriesAPI, occasionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/admin/BarcodeScanner';

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
  const [editingProduct, setEditingProduct] = useState(null);

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

      // Pre-fill occasions and recipients to be all selected for new items via barcode
      const defaultOccasions = occasionsList ? occasionsList.map(o => o.name) : [];
      const defaultRecipients = STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST || [];

      if (success && (source === 'openfoodfacts' || source === 'upcitemdb')) {
        // Product found in external database — pre-fill the add form
        resetForm();
        setFormData((prev) => ({
          ...prev,
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          stock: 10,
          sku: data.sku || barcode,
          category: categories?.[0]?._id ? [categories[0]._id] : [],
          images: data.images?.length ? data.images : [{ url: '', alt: '', variantTags: {} }],
          occasions: defaultOccasions,
          recipients: defaultRecipients,
        }));
        setShowModal(true);
        toast.success(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_FOUND, { id: toastId });
        return;
      }

      // Not found anywhere — open empty form with barcode as SKU
      toast.error(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_NOT_FOUND, { id: toastId });
      resetForm();
      setFormData((prev) => ({ 
        ...prev, 
        sku: barcode,
        occasions: defaultOccasions,
        recipients: defaultRecipients,
      }));
      setShowModal(true);
    } catch (error) {
      console.error(error);
      toast.error(STRINGS.ADMIN.NOTIFICATIONS.BARCODE_ERROR, { id: toastId });
      const defaultOccasions = occasionsList ? occasionsList.map(o => o.name) : [];
      const defaultRecipients = STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST || [];
      resetForm();
      setFormData((prev) => ({ 
        ...prev, 
        sku: barcode,
        occasions: defaultOccasions,
        recipients: defaultRecipients,
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
        setShowModal={setShowModal}
        resetForm={resetForm}
      />

      <AdminProductsTable
        products={products}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
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
    </div>
  );
};

export default AdminProducts;
