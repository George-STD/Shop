import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi'
import { adminAPI, productsAPI, categoriesAPI, occasionsAPI } from '../../services/api'

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
    isCustomBox: false,
    boxSlots: []
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', { search, category: categoryFilter, page }],
    queryFn: () => productsAPI.getAll({ 
      search: search || undefined, 
      category: categoryFilter || undefined,
      page,
      limit: 20 
    }).then(res => res.data)
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data.data)
  });

  const { data: occasionsList } = useQuery({
    queryKey: ['occasions'],
    queryFn: () => occasionsAPI.getAll().then(res => res.data.data)
  });

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
      isCustomBox: false,
      boxSlots: []
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
      images: product.images?.length ? product.images.map(img => ({ url: img.url, alt: img.alt || '', variantTags: img.variantTags || {} })) : [{ url: '', alt: '', variantTags: {} }],
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
      isCustomBox: product.isCustomBox || false,
      boxSlots: product.boxSlots || []
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
      images: formData.images.filter(img => img.url),
      variantGroups: formData.hasVariantGroups ? formData.variantGroups.filter(g => g.name).map(g => ({
        ...g,
        options: g.options.filter(o => o.name)
      })) : []
    }
    delete data.hasColors
    delete data.hasShapes
    delete data.hasVariantGroups

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
                                          {/* Occasions (المناسبات) */}
                                          <div>
                                            <label className="block text-sm font-medium mb-1">المناسبات</label>
                                            <div className="flex flex-wrap gap-2">
                                              {occasionsList?.map((occ) => (
                                                <label key={occ._id} className={`flex items-center gap-1 cursor-pointer border rounded-lg px-3 py-1.5 transition-colors ${
                                                  formData.occasions.includes(occ.name)
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-300 hover:border-purple-300'
                                                }`}>
                                                  <input
                                                    type="checkbox"
                                                    checked={formData.occasions.includes(occ.name)}
                                                    onChange={e => {
                                                      if (e.target.checked) {
                                                        setFormData({ ...formData, occasions: [...formData.occasions, occ.name] })
                                                      } else {
                                                        setFormData({ ...formData, occasions: formData.occasions.filter(o => o !== occ.name) })
                                                      }
                                                    }}
                                                    className="rounded"
                                                  />
                                                  <span>{occ.icon}</span>
                                                  <span>{occ.name}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>

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

                            {/* Shapes toggle */}
                            <div>
                              <label className="block text-sm font-medium mb-1">هل المنتج له أشكال متعددة؟</label>
                              <input
                                type="checkbox"
                                checked={formData.hasShapes}
                                onChange={e => setFormData({ ...formData, hasShapes: e.target.checked, shapes: e.target.checked ? (formData.shapes.length ? formData.shapes : [{ name: '', images: [''] }]) : [] })}
                                className="mr-2"
                              />
                              <span>نعم</span>
                            </div>

                            {formData.hasShapes && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium mb-1">أشكال المنتج</label>
                                {formData.shapes.map((shape, idx) => (
                                  <div key={idx} className="bg-gray-50 p-2 rounded-lg space-y-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="اسم الشكل"
                                        value={shape.name}
                                        onChange={e => {
                                          const newShapes = [...formData.shapes];
                                          newShapes[idx] = { ...newShapes[idx], name: e.target.value };
                                          setFormData({ ...formData, shapes: newShapes });
                                        }}
                                        className="flex-1 min-w-[120px] border rounded-lg px-2 py-1"
                                      />
                                      <button type="button" onClick={() => {
                                        const newShapes = formData.shapes.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, shapes: newShapes });
                                      }} className="text-red-500 px-2">حذف</button>
                                    </div>
                                    <div className="space-y-1 mr-4">
                                      {(shape.images || [shape.image].filter(Boolean)).map((imgUrl, imgIdx) => (
                                        <div key={imgIdx} className="flex items-center gap-1">
                                          <input
                                            type="url"
                                            placeholder={`رابط الصورة ${imgIdx + 1}`}
                                            value={imgUrl || ''}
                                            onChange={e => {
                                              const newShapes = [...formData.shapes];
                                              const newImages = [...(newShapes[idx].images || [newShapes[idx].image].filter(Boolean))];
                                              newImages[imgIdx] = e.target.value;
                                              newShapes[idx] = { ...newShapes[idx], images: newImages };
                                              setFormData({ ...formData, shapes: newShapes });
                                            }}
                                            className="flex-1 border rounded px-2 py-1 text-xs"
                                          />
                                          {imgUrl && <img src={imgUrl} alt="" className="w-8 h-8 object-cover rounded border" />}
                                          {(shape.images || [shape.image].filter(Boolean)).length > 1 && (
                                            <button type="button" onClick={() => {
                                              const newShapes = [...formData.shapes];
                                              const newImages = [...(newShapes[idx].images || [])].filter((_, i) => i !== imgIdx);
                                              newShapes[idx] = { ...newShapes[idx], images: newImages };
                                              setFormData({ ...formData, shapes: newShapes });
                                            }} className="text-red-300 hover:text-red-500 text-xs">✕</button>
                                          )}
                                        </div>
                                      ))}
                                      <button type="button" onClick={() => {
                                        const newShapes = [...formData.shapes];
                                        const currentImages = newShapes[idx].images || [newShapes[idx].image].filter(Boolean);
                                        newShapes[idx] = { ...newShapes[idx], images: [...currentImages, ''] };
                                        setFormData({ ...formData, shapes: newShapes });
                                      }} className="text-purple-500 text-xs hover:underline">+ صورة إضافية</button>
                                    </div>
                                  </div>
                                ))}
                                <button type="button" onClick={() => setFormData({ ...formData, shapes: [...formData.shapes, { name: '', images: [''] }] })} className="text-purple-600">إضافة شكل</button>
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

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-1">صور المنتج</label>
                <div className="space-y-3">
                  {formData.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder={`رابط الصورة ${imgIdx + 1}`}
                          value={img.url || ''}
                          onChange={(e) => {
                            const newImages = [...formData.images]
                            newImages[imgIdx] = { ...newImages[imgIdx], url: e.target.value, alt: formData.name }
                            setFormData({ ...formData, images: newImages })
                          }}
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        {img.url && <img src={img.url} alt="" className="w-10 h-10 object-cover rounded border" />}
                        {formData.images.length > 1 && (
                          <button type="button" onClick={() => {
                            setFormData({ ...formData, images: formData.images.filter((_, i) => i !== imgIdx) })
                          }} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        )}
                      </div>
                      {/* Variant tags for this image */}
                      {formData.hasVariantGroups && formData.variantGroups.length > 0 && (
                        <div className="flex flex-wrap gap-2 mr-2">
                          {formData.variantGroups.filter(g => g.name).map(group => (
                            <div key={group.name} className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">{group.name}:</span>
                              <select
                                value={(img.variantTags || {})[group.name] || ''}
                                onChange={(e) => {
                                  const newImages = [...formData.images]
                                  const newTags = { ...(newImages[imgIdx].variantTags || {}) }
                                  if (e.target.value) {
                                    newTags[group.name] = e.target.value
                                  } else {
                                    delete newTags[group.name]
                                  }
                                  newImages[imgIdx] = { ...newImages[imgIdx], variantTags: newTags }
                                  setFormData({ ...formData, images: newImages })
                                }}
                                className="border rounded px-2 py-0.5 text-xs bg-white"
                              >
                                <option value="">الكل</option>
                                {group.options?.filter(o => o.name).map(opt => (
                                  <option key={opt.name} value={opt.name}>{opt.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    setFormData({ ...formData, images: [...formData.images, { url: '', alt: '', variantTags: {} }] })
                  }} className="text-purple-600 text-sm hover:underline">+ إضافة صورة</button>
                </div>
              </div>

              {/* Variant Groups */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasVariantGroups}
                    onChange={e => setFormData({ ...formData, hasVariantGroups: e.target.checked, variantGroups: e.target.checked ? (formData.variantGroups.length ? formData.variantGroups : [{ name: '', replaceMainImage: false, options: [{ name: '', thumbnail: '' }] }]) : [] })}
                    className="rounded"
                  />
                  <span className="font-medium">مجموعات اختيارات (تصفية الصور حسب الاختيار)</span>
                </label>
              </div>

              {formData.hasVariantGroups && (
                <div className="space-y-4 border rounded-xl p-4 bg-blue-50/50">
                  <h3 className="font-bold text-blue-700">مجموعات الاختيارات</h3>
                  {formData.variantGroups.map((group, gIdx) => (
                    <div key={gIdx} className="border rounded-lg p-3 bg-white space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="اسم المجموعة (مثال: شكل البوكس)"
                          value={group.name}
                          onChange={(e) => {
                            const newGroups = [...formData.variantGroups]
                            newGroups[gIdx] = { ...newGroups[gIdx], name: e.target.value }
                            setFormData({ ...formData, variantGroups: newGroups })
                          }}
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => {
                          setFormData({ ...formData, variantGroups: formData.variantGroups.filter((_, i) => i !== gIdx) })
                        }} className="text-red-500 hover:text-red-700 text-sm">حذف</button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={group.replaceMainImage || false}
                          onChange={(e) => {
                            const newGroups = formData.variantGroups.map((g, i) => ({
                              ...g,
                              replaceMainImage: i === gIdx ? e.target.checked : false
                            }))
                            setFormData({ ...formData, variantGroups: newGroups })
                          }}
                          className="rounded"
                        />
                        <span>الصورة المصغرة تحل محل الصورة الرئيسية</span>
                      </label>
                      <div className="space-y-2 mr-4">
                        <p className="text-sm text-gray-600 font-medium">الخيارات:</p>
                        {group.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="اسم الاختيار"
                              value={opt.name}
                              onChange={(e) => {
                                const newGroups = [...formData.variantGroups]
                                const newOpts = [...newGroups[gIdx].options]
                                newOpts[oIdx] = { ...newOpts[oIdx], name: e.target.value }
                                newGroups[gIdx] = { ...newGroups[gIdx], options: newOpts }
                                setFormData({ ...formData, variantGroups: newGroups })
                              }}
                              className="flex-1 border rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="url"
                              placeholder="صورة مصغرة (اختياري)"
                              value={opt.thumbnail || ''}
                              onChange={(e) => {
                                const newGroups = [...formData.variantGroups]
                                const newOpts = [...newGroups[gIdx].options]
                                newOpts[oIdx] = { ...newOpts[oIdx], thumbnail: e.target.value }
                                newGroups[gIdx] = { ...newGroups[gIdx], options: newOpts }
                                setFormData({ ...formData, variantGroups: newGroups })
                              }}
                              className="flex-1 border rounded px-2 py-1 text-xs"
                            />
                            {opt.thumbnail && <img src={opt.thumbnail} alt="" className="w-8 h-8 object-cover rounded border" />}
                            {group.options.length > 1 && (
                              <button type="button" onClick={() => {
                                const newGroups = [...formData.variantGroups]
                                newGroups[gIdx] = { ...newGroups[gIdx], options: newGroups[gIdx].options.filter((_, i) => i !== oIdx) }
                                setFormData({ ...formData, variantGroups: newGroups })
                              }} className="text-red-300 hover:text-red-500 text-xs">✕</button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newGroups = [...formData.variantGroups]
                          newGroups[gIdx] = { ...newGroups[gIdx], options: [...newGroups[gIdx].options, { name: '', thumbnail: '' }] }
                          setFormData({ ...formData, variantGroups: newGroups })
                        }} className="text-blue-600 text-sm hover:underline">+ إضافة اختيار</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    setFormData({ ...formData, variantGroups: [...formData.variantGroups, { name: '', replaceMainImage: false, options: [{ name: '', thumbnail: '' }] }] })
                  }} className="w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-lg py-2 hover:bg-blue-50">+ إضافة مجموعة جديدة</button>
                </div>
              )}

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

              {/* Custom Box Toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCustomBox}
                    onChange={(e) => setFormData({ ...formData, isCustomBox: e.target.checked, boxSlots: e.target.checked ? (formData.boxSlots.length ? formData.boxSlots : [{ slotLabel: '', required: true, options: [{ name: '', images: [''] }] }]) : [] })}
                    className="rounded"
                  />
                  <span className="font-medium">بوكس قابل للتخصيص (العميل يختار المحتويات)</span>
                </label>
              </div>

              {/* Box Slots Builder */}
              {formData.isCustomBox && (
                <div className="space-y-4 border rounded-xl p-4 bg-purple-50/50">
                  <h3 className="font-bold text-purple-700">خانات البوكس</h3>
                  {formData.boxSlots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="border rounded-lg p-3 bg-white space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="عنوان الخانة (مثال: اختر المج)"
                          value={slot.slotLabel}
                          onChange={(e) => {
                            const newSlots = [...formData.boxSlots]
                            newSlots[slotIdx] = { ...newSlots[slotIdx], slotLabel: e.target.value }
                            setFormData({ ...formData, boxSlots: newSlots })
                          }}
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                          required
                        />
                        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={slot.required}
                            onChange={(e) => {
                              const newSlots = [...formData.boxSlots]
                              newSlots[slotIdx] = { ...newSlots[slotIdx], required: e.target.checked }
                              setFormData({ ...formData, boxSlots: newSlots })
                            }}
                            className="rounded"
                          />
                          إجباري
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, boxSlots: formData.boxSlots.filter((_, i) => i !== slotIdx) })}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >حذف الخانة</button>
                      </div>

                      {/* Options for this slot */}
                      <div className="space-y-2 mr-4">
                        <p className="text-sm text-gray-600 font-medium">الخيارات:</p>
                        {slot.options.map((opt, optIdx) => (
                          <div key={optIdx} className="bg-gray-50 p-2 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="اسم الخيار"
                                value={opt.name}
                                onChange={(e) => {
                                  const newSlots = [...formData.boxSlots]
                                  const newOpts = [...newSlots[slotIdx].options]
                                  newOpts[optIdx] = { ...newOpts[optIdx], name: e.target.value }
                                  newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts }
                                  setFormData({ ...formData, boxSlots: newSlots })
                                }}
                                className="flex-1 min-w-[120px] border rounded px-2 py-1 text-sm"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newSlots = [...formData.boxSlots]
                                  newSlots[slotIdx] = { ...newSlots[slotIdx], options: newSlots[slotIdx].options.filter((_, i) => i !== optIdx) }
                                  setFormData({ ...formData, boxSlots: newSlots })
                                }}
                                className="text-red-400 hover:text-red-600 text-sm"
                              >✕</button>
                            </div>
                            {/* Multiple images */}
                            <div className="space-y-1 mr-4">
                              {(opt.images || [opt.image].filter(Boolean)).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="flex items-center gap-1">
                                  <input
                                    type="url"
                                    placeholder={`رابط الصورة ${imgIdx + 1}`}
                                    value={imgUrl || ''}
                                    onChange={(e) => {
                                      const newSlots = [...formData.boxSlots]
                                      const newOpts = [...newSlots[slotIdx].options]
                                      const newImages = [...(newOpts[optIdx].images || [newOpts[optIdx].image].filter(Boolean))]
                                      newImages[imgIdx] = e.target.value
                                      newOpts[optIdx] = { ...newOpts[optIdx], images: newImages }
                                      newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts }
                                      setFormData({ ...formData, boxSlots: newSlots })
                                    }}
                                    className="flex-1 border rounded px-2 py-1 text-xs"
                                  />
                                  {(opt.images || [opt.image].filter(Boolean)).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSlots = [...formData.boxSlots]
                                        const newOpts = [...newSlots[slotIdx].options]
                                        const newImages = [...(newOpts[optIdx].images || [])].filter((_, i) => i !== imgIdx)
                                        newOpts[optIdx] = { ...newOpts[optIdx], images: newImages }
                                        newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts }
                                        setFormData({ ...formData, boxSlots: newSlots })
                                      }}
                                      className="text-red-300 hover:text-red-500 text-xs"
                                    >✕</button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSlots = [...formData.boxSlots]
                                  const newOpts = [...newSlots[slotIdx].options]
                                  const currentImages = newOpts[optIdx].images || [newOpts[optIdx].image].filter(Boolean)
                                  newOpts[optIdx] = { ...newOpts[optIdx], images: [...currentImages, ''] }
                                  newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts }
                                  setFormData({ ...formData, boxSlots: newSlots })
                                }}
                                className="text-purple-500 text-xs hover:underline"
                              >+ صورة إضافية</button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newSlots = [...formData.boxSlots]
                            newSlots[slotIdx] = { ...newSlots[slotIdx], options: [...newSlots[slotIdx].options, { name: '', images: [''] }] }
                            setFormData({ ...formData, boxSlots: newSlots })
                          }}
                          className="text-purple-600 text-sm hover:underline"
                        >+ إضافة خيار</button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boxSlots: [...formData.boxSlots, { slotLabel: '', required: true, options: [{ name: '', images: [''] }] }] })}
                    className="w-full border-2 border-dashed border-purple-300 text-purple-600 rounded-lg py-2 hover:bg-purple-50"
                  >+ إضافة خانة جديدة</button>
                </div>
              )}

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
