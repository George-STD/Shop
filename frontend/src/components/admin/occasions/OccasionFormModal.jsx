import React from 'react';
import { STRINGS } from '../../../constants';

const defaultColors = [
  'from-pink-400 to-pink-600',
  'from-purple-400 to-purple-600',
  'from-red-400 to-red-600',
  'from-rose-400 to-rose-600',
  'from-blue-400 to-blue-600',
  'from-cyan-400 to-cyan-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-indigo-400 to-indigo-600',
  'from-orange-400 to-orange-600',
];

const OccasionFormModal = ({
  showModal,
  editing,
  formData,
  setFormData,
  handleSubmit,
  closeModal,
  isPending
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {editing ? STRINGS.ADMIN.OCCASIONS.EDIT_OCCASION : STRINGS.ADMIN.OCCASIONS.ADD_NEW_OCCASION}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">{STRINGS.ADMIN.OCCASIONS.OCCASION_NAME_LABEL}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={STRINGS.ADMIN.OCCASIONS.OCCASION_NAME_PLACEHOLDER}
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">{STRINGS.ADMIN.OCCASIONS.ICON_LABEL}</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-2xl text-center"
              placeholder="🎉"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">{STRINGS.ADMIN.OCCASIONS.COLOR_LABEL}</label>
            <div className="grid grid-cols-5 gap-2">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`h-10 rounded-lg bg-gradient-to-br ${c} transition-all ${
                    formData.color === c ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">{STRINGS.ADMIN.OCCASIONS.PREVIEW_LABEL}</label>
            <div
              className={`rounded-2xl p-6 bg-gradient-to-br ${formData.color} text-white text-center`}
            >
              <span className="text-4xl mb-3 block">{formData.icon}</span>
              <h3 className="font-bold">{formData.name || STRINGS.ADMIN.OCCASIONS.OCCASION_NAME}</h3>
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">{STRINGS.ADMIN.OCCASIONS.ORDER_LABEL}</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
            />
          </div>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span className="font-medium text-gray-700">{STRINGS.ADMIN.OCCASIONS.ACTIVE_VISIBLE}</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {STRINGS.ADMIN.PRODUCT_FORM.CANCEL}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isPending
                ? STRINGS.ADMIN.PRODUCT_FORM.SAVING
                : editing
                  ? STRINGS.ADMIN.OCCASIONS.UPDATE
                  : STRINGS.ADMIN.OCCASIONS.CREATE}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OccasionFormModal;
