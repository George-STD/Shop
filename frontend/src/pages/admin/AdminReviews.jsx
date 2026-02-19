import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiCheck, FiX, FiTrash2, FiStar } from 'react-icons/fi'
import { adminAPI } from '../../services/api'

const AdminReviews = () => {
  const queryClient = useQueryClient()
  const [approvedFilter, setApprovedFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { approved: approvedFilter, page }],
    queryFn: () => adminAPI.getReviews({ 
      approved: approvedFilter || undefined,
      page,
      limit: 20 
    }).then(res => res.data)
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }) => adminAPI.approveReview(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews'])
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews'])
    }
  })

  const handleApprove = (review, approve) => {
    approveMutation.mutate({ id: review._id, isApproved: approve })
  }

  const handleDelete = (review) => {
    if (window.confirm('هل تريد حذف هذا التقييم؟')) {
      deleteMutation.mutate(review._id)
    }
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={approvedFilter}
            onChange={(e) => setApprovedFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">جميع التقييمات</option>
            <option value="true">معتمدة</option>
            <option value="false">قيد المراجعة</option>
          </select>

          <div className="text-sm text-gray-500">
            {data?.pagination?.total || 0} تقييم
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))
        ) : data?.data?.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
            لا توجد تقييمات
          </div>
        ) : (
          data?.data?.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap gap-4">
                {/* Product Image */}
                {review.product?.images?.[0] && (
                  <img 
                    src={review.product.images[0].url} 
                    alt={review.product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium">{review.user?.firstName} {review.user?.lastName}</p>
                      <p className="text-sm text-gray-500">{review.product?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        review.isApproved 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.isApproved ? 'معتمد' : 'قيد المراجعة'}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500 mr-2">({review.rating}/5)</span>
                  </div>

                  {/* Review Title & Comment */}
                  {review.title && (
                    <p className="font-medium mb-1">{review.title}</p>
                  )}
                  <p className="text-gray-600">{review.comment}</p>

                  {/* Date */}
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review, true)}
                      disabled={approveMutation.isPending}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      title="اعتماد"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => handleApprove(review, false)}
                      disabled={approveMutation.isPending}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                      title="إلغاء الاعتماد"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review)}
                    disabled={deleteMutation.isPending}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="حذف"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
          <p className="text-gray-600">
            عرض {data.data.length} من {data.pagination.total} تقييم
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
    </div>
  )
}

export default AdminReviews
