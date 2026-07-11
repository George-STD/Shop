import React from 'react';
import { FiX, FiCheck, FiTruck, FiPackage } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const OrderDetailsModal = ({
  selectedOrder,
  setSelectedOrder,
  handleStatusChange,
  statusLabels,
  statusColors,
  formatCurrency,
}) => {
  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b sticky top-0 bg-white flex items-center justify-between z-10">
          <h2 className="text-base sm:text-xl font-bold">
            {STRINGS.ADMIN.ORDERS.ORDER_DETAILS} #{selectedOrder.orderNumber}
          </h2>
          <button
            onClick={() => setSelectedOrder(null)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{STRINGS.ADMIN.TABLE.STATUS}</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs sm:text-sm ${statusColors[selectedOrder.status]}`}
              >
                {statusLabels[selectedOrder.status]}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{STRINGS.ADMIN.ORDERS.ORDER_DATE}</p>
              <p className="font-medium mt-1 text-sm">
                {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold mb-3">{STRINGS.ADMIN.ORDERS.CUSTOMER_INFO}</h3>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.NAME}</strong> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
            </p>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.EMAIL}</strong> {selectedOrder.user?.email}
            </p>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.PHONE}</strong> {selectedOrder.user?.phone}
            </p>
          </div>

          {/* Shipping Address */}
          {selectedOrder.shippingAddress && (
            <div className="border rounded-xl p-4">
              <h3 className="font-bold mb-3">{STRINGS.ADMIN.ORDERS.SHIPPING_ADDRESS}</h3>
              <p>
                {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
              </p>
              <p>{selectedOrder.shippingAddress.street}</p>
              <p>
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.governorate}
              </p>
              <p>{selectedOrder.shippingAddress.phone}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold mb-3">{STRINGS.ADMIN.ORDERS.PRODUCTS}</h3>
            <div className="space-y-3">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.product?.images?.[0] && (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name || item.name}</p>
                    <p className="text-sm text-gray-500">{STRINGS.ADMIN.ORDERS.QUANTITY} {item.quantity}</p>
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500">{STRINGS.ADMIN.ORDERS.COLOR} {item.selectedColor}</p>
                    )}
                    {item.selectedShape && (
                      <p className="text-xs text-gray-500">{STRINGS.ADMIN.ORDERS.SHAPE} {item.selectedShape}</p>
                    )}
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <div className="text-xs text-blue-600 mt-0.5">
                        {Object.entries(item.selectedVariants).map(([group, value]) => (
                          <p key={group}>
                            {group}: {value}
                          </p>
                        ))}
                      </div>
                    )}
                    {item.boxSelections?.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1">
                        {item.boxSelections.map((sel, i) => (
                          <p key={i}>
                            • {sel.slotLabel}: {sel.chosenOption}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <span>{STRINGS.ADMIN.ORDERS.SUBTOTAL}</span>
              <span>{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{STRINGS.ADMIN.ORDERS.SHIPPING}</span>
              <span>{formatCurrency(selectedOrder.shippingCost || 0)}</span>
            </div>
            {selectedOrder.discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>{STRINGS.ADMIN.ORDERS.DISCOUNT}</span>
                <span>-{formatCurrency(selectedOrder.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{STRINGS.ADMIN.ORDERS.TOTAL}</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="flex flex-wrap gap-2">
            {selectedOrder.status === 'pending' && (
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiCheck /> {STRINGS.ADMIN.ORDERS.CONFIRM_ORDER}
              </button>
            )}
            {selectedOrder.status === 'confirmed' && (
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <FiPackage /> {STRINGS.ADMIN.ORDERS.START_PROCESSING}
              </button>
            )}
            {selectedOrder.status === 'processing' && (
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'shipped')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <FiTruck /> {STRINGS.ADMIN.ORDERS.SHIPPED}
              </button>
            )}
            {selectedOrder.status === 'shipped' && (
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FiCheck /> {STRINGS.ADMIN.ORDERS.DELIVERED}
              </button>
            )}
            {!['cancelled', 'delivered'].includes(selectedOrder.status) && (
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <FiX /> {STRINGS.ADMIN.ORDERS.CANCEL_ORDER}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
