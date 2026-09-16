'use client';

import { use } from 'react';
import AdminOrders from '../../../../legacy-pages/admin/AdminOrders';

export default function OrderDetailPage({ params }) {
  const resolvedParams = typeof use === 'function' ? use(params) : params;
  const orderId = resolvedParams?.id;

  return <AdminOrders initialOrderId={orderId} />;
}
