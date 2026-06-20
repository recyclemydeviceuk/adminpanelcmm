// ─── Order Status Workflow ───────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PACK_SENT'
  | 'DEVICE_RECEIVED'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_FAILED'
  | 'PRICE_REVISED'
  | 'COUNTER_OFFER_PENDING'
  | 'COUNTER_OFFER_ACCEPTED'
  | 'PAYOUT_READY'
  | 'PAID'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export const ORDER_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'PACK_SENT',
  'DEVICE_RECEIVED',
  'INSPECTION_PASSED',
  'INSPECTION_FAILED',
  'PRICE_REVISED',
  'PAYOUT_READY',
  'PAID',
  'CLOSED',
  'CANCELLED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
  PACK_SENT: 'Pack Sent',
  DEVICE_RECEIVED: 'Device Received',
  INSPECTION_PASSED: 'Inspection Passed',
  INSPECTION_FAILED: 'Inspection Failed',
  PRICE_REVISED: 'Price Revised',
  COUNTER_OFFER_PENDING: 'Counter Offer Pending',
  COUNTER_OFFER_ACCEPTED: 'Counter Offer Accepted',
  PAYOUT_READY: 'Payout Ready',
  PAID: 'Paid',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  RECEIVED: 'bg-blue-100 text-blue-700',
  PACK_SENT: 'bg-purple-100 text-purple-700',
  DEVICE_RECEIVED: 'bg-indigo-100 text-indigo-700',
  INSPECTION_PASSED: 'bg-green-100 text-green-700',
  INSPECTION_FAILED: 'bg-red-100 text-red-700',
  PRICE_REVISED: 'bg-yellow-100 text-yellow-700',
  COUNTER_OFFER_PENDING: 'bg-amber-100 text-amber-700',
  COUNTER_OFFER_ACCEPTED: 'bg-green-100 text-green-700',
  PAYOUT_READY: 'bg-orange-100 text-orange-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

// ─── Payment & Postage ────────────────────────────────────────────────────────
export type PaymentMethod = 'bank';
export type PostageMethod = 'label' | 'postbag';

// ─── Payment Status ──────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'PAID';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

// ─── Device Grade ─────────────────────────────────────────────────────────────
export type DeviceGrade = 'NEW' | 'GOOD' | 'BROKEN';

// ─── Order Source ─────────────────────────────────────────────────────────────
export type OrderSource = 'WEBSITE' | 'API';

// ─── Payout Details ──────────────────────────────────────────────────────────
export interface PayoutDetails {
  bankName: string;
  accountNumber: string;
  sortCode: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  orderNumber: string;
  source: OrderSource;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;

  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  city?: string | null;
  postcode?: string | null;

  // Device
  deviceId: string;
  deviceName: string;
  network: string;
  deviceGrade: DeviceGrade;
  storage: string;
  offeredPrice: number;
  finalPrice?: number;

  // Postage
  postageMethod: PostageMethod;

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  payoutDetails: PayoutDetails;

  // Internal
  transactionId?: string;
  priceRevisionReason?: string;
  partnerName?: string | null;

  // Counter Offer
  counterOffer?: {
    hasCounterOffer?: boolean;
    latestOfferId?: string;
    status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    revisedPrice?: number | null;
    respondedAt?: string | null;
    reason?: string | null;
  };
}

// ─── Device ──────────────────────────────────────────────────────────────────
export interface Device {
  id: string;
  brand: string;
  name: string;
  fullName: string;
  category: string;
  storage?: string;
  network?: string;
  condition?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  defaultPricing?: {
    network: string;
    storage: string;
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }[];
}

// ─── Pricing Entry ───────────────────────────────────────────────────────────
export interface PricingEntry {
  id: string;
  deviceId: string;
  deviceName: string;
  network: string;
  storage: string;
  gradeNew: number;
  gradeGood: number;
  gradeBroken: number;
  deeplink?: string;
  updatedAt: string;
}

// ─── Utility types ───────────────────────────────────────────────────────────
export interface UtilityItem {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
  value?: string;
}

export interface UtilityStore {
  storageOptions: UtilityItem[];
  deviceConditions: UtilityItem[];
  networks: UtilityItem[];
  brands: UtilityItem[];
  categories: UtilityItem[];
  orderStatuses: UtilityItem[];
}

// ─── API Gateway Log ─────────────────────────────────────────────────────────
export interface ApiRequestLog {
  id: string;
  timestamp: string;
  sourceIp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  success: boolean;
  orderNumber?: string;
  payload: string;
  error?: string;
  responseTime: number;
}

// ─── Partner ─────────────────────────────────────────────────────────────────
export interface Partner {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  totalOrders: number;
  lastUsedAt: string | null;
  createdAt: string;
}

// ─── Admin Auth ──────────────────────────────────────────────────────────────
export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}
