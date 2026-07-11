import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { STRINGS } from '../../constants';

import AdminReviewsHeader from '../../components/admin/reviews/AdminReviewsHeader';
import AdminReviewsList from '../../components/admin/reviews/AdminReviewsList';

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [approvedFilter, setApprovedFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', { approved: approvedFilter, page }],
    queryFn: () =>
      adminAPI
        .getReviews({
          approved: approvedFilter || undefined,
          page,
          limit: 20,
        })
        .then((res) => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }) => adminAPI.approveReview(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
    },
  });

  const handleApprove = (review, approve) => {
    approveMutation.mutate({ id: review._id, isApproved: approve });
  };

  const handleDelete = (review) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_REVIEW)) {
      deleteMutation.mutate(review._id);
    }
  };

  return (
    <div className="space-y-6">
      <AdminReviewsHeader
        approvedFilter={approvedFilter}
        setApprovedFilter={setApprovedFilter}
        totalReviews={data?.pagination?.total}
      />

      <AdminReviewsList
        data={data}
        isLoading={isLoading}
        handleApprove={handleApprove}
        handleDelete={handleDelete}
        approveMutation={approveMutation}
        deleteMutation={deleteMutation}
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
          <p className="text-gray-600">
            {STRINGS.ADMIN.PAGES.SHOWING_REVIEWS(data.data.length, data.pagination.total)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              {STRINGS.ADMIN.PAGES.PREVIOUS}
            </button>
            <span className="px-4 py-2">
              {STRINGS.ADMIN.PAGES.PAGE_X_OF_Y(page, data.pagination.pages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page >= data.pagination.pages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              {STRINGS.ADMIN.PAGES.NEXT}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
