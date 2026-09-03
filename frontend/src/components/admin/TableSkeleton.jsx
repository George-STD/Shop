import React from 'react';

/**
 * High-Precision Geometric Table Skeleton
 * Matches exact admin table column proportions, row heights (h-16 / 64px),
 * and layout geometry to achieve zero Cumulative Layout Shift (< 0.05).
 */
const TableSkeleton = ({
  headers = [],
  rows = 8,
  hasCheckbox = true,
  hasThumbnail = false,
  minHeight = 'min-h-[600px]',
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 ${minHeight} flex flex-col justify-between`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-xs md:text-sm">
            <tr>
              {hasCheckbox && (
                <th className="py-2 px-2 sm:py-4 sm:px-6 w-12 text-center">
                  <div className="w-4 h-4 rounded bg-gray-200 mx-auto" />
                </th>
              )}
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`text-right py-2 px-2 sm:py-4 sm:px-6 font-medium text-gray-600 ${header.className || ''}`}
                >
                  {typeof header === 'string' ? header : header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx} className="animate-pulse h-14 sm:h-16">
                {hasCheckbox && (
                  <td className="py-2 px-2 sm:py-4 sm:px-6 text-center">
                    <div className="w-4 h-4 rounded bg-gray-200 mx-auto" />
                  </td>
                )}
                {headers.map((header, colIdx) => (
                  <td
                    key={colIdx}
                    className={`py-2 px-2 sm:py-4 sm:px-6 ${header.className || ''}`}
                  >
                    {colIdx === 0 && hasThumbnail ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px] rounded-lg bg-gray-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 bg-gray-200 rounded w-28 sm:w-36 max-w-full" />
                          <div className="h-2.5 bg-gray-100 rounded w-16 sm:w-20" />
                        </div>
                      </div>
                    ) : colIdx === 0 && !hasThumbnail ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 min-w-[32px] min-h-[32px] sm:min-w-[40px] sm:min-h-[40px] rounded-full bg-gray-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-gray-200 rounded w-24 sm:w-32" />
                          <div className="h-2.5 bg-gray-100 rounded w-16" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`h-3.5 bg-gray-200 rounded ${
                          colIdx === headers.length - 1 ? 'w-14 sm:w-16 ml-auto' : 'w-20 sm:w-28'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reserved Pagination Footprint */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm bg-gray-50/50 min-h-[56px] shrink-0">
        <div className="h-4 bg-gray-200 rounded w-24 sm:w-32 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
