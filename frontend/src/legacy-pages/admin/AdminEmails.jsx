import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiMail, FiTrash2, FiEye, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { adminAPI } from '../../services/api'

const htmlToPlainText = (html = '') => {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const AdminEmails = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedEmail, setSelectedEmail] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-emails', page],
    queryFn: () => adminAPI.getEmails({ page, limit: 20 }).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-emails'])
      setSelectedEmail(null)
    },
  })

  const viewEmail = async (email) => {
    if (!email.isRead) {
      // Fetch full email to mark as read
      const res = await adminAPI.getEmail(email._id)
      queryClient.invalidateQueries(['admin-emails'])
      setSelectedEmail(res.data.data)
    } else {
      setSelectedEmail(email)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف هذه الرسالة؟')) {
      deleteMutation.mutate(id)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Email detail modal
  if (selectedEmail) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-6 border-b">
            <button
              onClick={() => setSelectedEmail(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <FiChevronRight />
              رجوع
            </button>
            <button
              onClick={() => handleDelete(selectedEmail._id)}
              className="text-red-500 hover:text-red-700 p-2"
              title="حذف"
            >
              <FiTrash2 size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span><strong>من:</strong> {selectedEmail.from}</span>
              <span><strong>إلى:</strong> {selectedEmail.to}</span>
              <span>{formatDate(selectedEmail.createdAt)}</span>
            </div>
            
            <hr />

            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {selectedEmail.text || htmlToPlainText(selectedEmail.html || '') || 'لا يوجد محتوى'}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMail className="text-2xl text-purple-600" />
            <h1 className="text-xl font-bold">البريد الوارد</h1>
          </div>
          <span className="text-sm text-gray-500">
            {data?.pagination?.total || 0} رسالة
          </span>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !data?.data?.length ? (
          <div className="p-12 text-center text-gray-500">
            <FiMail className="text-4xl mx-auto mb-3 text-gray-300" />
            <p>لا توجد رسائل</p>
          </div>
        ) : (
          <div className="divide-y">
            {data.data.map((email) => (
              <div
                key={email._id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!email.isRead ? 'bg-purple-50' : ''}`}
                onClick={() => viewEmail(email)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!email.isRead ? 'bg-purple-600' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm truncate ${!email.isRead ? 'font-bold' : 'text-gray-700'}`}>
                      {email.from}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(email.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!email.isRead ? 'font-medium' : 'text-gray-500'}`}>
                    {email.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(email._id) }}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="حذف"
                  >
                    <FiTrash2 size={16} />
                  </button>
                  <FiEye className="text-gray-400" size={16} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight size={18} />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {data.pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminEmails
