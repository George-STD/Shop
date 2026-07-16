import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../services/api';
import { STRINGS, API_URL } from '../../../constants';

const ProductFormModal = ({
  showModal,
  setShowModal,
  editingProduct,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
  categories,
  occasionsList,
  createMutation,
  updateMutation,
}) => {
  const fileInputRefs = useRef({});

  const handleImageUpload = async (e, imgIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('جاري رفع الصورة...');
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      
      const res = await adminAPI.uploadImage(uploadData);
      if (res.data.success) {
        const newImages = [...formData.images];
        newImages[imgIdx] = {
          ...newImages[imgIdx],
          url: res.data.url,
          alt: formData.name || '',
        };
        setFormData({ ...formData, images: newImages });
        toast.success('تم رفع الصورة بنجاح', { id: toastId });
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('حدث خطأ أثناء رفع الصورة', { id: toastId });
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold">
            {editingProduct ? STRINGS.ADMIN.PRODUCT_FORM.EDIT_PRODUCT : STRINGS.ADMIN.PRODUCT_FORM.ADD_NEW_PRODUCT}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-2 sm:p-6 space-y-3 sm:space-y-4">
          {/* Occasions (المناسبات) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">{STRINGS.ADMIN.PRODUCT_FORM.OCCASIONS}</label>
              <button
                type="button"
                onClick={() => {
                  const allOccasions = occasionsList?.map(o => o.name) || [];
                  const isAllSelected = formData.occasions.length === allOccasions.length && allOccasions.length > 0;
                  setFormData({ ...formData, occasions: isAllSelected ? [] : allOccasions });
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                {formData.occasions.length === (occasionsList?.length || 0) && occasionsList?.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {occasionsList?.map((occ) => (
                <label
                  key={occ._id}
                  className={`flex items-center gap-1 cursor-pointer border rounded-lg px-3 py-1.5 transition-colors ${
                    formData.occasions.includes(occ.name)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.occasions.includes(occ.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, occasions: [...formData.occasions, occ.name] });
                      } else {
                        setFormData({
                          ...formData,
                          occasions: formData.occasions.filter((o) => o !== occ.name),
                        });
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">{STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LABEL}</label>
              <button
                type="button"
                onClick={() => {
                  const allRecipients = STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST || [];
                  const isAllSelected = formData.recipients.length === allRecipients.length && allRecipients.length > 0;
                  setFormData({ ...formData, recipients: isAllSelected ? [] : allRecipients });
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                {formData.recipients.length === (STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST?.length || 0) && STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST?.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {STRINGS.ADMIN.PRODUCT_FORM.RECIPIENTS_LIST.map(
                (rec) => (
                  <label
                    key={rec}
                    className="flex items-center gap-1 cursor-pointer border rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={formData.recipients.includes(rec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, recipients: [...formData.recipients, rec] });
                        } else {
                          setFormData({
                            ...formData,
                            recipients: formData.recipients.filter((r) => r !== rec),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{rec}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Allow color selection toggle */}
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.CAN_CHOOSE_COLOR}</label>
            <input
              type="checkbox"
              checked={formData.hasColors}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hasColors: e.target.checked,
                  colors: e.target.checked
                    ? formData.colors.length
                      ? formData.colors
                      : [{ name: '', hex: '' }]
                    : [],
                })
              }
              className="mr-2"
            />
            <span>{STRINGS.ADMIN.PRODUCT_FORM.YES}</span>
          </div>

          {/* If hasColors, show color options */}
          {formData.hasColors && (
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRODUCT_COLORS}</label>
              {formData.colors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={STRINGS.ADMIN.PRODUCT_FORM.COLOR_NAME}
                    value={color.name}
                    onChange={(e) => {
                      const newColors = [...formData.colors];
                      newColors[idx].name = e.target.value;
                      setFormData({ ...formData, colors: newColors });
                    }}
                    className="border rounded-lg px-2 py-1"
                  />
                  <input
                    type="color"
                    value={color.hex || '#000000'}
                    onChange={(e) => {
                      const newColors = [...formData.colors];
                      newColors[idx].hex = e.target.value;
                      setFormData({ ...formData, colors: newColors });
                    }}
                    className="w-8 h-8 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newColors = formData.colors.filter((_, i) => i !== idx);
                      setFormData({ ...formData, colors: newColors });
                    }}
                    className="text-red-500 px-2"
                  >
                    {STRINGS.ADMIN.PRODUCT_FORM.DELETE}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, colors: [...formData.colors, { name: '', hex: '' }] })
                }
                className="text-blue-600"
              >
                {STRINGS.ADMIN.PRODUCT_FORM.ADD_COLOR}
              </button>
            </div>
          )}

          {/* Shapes toggle */}
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.HAS_MULTIPLE_SHAPES}</label>
            <input
              type="checkbox"
              checked={formData.hasShapes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hasShapes: e.target.checked,
                  shapes: e.target.checked
                    ? formData.shapes.length
                      ? formData.shapes
                      : [{ name: '', images: [''] }]
                    : [],
                })
              }
              className="mr-2"
            />
            <span>{STRINGS.ADMIN.PRODUCT_FORM.YES}</span>
          </div>

          {formData.hasShapes && (
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRODUCT_SHAPES}</label>
              {formData.shapes.map((shape, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded-lg space-y-2 mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={STRINGS.ADMIN.PRODUCT_FORM.SHAPE_NAME}
                      value={shape.name}
                      onChange={(e) => {
                        const newShapes = [...formData.shapes];
                        newShapes[idx] = { ...newShapes[idx], name: e.target.value };
                        setFormData({ ...formData, shapes: newShapes });
                      }}
                      className="flex-1 min-w-[120px] border rounded-lg px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newShapes = formData.shapes.filter((_, i) => i !== idx);
                        setFormData({ ...formData, shapes: newShapes });
                      }}
                      className="text-red-500 px-2"
                    >
                      {STRINGS.ADMIN.PRODUCT_FORM.DELETE}
                    </button>
                  </div>
                  <div className="space-y-1 mr-4">
                    {(shape.images || [shape.image].filter(Boolean)).map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="flex items-center gap-1">
                        <input
                          type="url"
                          placeholder={`${STRINGS.ADMIN.PRODUCT_FORM.IMAGE_URL} ${imgIdx + 1}`}
                          value={imgUrl || ''}
                          onChange={(e) => {
                            const newShapes = [...formData.shapes];
                            const newImages = [
                              ...(newShapes[idx].images || [newShapes[idx].image].filter(Boolean)),
                            ];
                            newImages[imgIdx] = e.target.value;
                            newShapes[idx] = { ...newShapes[idx], images: newImages };
                            setFormData({ ...formData, shapes: newShapes });
                          }}
                          className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-8 h-8 object-cover rounded border"
                          />
                        )}
                        {(shape.images || [shape.image].filter(Boolean)).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newShapes = [...formData.shapes];
                              const newImages = [...(newShapes[idx].images || [])].filter(
                                (_, i) => i !== imgIdx
                              );
                              newShapes[idx] = { ...newShapes[idx], images: newImages };
                              setFormData({ ...formData, shapes: newShapes });
                            }}
                            className="text-red-300 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newShapes = [...formData.shapes];
                        const currentImages =
                          newShapes[idx].images || [newShapes[idx].image].filter(Boolean);
                        newShapes[idx] = { ...newShapes[idx], images: [...currentImages, ''] };
                        setFormData({ ...formData, shapes: newShapes });
                      }}
                      className="text-purple-500 text-xs hover:underline"
                    >
                      {STRINGS.ADMIN.PRODUCT_FORM.ADD_ADDITIONAL_IMAGE}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    shapes: [...formData.shapes, { name: '', images: [''] }],
                  })
                }
                className="text-purple-600"
              >
                {STRINGS.ADMIN.PRODUCT_FORM.ADD_SHAPE}
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRODUCT_NAME}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRODUCT_SKU}</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder={STRINGS.ADMIN.PRODUCT_FORM.SKU_PLACEHOLDER}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.DESCRIPTION}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRICE}</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRICE_BEFORE_DISCOUNT}</label>
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">{STRINGS.ADMIN.PRODUCT_FORM.CATEGORIES}</label>
                <button
                  type="button"
                  onClick={() => {
                    const allCategories = categories?.map(c => c._id) || [];
                    const isAllSelected = formData.category.length === allCategories.length && allCategories.length > 0;
                    setFormData({ ...formData, category: isAllSelected ? [] : allCategories });
                  }}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  {formData.category.length === (categories?.length || 0) && categories?.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
                </button>
              </div>
              <div className="border rounded-lg px-3 py-2 max-h-40 overflow-y-auto space-y-1">
                {categories?.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.category.includes(cat._id)}
                      onChange={(e) => {
                        const newCats = e.target.checked
                          ? [...formData.category, cat._id]
                          : formData.category.filter((id) => id !== cat._id);
                        setFormData({ ...formData, category: newCats });
                      }}
                      className="rounded"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
              {formData.category.length === 0 && (
                <p className="text-xs text-red-500 mt-1">{STRINGS.ADMIN.PRODUCT_FORM.SELECT_AT_LEAST_ONE_CATEGORY}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.STOCK_QUANTITY}</label>
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
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.PRODUCT_FORM.PRODUCT_IMAGES}</label>
            <div className="space-y-3">
              {formData.images.map((img, imgIdx) => (
                <div key={imgIdx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="url"
                        placeholder={`${STRINGS.ADMIN.TABLE?.IMAGE_URL || 'رابط الصورة'} ${imgIdx + 1}`}
                        value={img.url || ''}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[imgIdx] = {
                            ...newImages[imgIdx],
                            url: e.target.value,
                            alt: formData.name,
                          };
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={el => fileInputRefs.current[imgIdx] = el}
                        onChange={(e) => handleImageUpload(e, imgIdx)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[imgIdx]?.click()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm whitespace-nowrap transition-colors"
                      >
                        رفع صورة
                      </button>
                    </div>
                    {img.url && (
                      <img src={img.url.startsWith('/') ? `${API_URL.replace('/api', '')}${img.url}` : img.url} alt="" className="w-10 h-10 object-cover rounded border" />
                    )}
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            images: formData.images.filter((_, i) => i !== imgIdx),
                          });
                        }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Variant tags for this image */}
                  {formData.hasVariantGroups && formData.variantGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mr-2">
                      {formData.variantGroups
                        .filter((g) => g.name)
                        .map((group) => (
                          <div key={group.name} className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">{group.name}:</span>
                            <select
                              value={(img.variantTags || {})[group.name] || ''}
                              onChange={(e) => {
                                const newImages = [...formData.images];
                                const newTags = { ...(newImages[imgIdx].variantTags || {}) };
                                if (e.target.value) {
                                  newTags[group.name] = e.target.value;
                                } else {
                                  delete newTags[group.name];
                                }
                                newImages[imgIdx] = { ...newImages[imgIdx], variantTags: newTags };
                                setFormData({ ...formData, images: newImages });
                              }}
                              className="border rounded px-2 py-0.5 text-xs bg-white"
                            >
                              <option value="">{STRINGS.ADMIN.PRODUCT_FORM.ALL}</option>
                              {group.options
                                ?.filter((o) => o.name)
                                .map((opt) => (
                                  <option key={opt.name} value={opt.name}>
                                    {opt.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    images: [...formData.images, { url: '', alt: '', variantTags: {} }],
                  });
                }}
                className="text-purple-600 text-sm hover:underline"
              >
                {STRINGS.ADMIN.PRODUCT_FORM.ADD_IMAGE}
              </button>
            </div>
          </div>

          {/* Variant Groups */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasVariantGroups}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasVariantGroups: e.target.checked,
                    variantGroups: e.target.checked
                      ? formData.variantGroups.length
                        ? formData.variantGroups
                        : [
                            {
                              name: '',
                              replaceMainImage: false,
                              defaultOption: '',
                              options: [{ name: '', thumbnail: '' }],
                            },
                          ]
                      : [],
                  })
                }
                className="rounded"
              />
              <span className="font-medium">{STRINGS.ADMIN.PRODUCT_FORM.VARIANT_GROUPS_LABEL}</span>
            </label>
          </div>

          {formData.hasVariantGroups && (
            <div className="space-y-4 border rounded-xl p-4 bg-blue-50/50">
              <h3 className="font-bold text-blue-700">{STRINGS.ADMIN.PRODUCT_FORM.VARIANT_GROUPS}</h3>
              {formData.variantGroups.map((group, gIdx) => (
                <div key={gIdx} className="border rounded-lg p-3 bg-white space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={STRINGS.ADMIN.PRODUCT_FORM.GROUP_NAME_PLACEHOLDER}
                      value={group.name}
                      onChange={(e) => {
                        const newGroups = [...formData.variantGroups];
                        newGroups[gIdx] = { ...newGroups[gIdx], name: e.target.value };
                        setFormData({ ...formData, variantGroups: newGroups });
                      }}
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          variantGroups: formData.variantGroups.filter((_, i) => i !== gIdx),
                        });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {STRINGS.COMMON.DELETE}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={group.replaceMainImage || false}
                      onChange={(e) => {
                        const newGroups = formData.variantGroups.map((g, i) => ({
                          ...g,
                          replaceMainImage: i === gIdx ? e.target.checked : false,
                        }));
                        setFormData({ ...formData, variantGroups: newGroups });
                      }}
                      className="rounded"
                    />
                    <span>{STRINGS.ADMIN.PRODUCT_FORM.THUMBNAIL_REPLACES_MAIN}</span>
                  </label>
                  <div className="space-y-2 mr-4">
                    <p className="text-sm text-gray-600 font-medium">{STRINGS.ADMIN.TABLE?.OPTIONS || 'الخيارات:'}</p>
                    {group.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={STRINGS.ADMIN.PRODUCT_FORM.OPTION_NAME}
                          value={opt.name}
                          onChange={(e) => {
                            const newGroups = [...formData.variantGroups];
                            const newOpts = [...newGroups[gIdx].options];
                            newOpts[oIdx] = { ...newOpts[oIdx], name: e.target.value };
                            newGroups[gIdx] = { ...newGroups[gIdx], options: newOpts };
                            setFormData({ ...formData, variantGroups: newGroups });
                          }}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="url"
                          placeholder={STRINGS.ADMIN.PRODUCT_FORM.THUMBNAIL_OPTIONAL}
                          value={opt.thumbnail || ''}
                          onChange={(e) => {
                            const newGroups = [...formData.variantGroups];
                            const newOpts = [...newGroups[gIdx].options];
                            newOpts[oIdx] = { ...newOpts[oIdx], thumbnail: e.target.value };
                            newGroups[gIdx] = { ...newGroups[gIdx], options: newOpts };
                            setFormData({ ...formData, variantGroups: newGroups });
                          }}
                          className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        {opt.thumbnail && (
                          <img
                            src={opt.thumbnail}
                            alt=""
                            className="w-8 h-8 object-cover rounded border"
                          />
                        )}
                        {group.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = [...formData.variantGroups];
                              newGroups[gIdx] = {
                                ...newGroups[gIdx],
                                options: newGroups[gIdx].options.filter((_, i) => i !== oIdx),
                              };
                              setFormData({ ...formData, variantGroups: newGroups });
                            }}
                            className="text-red-300 hover:text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newGroups = [...formData.variantGroups];
                        newGroups[gIdx] = {
                          ...newGroups[gIdx],
                          options: [...newGroups[gIdx].options, { name: '', thumbnail: '' }],
                        };
                        setFormData({ ...formData, variantGroups: newGroups });
                      }}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {STRINGS.ADMIN.PRODUCT_FORM.ADD_OPTION}
                    </button>
                    {group.options.filter((o) => o.name).length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <label className="text-sm text-gray-600 font-medium">
                          {STRINGS.ADMIN.PRODUCT_FORM.DEFAULT_OPTION}
                        </label>
                        <select
                          value={group.defaultOption || ''}
                          onChange={(e) => {
                            const newGroups = [...formData.variantGroups];
                            newGroups[gIdx] = { ...newGroups[gIdx], defaultOption: e.target.value };
                            setFormData({ ...formData, variantGroups: newGroups });
                          }}
                          className="mr-2 border rounded px-2 py-1 text-sm"
                        >
                          <option value="">{STRINGS.ADMIN.PRODUCT_FORM.NO_DEFAULT_OPTION}</option>
                          {group.options
                            .filter((o) => o.name)
                            .map((opt) => (
                              <option key={opt.name} value={opt.name}>
                                {opt.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    variantGroups: [
                      ...formData.variantGroups,
                      {
                        name: '',
                        replaceMainImage: false,
                        defaultOption: '',
                        options: [{ name: '', thumbnail: '' }],
                      },
                    ],
                  });
                }}
                className="w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-lg py-2 hover:bg-blue-50"
              >
                {STRINGS.ADMIN.PRODUCT_FORM.ADD_NEW_GROUP}
              </button>
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
              <span>{STRINGS.ADMIN.PRODUCT_FORM.ACTIVE}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.canBeAddedToBox}
                onChange={(e) => setFormData({ ...formData, canBeAddedToBox: e.target.checked })}
                className="rounded"
              />
              <span>{STRINGS.ADMIN.PRODUCT_FORM.CAN_BE_ADDED_TO_BOX}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded"
              />
              <span>{STRINGS.ADMIN.PRODUCT_FORM.FEATURED}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({ ...formData, isBestseller: e.target.checked })}
                className="rounded"
              />
              <span>{STRINGS.ADMIN.PRODUCT_FORM.BESTSELLER}</span>
            </label>
          </div>

          {/* Custom Box Toggle */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCustomBox}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isCustomBox: e.target.checked,
                    boxSlots: e.target.checked
                      ? formData.boxSlots.length
                        ? formData.boxSlots
                        : [{ slotLabel: '', required: true, options: [{ name: '', images: [''] }] }]
                      : [],
                  })
                }
                className="rounded"
              />
              <span className="font-medium">{STRINGS.ADMIN.PRODUCT_FORM.CUSTOMIZABLE_BOX}</span>
            </label>
          </div>

          {/* Box Slots Builder */}
          {formData.isCustomBox && (
            <div className="space-y-4 border rounded-xl p-4 bg-purple-50/50">
              <h3 className="font-bold text-purple-700">{STRINGS.ADMIN.PRODUCT_FORM.BOX_SLOTS}</h3>
              {formData.boxSlots.map((slot, slotIdx) => (
                <div key={slotIdx} className="border rounded-lg p-3 bg-white space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={STRINGS.ADMIN.PRODUCT_FORM.SLOT_TITLE_PLACEHOLDER}
                      value={slot.slotLabel}
                      onChange={(e) => {
                        const newSlots = [...formData.boxSlots];
                        newSlots[slotIdx] = { ...newSlots[slotIdx], slotLabel: e.target.value };
                        setFormData({ ...formData, boxSlots: newSlots });
                      }}
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={slot.required}
                        onChange={(e) => {
                          const newSlots = [...formData.boxSlots];
                          newSlots[slotIdx] = { ...newSlots[slotIdx], required: e.target.checked };
                          setFormData({ ...formData, boxSlots: newSlots });
                        }}
                        className="rounded"
                      />
                      {STRINGS.ADMIN.PRODUCT_FORM.REQUIRED}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          boxSlots: formData.boxSlots.filter((_, i) => i !== slotIdx),
                        })
                      }
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {STRINGS.ADMIN.PRODUCT_FORM.DELETE_SLOT}
                    </button>
                  </div>

                  {/* Options for this slot */}
                  <div className="space-y-2 mr-4">
                    <p className="text-sm text-gray-600 font-medium">{STRINGS.ADMIN.PRODUCT_FORM.OPTIONS_LABEL}</p>
                    {slot.options.map((opt, optIdx) => (
                      <div key={optIdx} className="bg-gray-50 p-2 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={STRINGS.ADMIN.PRODUCT_FORM.OPTION_NAME}
                            value={opt.name}
                            onChange={(e) => {
                              const newSlots = [...formData.boxSlots];
                              const newOpts = [...newSlots[slotIdx].options];
                              newOpts[optIdx] = { ...newOpts[optIdx], name: e.target.value };
                              newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts };
                              setFormData({ ...formData, boxSlots: newSlots });
                            }}
                            className="flex-1 min-w-[120px] border rounded px-2 py-1 text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = [...formData.boxSlots];
                              newSlots[slotIdx] = {
                                ...newSlots[slotIdx],
                                options: newSlots[slotIdx].options.filter((_, i) => i !== optIdx),
                              };
                              setFormData({ ...formData, boxSlots: newSlots });
                            }}
                            className="text-red-400 hover:text-red-600 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        {/* Multiple images */}
                        <div className="space-y-1 mr-4">
                          {(opt.images || [opt.image].filter(Boolean)).map((imgUrl, imgIdx) => (
                            <div key={imgIdx} className="flex items-center gap-1">
                              <input
                                type="url"
                                placeholder={`${STRINGS.ADMIN.PRODUCT_FORM.IMAGE_URL} ${imgIdx + 1}`}
                                value={imgUrl || ''}
                                onChange={(e) => {
                                  const newSlots = [...formData.boxSlots];
                                  const newOpts = [...newSlots[slotIdx].options];
                                  const newImages = [
                                    ...(newOpts[optIdx].images ||
                                      [newOpts[optIdx].image].filter(Boolean)),
                                  ];
                                  newImages[imgIdx] = e.target.value;
                                  newOpts[optIdx] = { ...newOpts[optIdx], images: newImages };
                                  newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts };
                                  setFormData({ ...formData, boxSlots: newSlots });
                                }}
                                className="flex-1 border rounded px-2 py-1 text-xs"
                              />
                              {(opt.images || [opt.image].filter(Boolean)).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSlots = [...formData.boxSlots];
                                    const newOpts = [...newSlots[slotIdx].options];
                                    const newImages = [...(newOpts[optIdx].images || [])].filter(
                                      (_, i) => i !== imgIdx
                                    );
                                    newOpts[optIdx] = { ...newOpts[optIdx], images: newImages };
                                    newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts };
                                    setFormData({ ...formData, boxSlots: newSlots });
                                  }}
                                  className="text-red-300 hover:text-red-500 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = [...formData.boxSlots];
                              const newOpts = [...newSlots[slotIdx].options];
                              const currentImages =
                                newOpts[optIdx].images || [newOpts[optIdx].image].filter(Boolean);
                              newOpts[optIdx] = {
                                ...newOpts[optIdx],
                                images: [...currentImages, ''],
                              };
                              newSlots[slotIdx] = { ...newSlots[slotIdx], options: newOpts };
                              setFormData({ ...formData, boxSlots: newSlots });
                            }}
                            className="text-purple-500 text-xs hover:underline"
                          >
                            {STRINGS.ADMIN.PRODUCT_FORM.ADD_ADDITIONAL_IMAGE}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = [...formData.boxSlots];
                        newSlots[slotIdx] = {
                          ...newSlots[slotIdx],
                          options: [...newSlots[slotIdx].options, { name: '', images: [''] }],
                        };
                        setFormData({ ...formData, boxSlots: newSlots });
                      }}
                      className="text-purple-600 text-sm hover:underline"
                    >
                      {STRINGS.ADMIN.PRODUCT_FORM.ADD_SLOT_OPTION}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    boxSlots: [
                      ...formData.boxSlots,
                      { slotLabel: '', required: true, options: [{ name: '', images: [''] }] },
                    ],
                  })
                }
                className="w-full border-2 border-dashed border-purple-300 text-purple-600 rounded-lg py-2 hover:bg-purple-50"
              >
                {STRINGS.ADMIN.PRODUCT_FORM.ADD_NEW_SLOT}
              </button>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
            >
              {STRINGS.ADMIN.PRODUCT_FORM.CANCEL}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-lg py-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? STRINGS.ADMIN.PRODUCT_FORM.SAVING : STRINGS.ADMIN.PRODUCT_FORM.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
