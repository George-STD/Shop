import React from 'react';
import { STRINGS } from '../../../constants';

const AdminReviewsHeader = ({ approvedFilter, setApprovedFilter, totalReviews }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={approvedFilter}
          onChange={(e) => setApprovedFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">{STRINGS.ADMIN.REVIEWS_STRINGS.ALL_REVIEWS}</option>
          <option value="true">{STRINGS.ADMIN.REVIEWS_STRINGS.APPROVED}</option>
          <option value="false">{STRINGS.ADMIN.REVIEWS_STRINGS.PENDING}</option>
        </select>

        <div className="text-sm text-gray-500">{totalReviews || 0} {STRINGS.ADMIN.REVIEWS_STRINGS.REVIEW}</div>
      </div>
    </div>
  );
};

export default AdminReviewsHeader;
