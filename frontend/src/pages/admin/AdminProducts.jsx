import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi'
import { adminAPI, productsAPI, categoriesAPI } from '../../services/api'

const AdminProducts = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '',
    stock: '',
    sku: '',
    images: [{ url: '', alt: '' }],
    hasColors: false,
    colors: [],
    recipients: [],
    isActive: true,
    isFeatured: false,
    isBestseller: false
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', { search, category: categoryFilter, page }],
    queryFn: () => productsAPI.getAll({ 
      search: search || undefined, 
      category: categoryFilter || undefined,
      page,
      limit: 20 
    }).then(res => res.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      setShowModal(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      setShowModal(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      category: '',
      stock: '',
      sku: '',
      images: [{ url: '', alt: '' }],
      hasColors: false,
      colors: [],
      recipients: [],
      isActive: true,
      isFeatured: false,
      isBestseller: false
    })
    setEditingProduct(null)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      comparePrice: product.comparePrice || '',
      category: product.category?._id || product.category,
      stock: product.stock,
      sku: product.sku || '',
      images: product.images?.length ? product.images : [{ url: '', alt: '' }],
      hasColors: product.colors && product.colors.length > 0,
      colors: product.colors || [],
      recipients: product.recipients || [],
      isActive: product.isActive,
      isFeatured: product.isFeatured || false,
      isBestseller: product.isBestseller || false
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      price: Number(formData.price),
      comparePrice: formData.comparePrice ? Number(formData.comparePrice) : undefined,
      stock: Number(formData.stock),
      images: formData.images.filter(img => img.url)
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (product) => {
    if (window.confirm(`هل تريد حذف المنتج "${product.name}"؟`)) {
      deleteMutation.mutate(product._id)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">جميع الفئات</option>
            {categories?.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600"
        >
          <FiPlus />
          إضافة منتج
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-xs md:text-sm">
                  <tr>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">المنتج</th>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">الفئة</th>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">السعر</th>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">المخزون</th>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">الحالة</th>
                    <th className="text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products?.data?.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-medium text-xs sm:text-sm">{product.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6 text-gray-600">
                        {product.category?.name || '-'}
                      </td>
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                        <span className="font-medium text-xs sm:text-sm">{formatCurrency(product.price)}</span>
                        {product.comparePrice && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through mr-2">
                            {formatCurrency(product.comparePrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                        <span className={`${product.stock < 10 ? 'text-red-600' : 'text-gray-600'} text-xs sm:text-sm`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                        <span className={`px-1 py-1 rounded-full text-xs ${
                          product.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isActive ? 'نشط' : 'مخفي'}
                        </span>
                      </td>
                      <td className="py-1 px-1 sm:py-2 sm:px-2 md:py-4 md:px-6">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="تعديل"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="حذف"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {products?.pagination && (
              <div className="p-2 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-gray-600 text-xs sm:text-sm">
                  عرض {products.data.length} من {products.pagination.total} منتج
                </p>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 sm:px-4 py-1 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                  >
                    السابق
                  </button>
                  <span className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                    صفحة {page} من {products.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(products.pagination.pages, p + 1))}
                    disabled={page >= products.pagination.pages}
                    className="px-2 sm:px-4 py-1 sm:py-2 border rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-2 sm:p-6 space-y-3 sm:space-y-4">
                                          {/* Recipients (هدية لـ) */}
                                          <div>
                                            <label className="block text-sm font-medium mb-1">ينفع هدية لـ</label>
                                            <div className="flex flex-wrap gap-2">
                                              {['زوجة', 'زوج', 'أم', 'أب', 'أخت', 'أخ', 'صديقة', 'صديق', 'أطفال', 'عروسين'].map((rec) => (
                                                <label key={rec} className="flex items-center gap-1 cursor-pointer border rounded px-2 py-1">
                                                  <input
                                                    type="checkbox"
                                                    checked={formData.recipients.includes(rec)}
                                                    onChange={e => {
                                                      if (e.target.checked) {
                                                        setFormData({ ...formData, recipients: [...formData.recipients, rec] })
                                                      } else {
                                                        setFormData({ ...formData, recipients: formData.recipients.filter(r => r !== rec) })
                                                      }
                                                    }}
                                                    className="rounded"
                                                  />
                                                  <span>{rec}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                            {/* Allow color selection toggle */}
                            <div>
                              <label className="block text-sm font-medium mb-1">هل يمكن اختيار لون المنتج؟</label>
                              <input
                                type="checkbox"
                                checked={formData.hasColors}
                                onChange={e => setFormData({ ...formData, hasColors: e.target.checked, colors: e.target.checked ? (formData.colors.length ? formData.colors : [{ name: '', hex: '' }]) : [] })}
                                className="mr-2"
                              />
                              <span>نعم</span>
                            </div>

                            {/* If hasColors, show color options */}
                            {formData.hasColors && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium mb-1">ألوان المنتج</label>
                                {formData.colors.map((color, idx) => (
                                  <div key={idx} className="flex items-center gap-2 mb-2">
                                    <input
                                      type="text"
                                      placeholder="اسم اللون"
                                      value={color.name}
                                      onChange={e => {
                                        const newColors = [...formData.colors];
                                        newColors[idx].name = e.target.value;
                                        setFormData({ ...formData, colors: newColors });
                                      }}
                                      className="border rounded-lg px-2 py-1"
                                    />
                                    <input
                                      type="color"
                                      value={color.hex || '#000000'}
                                      onChange={e => {
                                        const newColors = [...formData.colors];
                                        newColors[idx].hex = e.target.value;
                                        setFormData({ ...formData, colors: newColors });
                                      }}
                                      className="w-8 h-8 border rounded"
                                    />
                                    <button type="button" onClick={() => {
                                      const newColors = formData.colors.filter((_, i) => i !== idx);
                                      setFormData({ ...formData, colors: newColors });
                                    }} className="text-red-500 px-2">حذف</button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => setFormData({ ...formData, colors: [...formData.colors, { name: '', hex: '' }] })} className="text-blue-600">إضافة لون</button>
                              </div>
                            )}
              <div>
                <label className="block text-sm font-medium mb-1">اسم المنتج</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رمز المنتج (SKU)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: SKU-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">السعر</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر قبل الخصم</label>
                  <input
                    type="number"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الفئة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">اختر الفئة</option>
                    {categories?.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الكمية في المخزون</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">رابط الصورة</label>
                <input
                  type="url"
                  value={formData.images[0]?.url || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    images: [{ url: e.target.value, alt: formData.name }] 
                  })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span>نشط</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  <span>مميز</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestseller}
                    onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                    className="rounded"
                  />
                  <span>الأكثر مبيعاً</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-lg py-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts
