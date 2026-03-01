import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'

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
]

const AdminOccasions = () => {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '🎉',
    color: 'from-purple-400 to-purple-600',
    isActive: true,
    order: 0
  })

  const { data: occasions, isLoading } = useQuery({
    queryKey: ['admin-occasions'],
    queryFn: () => adminAPI.getOccasions().then(res => res.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createOccasion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] })
      toast.success('تم إنشاء المناسبة بنجاح')
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateOccasion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] })
      toast.success('تم تحديث المناسبة بنجاح')
      closeModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteOccasion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] })
      toast.success('تم حذف المناسبة')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ')
    }
  })

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setFormData({ name: '', icon: '🎉', color: 'from-purple-400 to-purple-600', isActive: true, order: 0 })
  }

  const openEdit = (occasion) => {
    setEditing(occasion)
    setFormData({
      name: occasion.name,
      icon: occasion.icon,
      color: occasion.color,
      isActive: occasion.isActive,
      order: occasion.order || 0
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (occasion) => {
    if (window.confirm(`هل تريد حذف المناسبة "${occasion.name}"؟`)) {
      deleteMutation.mutate(occasion._id)
    }
  }

  const toggleActive = (occasion) => {
    updateMutation.mutate({
      id: occasion._id,
      data: { isActive: !occasion.isActive }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">إدارة المناسبات</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          <FiPlus />
          إضافة مناسبة
        </button>
      </div>

      {/* Occasions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : occasions?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد مناسبات</h3>
          <p className="text-gray-500 mb-6">ابدأ بإضافة المناسبات التي تريد عرضها في الموقع</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            إضافة مناسبة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {occasions.map((occasion) => (
            <div
              key={occasion._id}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${
                occasion.isActive ? 'border-transparent' : 'border-red-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${occasion.color} flex items-center justify-center text-2xl`}>
                  {occasion.icon}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(occasion)}
                    className={`p-2 rounded-lg transition-colors ${
                      occasion.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                    title={occasion.isActive ? 'إخفاء' : 'إظهار'}
                  >
                    {occasion.isActive ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => openEdit(occasion)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="تعديل"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(occasion)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="حذف"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">{occasion.name}</h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span>الترتيب: {occasion.order}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  occasion.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {occasion.isActive ? 'مفعّل' : 'معطّل'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editing ? 'تعديل المناسبة' : 'إضافة مناسبة جديدة'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">اسم المناسبة *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="مثال: عيد ميلاد"
                  required
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">الأيقونة (Emoji)</label>
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
                <label className="block text-gray-700 mb-2 font-medium">اللون</label>
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
                <label className="block text-gray-700 mb-2 font-medium">معاينة</label>
                <div className={`rounded-2xl p-6 bg-gradient-to-br ${formData.color} text-white text-center`}>
                  <span className="text-4xl mb-3 block">{formData.icon}</span>
                  <h3 className="font-bold">{formData.name || 'اسم المناسبة'}</h3>
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">الترتيب</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
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
                <span className="font-medium text-gray-700">مفعّل (ظاهر في الموقع)</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'جاري الحفظ...'
                    : editing ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOccasions
