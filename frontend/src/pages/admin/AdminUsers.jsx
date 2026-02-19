import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiEdit2, FiTrash2, FiUserCheck, FiUserX, FiShield, FiUser } from 'react-icons/fi'
import { adminAPI } from '../../services/api'

const AdminUsers = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, role: roleFilter, isActive: statusFilter, page }],
    queryFn: () => adminAPI.getUsers({ 
      search: search || undefined, 
      role: roleFilter || undefined,
      isActive: statusFilter || undefined,
      page,
      limit: 20 
    }).then(res => res.data)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setEditingUser(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
    }
  })

  const handleToggleStatus = (user) => {
    if (window.confirm(`هل تريد ${user.isActive ? 'تعطيل' : 'تفعيل'} حساب ${user.firstName}؟`)) {
      updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } })
    }
  }

  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    if (window.confirm(`هل تريد ${newRole === 'admin' ? 'ترقية' : 'خفض صلاحيات'} ${user.firstName} ${newRole === 'admin' ? 'لمدير' : 'لمستخدم عادي'}؟`)) {
      updateMutation.mutate({ id: user._id, data: { role: newRole } })
    }
  }

  const handleDelete = (user) => {
    if (window.confirm(`هل تريد حذف حساب ${user.firstName}؟ سيتم تعطيل الحساب فقط.`)) {
      deleteMutation.mutate(user._id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، البريد، أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">جميع الأدوار</option>
            <option value="user">مستخدم</option>
            <option value="admin">مدير</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">جميع الحالات</option>
            <option value="true">نشط</option>
            <option value="false">معطل</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">المستخدم</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">البريد الإلكتروني</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الهاتف</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الدور</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الحالة</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">تاريخ التسجيل</th>
                    <th className="text-right py-4 px-6 font-medium text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.data?.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-medium">
                            {user.firstName?.charAt(0)}
                          </div>
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{user.email}</td>
                      <td className="py-4 px-6 text-gray-600">{user.phone}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'admin' ? <FiShield className="w-3 h-3" /> : <FiUser className="w-3 h-3" />}
                          {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRole(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title={user.role === 'admin' ? 'إزالة صلاحيات المدير' : 'ترقية لمدير'}
                          >
                            <FiShield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-lg ${
                              user.isActive 
                                ? 'text-orange-600 hover:bg-orange-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          >
                            {user.isActive ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            {data?.pagination && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-gray-600">
                  عرض {data.data.length} من {data.pagination.total} مستخدم
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="px-4 py-2">
                    صفحة {page} من {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                    disabled={page >= data.pagination.pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
