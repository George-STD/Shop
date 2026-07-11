import React from 'react';
import { STRINGS } from '../../../constants';

const CategoryFormModal = ({
  showModal,
  editingCategory,
  formData,
  setFormData,
  handleSubmit,
  resetForm,
  setShowModal,
  isPending,
}) => {
  if (!showModal) return null;

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">
            {editingCategory ? STRINGS.ADMIN.CATEGORIES.EDIT_CATEGORY : STRINGS.ADMIN.CATEGORIES.ADD_NEW_CATEGORY}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.CATEGORY_NAME}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: editingCategory ? formData.slug : generateSlug(e.target.value),
                })
              }
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.CATEGORY_SLUG}</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.CATEGORY_DESCRIPTION}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.CATEGORY_IMAGE_URL}</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="https://..."
              dir="ltr"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-2 h-20 object-cover rounded-lg"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.CATEGORY_ICON}</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="gift"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{STRINGS.ADMIN.CATEGORIES.ORDER_LABEL}</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <span>{STRINGS.ADMIN.CATEGORIES.ACTIVE_STATUS}</span>
          </label>

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
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white rounded-lg py-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 disabled:opacity-50"
            >
              {isPending ? STRINGS.ADMIN.PRODUCT_FORM.SAVING : STRINGS.ADMIN.PRODUCT_FORM.SAVE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
