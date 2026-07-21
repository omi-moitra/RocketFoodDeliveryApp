/**
 * File: orderService.js
 * Purpose: Preserves the public order-service boundary while focused modules own each order flow.
 * Contents:
 * 1. Delivery metadata exports
 * 2. Shared order messages export
 * 3. Creation, customer-history, and courier-delivery operation exports
 */

export { DELIVERY_STATUS, DELIVERY_STATUS_LABELS } from '../constants/deliveryStatus';
export { createOrder } from './orders/createOrder';
export { fetchCustomerOrders } from './orders/customerOrders';
export {
  acceptDelivery,
  assignActiveCourier,
  fetchCourierDeliveries,
  markDelivered,
} from './orders/courierDeliveries';
export { ORDER_ERROR_MESSAGES } from './orders/orderShared';
