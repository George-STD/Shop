import Image from 'next/image';
import React from 'react';
import { FiCheck, FiTruck, FiPackage, FiX } from 'react-icons/fi';
import { STRINGS } from '../../../constants';
import Modal from '../../ui/Modal';
import OrderProcurementCard from './OrderProcurementCard';

const OrderDetailsModal = ({
  selectedOrder,
  setSelectedOrder,
  handleStatusChange,
  statusLabels,
  statusColors,
  formatCurrency,
  onOrderUpdated,
}) => {
  if (!selectedOrder) return null;

  return (
    <Modal
      isOpen={!!selectedOrder}
      onClose={() => setSelectedOrder(null)}
      title={`${STRINGS.ADMIN.ORDERS.ORDER_DETAILS} #${selectedOrder.orderNumber}`}
      maxWidth="max-w-4xl"
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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
            <div>
              <p className="text-xs sm:text-sm text-gray-500">طريقة الدفع</p>
              <p className="font-medium mt-1 text-xs sm:text-sm">
                {selectedOrder.paymentMethod === 'cod'
                  ? 'الدفع عند الاستلام'
                  : selectedOrder.paymentMethod === 'instapay'
                    ? 'إنستاباي (InstaPay)'
                    : selectedOrder.paymentMethod === 'paymob_card'
                      ? 'بطاقة بنكية (Paymob)'
                      : selectedOrder.paymentMethod === 'paymob_wallet'
                        ? 'محفظة إلكترونية (Paymob)'
                        : selectedOrder.paymentMethod || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">حالة الدفع</p>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedOrder.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedOrder.paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : selectedOrder.paymentStatus === 'refunded'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedOrder.paymentStatus === 'paid'
                  ? 'مدفوع ✓'
                  : selectedOrder.paymentStatus === 'failed'
                    ? 'فشل الدفع'
                    : selectedOrder.paymentStatus === 'refunded'
                      ? 'مسترد'
                      : 'بانتظار الدفع'}
              </span>
              {selectedOrder.paymentDetails?.transactionId && (
                <p className="text-[11px] text-gray-500 mt-1" dir="ltr">
                  TXN: {selectedOrder.paymentDetails.transactionId}
                </p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border rounded-xl p-4">
            <h3 className="font-bold mb-3">{STRINGS.ADMIN.ORDERS.CUSTOMER_INFO}</h3>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.NAME}</strong>{' '}
              {selectedOrder.user?.firstName
                ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName || ''}`.trim()
                : `${selectedOrder.shippingAddress?.firstName || ''} ${selectedOrder.shippingAddress?.lastName || ''}`.trim() || 'عميل'}
            </p>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.EMAIL}</strong>{' '}
              {selectedOrder.user?.email || selectedOrder.guestEmail || '-'}
            </p>
            <p>
              <strong>{STRINGS.ADMIN.ORDERS.PHONE}</strong>{' '}
              {selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || selectedOrder.guestPhone || '-'}
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
                  {(item.product?.images?.[0]?.url || item.image) && (
                    <Image
                      width={48}
                      height={48}
                      sizes="48px"
                      src={item.product?.images?.[0]?.url || item.image}
                      alt={item.product?.name || item.name || 'صورة المنتج'}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name || item.name}</p>
                    <p className="text-sm text-gray-500">{STRINGS.ADMIN.ORDERS.QUANTITY} {item.quantity}</p>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-500">المقاس: {item.selectedSize}</p>
                    )}
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
                    {item.addons?.length > 0 && (
                      <div className="text-xs text-emerald-700 mt-0.5">
                        {item.addons.map((addon, aIdx) => (
                          <p key={aIdx}>
                            + {addon.name} ({formatCurrency(addon.price)})
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
            {(Number(selectedOrder.discount?.amount ?? selectedOrder.discount) || 0) > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>{STRINGS.ADMIN.ORDERS.DISCOUNT}</span>
                <span>-{formatCurrency(Number(selectedOrder.discount?.amount ?? selectedOrder.discount))}</span>
              </div>
            )}
            {(Number(selectedOrder.pointsDiscount) || 0) > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>خصم نقاط الولاء</span>
                <span>-{formatCurrency(selectedOrder.pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{STRINGS.ADMIN.ORDERS.TOTAL}</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Order Procurement & Cost Accounting Engine */}
          <OrderProcurementCard
            order={selectedOrder}
            onOrderUpdated={(updated) => {
              setSelectedOrder(updated);
              if (onOrderUpdated) onOrderUpdated(updated);
            }}
            formatCurrency={formatCurrency}
          />

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
    </Modal>
  );
};

export default OrderDetailsModal;
