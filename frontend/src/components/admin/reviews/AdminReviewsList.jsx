import React from 'react';
import { FiCheck, FiX, FiTrash2, FiStar } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const AdminReviewsList = ({
  data,
  isLoading,
  handleApprove,
  handleDelete,
  approveMutation,
  deleteMutation,
}) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data?.data?.length === 0) {
    return <div className="bg-white rounded-2xl p-12 text-center text-gray-500">{STRINGS.ADMIN.REVIEWS_STRINGS.NO_REVIEWS}</div>;
  }

  return (
    <div className="space-y-4">
      {data?.data?.map((review) => (
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
                  <p className="font-medium">
                    {review.user?.firstName} {review.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{review.product?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      review.isApproved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {review.isApproved ? STRINGS.ADMIN.REVIEWS_STRINGS.APPROVED : STRINGS.ADMIN.REVIEWS_STRINGS.PENDING}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                {renderStars(review.rating)}
                <span className="text-sm text-gray-500 mr-2">({review.rating}/5)</span>
              </div>

              {/* Review Title & Comment */}
              {review.title && <p className="font-medium mb-1">{review.title}</p>}
              <p className="text-gray-600">{review.comment}</p>

              {/* Date */}
              <p className="text-sm text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
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
                  title={STRINGS.ADMIN.REVIEWS_STRINGS.APPROVE}
                >
                  <FiCheck className="w-5 h-5" />
                </button>
              )}
              {review.isApproved && (
                <button
                  onClick={() => handleApprove(review, false)}
                  disabled={approveMutation.isPending}
                  className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                  title={STRINGS.ADMIN.REVIEWS_STRINGS.UNAPPROVE}
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(review)}
                disabled={deleteMutation.isPending}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                title={STRINGS.ADMIN.REVIEWS_STRINGS.DELETE}
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminReviewsList;
