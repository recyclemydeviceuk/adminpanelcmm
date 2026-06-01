import { useState, useCallback, useEffect } from 'react';
import type {
  Order, Device, PricingEntry, UtilityItem, ApiRequestLog, Partner,
  OrderSource, OrderStatus, DeviceGrade, PostageMethod, PaymentMethod, PaymentStatus,
} from './types';
import { utilitiesApi } from './api/utilities';
import { deviceApi } from './api/devices';
import { orderApi } from './api/orders';
import { pricingApi } from './api/pricing';
import { apiGatewayApi } from './api/apiGateway';
import { partnerApi } from './api/partners';

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const mockDevices: Device[] = [
  { id: 'd1', brand: 'Apple', name: 'iPhone 16 Pro Max', fullName: 'Apple iPhone 16 Pro Max', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-16-pro-max/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 620, gradeGood: 558, gradeBroken: 275 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 655, gradeGood: 590, gradeBroken: 290 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 700, gradeGood: 630, gradeBroken: 310 },
    { network: 'Unlocked', storage: '1TB', gradeNew: 780, gradeGood: 700, gradeBroken: 345 },
  ]},
  { id: 'd2', brand: 'Apple', name: 'iPhone 16 Pro', fullName: 'Apple iPhone 16 Pro', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-16-pro/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 555, gradeGood: 500, gradeBroken: 240 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 590, gradeGood: 530, gradeBroken: 260 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 635, gradeGood: 570, gradeBroken: 280 },
  ]},
  { id: 'd3', brand: 'Apple', name: 'iPhone 16', fullName: 'Apple iPhone 16', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-16/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 425, gradeGood: 380, gradeBroken: 185 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 460, gradeGood: 415, gradeBroken: 200 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 510, gradeGood: 460, gradeBroken: 225 },
  ]},
  { id: 'd4', brand: 'Apple', name: 'iPhone 15 Pro Max', fullName: 'Apple iPhone 15 Pro Max', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-15-pro-max/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '256GB', gradeNew: 495, gradeGood: 445, gradeBroken: 215 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 540, gradeGood: 485, gradeBroken: 235 },
    { network: 'Unlocked', storage: '1TB', gradeNew: 595, gradeGood: 535, gradeBroken: 260 },
  ]},
  { id: 'd5', brand: 'Apple', name: 'iPhone 15 Pro', fullName: 'Apple iPhone 15 Pro', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-15-pro/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 420, gradeGood: 380, gradeBroken: 185 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 455, gradeGood: 410, gradeBroken: 200 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 495, gradeGood: 445, gradeBroken: 215 },
  ]},
  { id: 'd6', brand: 'Apple', name: 'iPhone 15', fullName: 'Apple iPhone 15', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-15/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 340, gradeGood: 305, gradeBroken: 148 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 375, gradeGood: 337, gradeBroken: 165 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 420, gradeGood: 378, gradeBroken: 184 },
  ]},
  { id: 'd7', brand: 'Apple', name: 'iPhone 14 Pro Max', fullName: 'Apple iPhone 14 Pro Max', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-14-pro-max/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 380, gradeGood: 342, gradeBroken: 167 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 415, gradeGood: 373, gradeBroken: 182 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 460, gradeGood: 414, gradeBroken: 202 },
  ]},
  { id: 'd8', brand: 'Apple', name: 'iPhone 14', fullName: 'Apple iPhone 14', category: 'iPhone', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/apple/iphone-14/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 280, gradeGood: 252, gradeBroken: 123 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 315, gradeGood: 283, gradeBroken: 138 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 355, gradeGood: 319, gradeBroken: 156 },
  ]},
  { id: 'd9', brand: 'Samsung', name: 'Galaxy S24 Ultra', fullName: 'Samsung Galaxy S24 Ultra', category: 'Samsung', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/samsung/galaxy-s24-ultra/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '256GB', gradeNew: 525, gradeGood: 470, gradeBroken: 230 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 570, gradeGood: 513, gradeBroken: 250 },
    { network: 'Unlocked', storage: '1TB', gradeNew: 630, gradeGood: 567, gradeBroken: 277 },
  ]},
  { id: 'd10', brand: 'Samsung', name: 'Galaxy S24+', fullName: 'Samsung Galaxy S24+', category: 'Samsung', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/samsung/galaxy-s24-plus/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '256GB', gradeNew: 370, gradeGood: 330, gradeBroken: 160 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 415, gradeGood: 373, gradeBroken: 182 },
  ]},
  { id: 'd11', brand: 'Samsung', name: 'Galaxy S24', fullName: 'Samsung Galaxy S24', category: 'Samsung', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/samsung/galaxy-s24/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '128GB', gradeNew: 300, gradeGood: 270, gradeBroken: 131 },
    { network: 'Unlocked', storage: '256GB', gradeNew: 335, gradeGood: 301, gradeBroken: 147 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 380, gradeGood: 342, gradeBroken: 167 },
  ]},
  { id: 'd12', brand: 'Samsung', name: 'Galaxy S23 Ultra', fullName: 'Samsung Galaxy S23 Ultra', category: 'Samsung', imageUrl: 'https://storage.googleapis.com/atomjuice-product-images/samsung/galaxy-s23-ultra/default.png', isActive: true, createdAt: '2024-01-01', defaultPricing: [
    { network: 'Unlocked', storage: '256GB', gradeNew: 380, gradeGood: 342, gradeBroken: 167 },
    { network: 'Unlocked', storage: '512GB', gradeNew: 425, gradeGood: 382, gradeBroken: 187 },
  ]},
];

export const mockOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'CMM1001', source: 'WEBSITE', status: 'RECEIVED',
    createdAt: '2025-02-20T10:30:00Z', updatedAt: '2025-02-20T10:30:00Z',
    customerName: 'James Wilson', customerPhone: '03333356679', customerEmail: 'james@example.com',
    customerAddress: '12 Baker Street, London, W1U 3BT',
    deviceId: 'd1', deviceName: 'Apple iPhone 16 Pro Max', network: 'Unlocked',
    deviceGrade: 'GOOD', storage: '256GB', offeredPrice: 655,
    postageMethod: 'label', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'Barclays', accountNumber: '12345678', sortCode: '20-00-00' },
    transactionId: 'TXN-001',
  },
  {
    id: 'o2', orderNumber: 'CMM1002', source: 'API', status: 'PACK_SENT',
    createdAt: '2025-02-19T14:15:00Z', updatedAt: '2025-02-20T08:00:00Z',
    customerName: 'Sarah Brown', customerPhone: '03333356679', customerEmail: 'sarah@example.com',
    customerAddress: '45 High Street, Manchester, M1 1AD',
    deviceId: 'd4', deviceName: 'Apple iPhone 15 Pro Max', network: 'O2',
    deviceGrade: 'BROKEN', storage: '512GB', offeredPrice: 280,
    postageMethod: 'postbag', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'Santander', accountNumber: '23456789', sortCode: '09-01-28' },
    transactionId: 'TXN-002',
  },
  {
    id: 'o3', orderNumber: 'CMM1003', source: 'API', status: 'INSPECTION_PASSED',
    createdAt: '2025-02-18T09:00:00Z', updatedAt: '2025-02-21T11:00:00Z',
    customerName: 'Mike Chen', customerPhone: '03333356679', customerEmail: 'mike@example.com',
    customerAddress: '7 Oak Avenue, Birmingham, B1 1BB',
    deviceId: 'd9', deviceName: 'Samsung Galaxy S24 Ultra', network: 'Unlocked',
    deviceGrade: 'NEW', storage: '1TB', offeredPrice: 525, finalPrice: 525,
    postageMethod: 'label', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'HSBC', accountNumber: '87654321', sortCode: '40-00-00' },
    transactionId: 'TXN-003',
  },
  {
    id: 'o4', orderNumber: 'CMM1004', source: 'WEBSITE', status: 'PAYOUT_READY',
    createdAt: '2025-02-17T16:45:00Z', updatedAt: '2025-02-22T09:30:00Z',
    customerName: 'Emma Davis', customerPhone: '03333356679', customerEmail: 'emma@example.com',
    customerAddress: '23 Rose Lane, Leeds, LS1 1AB',
    deviceId: 'd2', deviceName: 'Apple iPhone 16 Pro', network: 'Vodafone',
    deviceGrade: 'GOOD', storage: '128GB', offeredPrice: 555, finalPrice: 555,
    postageMethod: 'postbag', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'Nationwide', accountNumber: '44556677', sortCode: '07-00-30' },
    transactionId: 'TXN-004',
  },
  {
    id: 'o5', orderNumber: 'CMM1005', source: 'API', status: 'PRICE_REVISED',
    createdAt: '2025-02-16T11:20:00Z', updatedAt: '2025-02-21T15:00:00Z',
    customerName: 'Tom Parker', customerPhone: '03333356679', customerEmail: 'tom@example.com',
    customerAddress: '89 Pine Road, Bristol, BS1 1AA',
    deviceId: 'd3', deviceName: 'Apple iPhone 16', network: 'EE',
    deviceGrade: 'GOOD', storage: '128GB', offeredPrice: 425, finalPrice: 380,
    postageMethod: 'label', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'NatWest', accountNumber: '11223344', sortCode: '60-00-01' },
    transactionId: 'TXN-005',
    priceRevisionReason: 'Screen has hairline crack top right corner',
  },
  {
    id: 'o6', orderNumber: 'CMM1006', source: 'WEBSITE', status: 'PAID',
    createdAt: '2025-02-10T13:00:00Z', updatedAt: '2025-02-15T10:00:00Z',
    customerName: 'Lucy Johnson', customerPhone: '03333356679', customerEmail: 'lucy@example.com',
    customerAddress: '56 Elm Street, Edinburgh, EH1 1AB',
    deviceId: 'd5', deviceName: 'Apple iPhone 15 Pro', network: 'Unlocked',
    deviceGrade: 'GOOD', storage: '256GB', offeredPrice: 440, finalPrice: 440,
    postageMethod: 'label', paymentMethod: 'bank', paymentStatus: 'PAID',
    payoutDetails: { bankName: 'Lloyds', accountNumber: '99887766', sortCode: '30-00-09' },
    transactionId: 'TXN-006',
  },
  {
    id: 'o7', orderNumber: 'CMM1007', source: 'API', status: 'CANCELLED',
    createdAt: '2025-02-12T10:00:00Z', updatedAt: '2025-02-13T08:00:00Z',
    customerName: 'David Smith', customerPhone: '03333356679', customerEmail: 'david@example.com',
    customerAddress: '31 Oak Road, Cardiff, CF1 1AD',
    deviceId: 'd11', deviceName: 'Samsung Galaxy S24', network: 'Three',
    deviceGrade: 'BROKEN', storage: '128GB', offeredPrice: 120,
    postageMethod: 'postbag', paymentMethod: 'bank', paymentStatus: 'PENDING',
    payoutDetails: { bankName: 'TSB', accountNumber: '55667788', sortCode: '30-96-34' },
    transactionId: 'TXN-007',
  },
];

export const mockPricingEntries: PricingEntry[] = [
  { id: 'p1', deviceId: 'd1', deviceName: 'Apple iPhone 16 Pro Max', network: 'Unlocked', storage: '256GB', gradeNew: 655, gradeGood: 590, gradeBroken: 290, deeplink: '/sell?device=iphone16promax', updatedAt: '2025-02-01' },
  { id: 'p2', deviceId: 'd1', deviceName: 'Apple iPhone 16 Pro Max', network: 'Unlocked', storage: '512GB', gradeNew: 700, gradeGood: 630, gradeBroken: 310, deeplink: '/sell?device=iphone16promax', updatedAt: '2025-02-01' },
  { id: 'p3', deviceId: 'd2', deviceName: 'Apple iPhone 16 Pro', network: 'Unlocked', storage: '128GB', gradeNew: 555, gradeGood: 500, gradeBroken: 240, deeplink: '/sell?device=iphone16pro', updatedAt: '2025-02-01' },
  { id: 'p4', deviceId: 'd3', deviceName: 'Apple iPhone 16', network: 'Unlocked', storage: '128GB', gradeNew: 425, gradeGood: 380, gradeBroken: 185, deeplink: '/sell?device=iphone16', updatedAt: '2025-02-01' },
  { id: 'p5', deviceId: 'd4', deviceName: 'Apple iPhone 15 Pro Max', network: 'Unlocked', storage: '256GB', gradeNew: 495, gradeGood: 445, gradeBroken: 215, deeplink: '/sell?device=iphone15promax', updatedAt: '2025-02-01' },
  { id: 'p6', deviceId: 'd9', deviceName: 'Samsung Galaxy S24 Ultra', network: 'Unlocked', storage: '256GB', gradeNew: 525, gradeGood: 470, gradeBroken: 230, deeplink: '/sell?device=s24ultra', updatedAt: '2025-02-01' },
  { id: 'p7', deviceId: 'd10', deviceName: 'Samsung Galaxy S24+', network: 'Unlocked', storage: '256GB', gradeNew: 370, gradeGood: 330, gradeBroken: 160, deeplink: '/sell?device=s24plus', updatedAt: '2025-02-01' },
];

export const mockApiLogs: ApiRequestLog[] = [
  { id: 'l1', timestamp: '2025-02-22T14:35:22Z', sourceIp: '185.23.10.45', endpoint: '/decisiontech', method: 'POST', statusCode: 200, success: true, orderNumber: 'CMM1002', payload: '{"device_name":"iPhone 15 Pro Max","network":"O2","device_grade":"BROKEN","offered_price":280}', responseTime: 142 },
  { id: 'l2', timestamp: '2025-02-22T11:12:08Z', sourceIp: '185.23.10.45', endpoint: '/decisiontech', method: 'POST', statusCode: 200, success: true, orderNumber: 'CMM1003', payload: '{"device_name":"Samsung Galaxy S24 Ultra","network":"Unlocked","device_grade":"NEW","offered_price":525}', responseTime: 98 },
  { id: 'l3', timestamp: '2025-02-21T16:55:00Z', sourceIp: '185.23.10.45', endpoint: '/decisiontech', method: 'POST', statusCode: 422, success: false, payload: '{"device_name":"","network":"EE","device_grade":"GOOD","offered_price":300}', error: 'device_name is required', responseTime: 22 },
  { id: 'l4', timestamp: '2025-02-20T09:15:44Z', sourceIp: '185.23.10.45', endpoint: '/decisiontech', method: 'POST', statusCode: 200, success: true, orderNumber: 'CMM1005', payload: '{"device_name":"iPhone 16","network":"EE","device_grade":"GOOD","offered_price":425}', responseTime: 115 },
  { id: 'l5', timestamp: '2025-02-19T14:20:11Z', sourceIp: '203.0.113.22', endpoint: '/decisiontech', method: 'POST', statusCode: 401, success: false, payload: '{}', error: 'IP not whitelisted', responseTime: 8 },
];

export const defaultStorageOptions: UtilityItem[] = [
  { id: 'st1', name: '64GB', sortOrder: 1, isActive: true },
  { id: 'st2', name: '128GB', sortOrder: 2, isActive: true },
  { id: 'st3', name: '256GB', sortOrder: 3, isActive: true },
  { id: 'st4', name: '512GB', sortOrder: 4, isActive: true },
  { id: 'st5', name: '1TB', sortOrder: 5, isActive: true },
];

export const defaultConditions: UtilityItem[] = [
  { id: 'c1', name: 'New / Mint', sortOrder: 1, isActive: true },
  { id: 'c2', name: 'Good', sortOrder: 2, isActive: true },
  { id: 'c3', name: 'Broken / Faulty', sortOrder: 3, isActive: true },
];

export const defaultNetworks: UtilityItem[] = [
  { id: 'n1', name: 'Unlocked', sortOrder: 1, isActive: true },
  { id: 'n2', name: 'EE', sortOrder: 2, isActive: true },
  { id: 'n3', name: 'O2', sortOrder: 3, isActive: true },
  { id: 'n4', name: 'Vodafone', sortOrder: 4, isActive: true },
  { id: 'n5', name: 'Three', sortOrder: 5, isActive: true },
  { id: 'n6', name: 'Sky Mobile', sortOrder: 6, isActive: true },
  { id: 'n7', name: 'iD Mobile', sortOrder: 7, isActive: true },
  { id: 'n8', name: 'Virgin Mobile', sortOrder: 8, isActive: true },
];

export const defaultBrands: UtilityItem[] = [
  { id: 'b1', name: 'Apple', sortOrder: 1, isActive: true },
  { id: 'b2', name: 'Samsung', sortOrder: 2, isActive: true },
];

export const defaultCategories: UtilityItem[] = [
  { id: 'cat1', name: 'iPhone', sortOrder: 1, isActive: true },
  { id: 'cat2', name: 'Samsung', sortOrder: 2, isActive: true },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
export function generateOrderNumber(): string {
  // Generate CMM format order numbers (CMM1001, CMM1002, etc.)
  const random = Math.floor(1001 + Math.random() * 8999);
  return `CMM${random}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Hook - useAdminStore ────────────────────────────────────────────────────
// This is a simple in-memory store using React state.
// In production, replace with Supabase / API calls.

export function useAdminStore() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersHasMore, setOrdersHasMore] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesPage, setDevicesPage] = useState(1);
  const [devicesHasMore, setDevicesHasMore] = useState(true);
  const [pricingEntries, setPricingEntries] = useState<PricingEntry[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [pricingPage, setPricingPage] = useState(1);
  const [pricingHasMore, setPricingHasMore] = useState(true);
  const [apiLogs, setApiLogs] = useState<ApiRequestLog[]>([]);
  const [loadingApiLogs, setLoadingApiLogs] = useState(true);
  const [storageOptions, setStorageOptions] = useState<UtilityItem[]>([]);
  const [conditions, setConditions] = useState<UtilityItem[]>([]);
  const [networks, setNetworks] = useState<UtilityItem[]>([]);
  const [brands, setBrands] = useState<UtilityItem[]>([]);
  const [categories, setCategories] = useState<UtilityItem[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<UtilityItem[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<UtilityItem[]>([]);
  const [loadingUtilities, setLoadingUtilities] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const fetchOrders = useCallback(async (params?: Parameters<typeof orderApi.getAllOrders>[0], append = false) => {
    try {
      setLoadingOrders(true);
      const page = params?.page ?? (append ? ordersPage : 1);
      const requestParams = { ...params };
      if (requestParams.page === undefined) {
        requestParams.page = page;
      }
      
      console.log('🔄 fetchOrders called with params:', { params: requestParams, append, page });
      console.log('🔑 Auth token exists:', !!localStorage.getItem('adminAuthToken'));
      console.log('🌐 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
      
      const res = await orderApi.getAllOrders(requestParams);
      
      console.log('📡 Raw API response:', res);
      console.log('✅ Response success:', res.success);
      console.log('📦 Response data type:', typeof res.data, Array.isArray(res.data) ? 'array' : 'object');
      console.log('📊 Response data:', res.data);
      
      // Python backend returns data as direct array, not nested under data.orders
      const ordersArr: any[] = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
      console.log('🔄 Processed orders array:', ordersArr);
      console.log('📈 Orders count:', ordersArr.length);
      
      if (res.success && ordersArr.length >= 0) {
        const mapped = ordersArr.map((o: any): Order => ({
          id: o._id || o.id,
          orderNumber: o.orderNumber,
          source: o.source,
          status: o.status,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerEmail: o.customerEmail || '',
          customerAddress: o.customerAddress,
          deviceId: o.deviceId || '',
          deviceName: o.deviceName,
          network: o.network,
          deviceGrade: o.deviceGrade,
          storage: o.storage,
          offeredPrice: o.offeredPrice,
          finalPrice: o.finalPrice,
          postageMethod: o.postageMethod,
          paymentMethod: o.paymentMethod || 'bank',
          paymentStatus: o.paymentStatus || 'PENDING',
          payoutDetails: o.payoutDetails || { bankName: '', accountNumber: '', sortCode: '' },
          transactionId: o.transactionId,
          priceRevisionReason: o.priceRevisionReason,
          partnerName: o.partnerName || null,
          counterOffer: o.counterOffer
            ? {
                hasCounterOffer: !!o.counterOffer.hasCounterOffer,
                latestOfferId: o.counterOffer.latestOfferId,
                status: o.counterOffer.status,
                revisedPrice: o.counterOffer.revisedPrice ?? null,
                respondedAt: o.counterOffer.respondedAt ?? null,
                reason: o.counterOffer.reason ?? null,
              }
            : undefined,
        }));
        
        console.log('🎯 Mapped orders:', mapped);
        
        if (append) {
          setOrders(prev => [...prev, ...mapped]);
        } else {
          setOrders(mapped);
          setOrdersPage(page);
        }
        const pagination = (res as any).pagination;
        console.log('📄 Pagination info:', pagination);
        setOrdersHasMore(pagination ? pagination.hasNextPage : false);
        if (append) {
          setOrdersPage(prev => prev + 1);
        }
      } else {
        console.warn('⚠️ API call failed or returned no data:', { success: res.success, ordersLength: ordersArr.length });
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch orders:', error);
      console.error('📋 Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    } finally {
      setLoadingOrders(false);
    }
  }, [ordersPage]);

  const loadMoreOrders = useCallback(async () => {
    if (!loadingOrders && ordersHasMore) {
      await fetchOrders({}, true);
    }
  }, [fetchOrders, loadingOrders, ordersHasMore]);

  const fetchPricing = useCallback(async (append = false) => {
    try {
      setLoadingPricing(true);
      const page = append ? pricingPage : 1;
      const res = await pricingApi.getAllPricing({ page });
      // Python backend returns data as direct array, not nested under data.pricing
      const pricingArr: any[] = Array.isArray(res.data) ? res.data : (res.data?.pricing || []);
      if (res.success && pricingArr.length >= 0) {
        const mapped = pricingArr.map((p: any): PricingEntry => ({
          id: p._id || p.id,
          deviceId: p.deviceId || p.device_id,
          deviceName: p.deviceName || p.device_name,
          network: p.network,
          storage: p.storage,
          gradeNew: p.gradeNew ?? p.grade_new ?? 0,
          gradeGood: p.gradeGood ?? p.grade_good ?? 0,
          gradeBroken: p.gradeBroken ?? p.grade_broken ?? 0,
          deeplink: '',
          updatedAt: p.updatedAt || p.updated_at,
        }));
        if (append) {
          setPricingEntries(prev => [...prev, ...mapped]);
        } else {
          setPricingEntries(mapped);
          setPricingPage(1);
        }
        const pagination = (res as any).pagination;
        setPricingHasMore(pagination ? pagination.hasNextPage : false);
        if (append) {
          setPricingPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoadingPricing(false);
    }
  }, [pricingPage]);

  const loadMorePricing = useCallback(async () => {
    if (!loadingPricing && pricingHasMore) {
      await fetchPricing(true);
    }
  }, [fetchPricing, loadingPricing, pricingHasMore]);

  const fetchApiLogs = useCallback(async () => {
    try {
      setLoadingApiLogs(true);
      const res = await apiGatewayApi.getAllLogs({ limit: 100, sortBy: 'timestamp', sortOrder: 'desc' });
      // Python backend returns data as direct array, not nested under data.logs
      const logsArr: any[] = Array.isArray(res.data) ? res.data : (res.data?.logs || []);
      if (res.success && logsArr.length >= 0) {
        const mapped = logsArr.map((log: any): ApiRequestLog => ({
          id: log._id || log.id,
          timestamp: log.timestamp,
          sourceIp: log.sourceIp || log.source_ip,
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode || log.status_code,
          success: log.success,
          orderNumber: log.orderNumber || log.order_number,
          payload: log.payload,
          error: log.error,
          responseTime: log.responseTime || log.response_time,
        }));
        setApiLogs(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
    } finally {
      setLoadingApiLogs(false);
    }
  }, []);

  const fetchDevices = useCallback(async (append = false) => {
    try {
      setLoadingDevices(true);
      const page = append ? devicesPage : 1;
      const res = await deviceApi.getAllDevices({ page });
      // Python backend returns data as direct array, not nested under data.devices
      const devicesArr: any[] = Array.isArray(res.data) ? res.data : (res.data?.devices || []);
      if (res.success && devicesArr.length >= 0) {
        const mapped = devicesArr.map((d: any): Device => ({
          id: d._id || d.id,
          brand: d.brand,
          name: d.name,
          fullName: d.fullName || d.full_name,
          category: d.category,
          imageUrl: d.imageUrl || d.image_url,
          isActive: d.isActive ?? d.is_active ?? true,
          createdAt: d.createdAt || d.created_at,
          defaultPricing: d.defaultPricing || d.default_pricing,
        }));
        if (append) {
          setDevices(prev => [...prev, ...mapped]);
        } else {
          setDevices(mapped);
          setDevicesPage(1);
        }
        const pagination = (res as any).pagination;
        setDevicesHasMore(pagination ? pagination.hasNextPage : false);
        if (append) {
          setDevicesPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  }, [devicesPage]);

  const loadMoreDevices = useCallback(async () => {
    if (!loadingDevices && devicesHasMore) {
      await fetchDevices(true);
    }
  }, [fetchDevices, loadingDevices, devicesHasMore]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const utilitiesRes = await utilitiesApi.getAllUtilities();

        if (utilitiesRes.success && utilitiesRes.data) {
          const mapToUtilityItem = (item: any): UtilityItem => ({
            id: item._id,
            name: item.name,
            value: item.value,
            color: item.color,
            sortOrder: item.sortOrder,
            isActive: item.isActive,
          });
          setStorageOptions(utilitiesRes.data.storageOptions?.map(mapToUtilityItem) || []);
          setConditions(utilitiesRes.data.deviceConditions?.map(mapToUtilityItem) || []);
          setNetworks(utilitiesRes.data.networks?.map(mapToUtilityItem) || []);
          setBrands(utilitiesRes.data.brands?.map(mapToUtilityItem) || []);
          setCategories(utilitiesRes.data.categories?.map(mapToUtilityItem) || []);
          setOrderStatuses(utilitiesRes.data.orderStatuses?.map(mapToUtilityItem) || []);
          setPaymentStatuses(utilitiesRes.data.paymentStatuses?.map(mapToUtilityItem) || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoadingUtilities(false);
      }
    };

    fetchData();
    fetchOrders();
    fetchDevices();
    fetchPricing();
    fetchApiLogs();
  }, [fetchOrders, fetchDevices, fetchPricing, fetchApiLogs]);

  // ── Orders ────────────────────────────────────────────────────────────────
  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await orderApi.createOrder({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerAddress: order.customerAddress,
        postcode: '',
        deviceId: order.deviceId,
        deviceName: order.deviceName,
        network: order.network,
        deviceGrade: order.deviceGrade,
        storage: order.storage,
        offeredPrice: order.offeredPrice,
        postageMethod: order.postageMethod,
        payoutDetails: {
          accountName: order.payoutDetails?.bankName || '',
          sortCode: order.payoutDetails?.sortCode || '',
          accountNumber: order.payoutDetails?.accountNumber || '',
        },
      });
      if (res.success && res.data?.order) {
        await fetchOrders();
        return res.data.order;
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }, [fetchOrders]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
      if (updates.status) {
        await orderApi.updateOrderStatus(id, updates.status);
      } else {
        await orderApi.updateOrder(id, updates as any);
      }
      // Refetch to ensure UI matches backend state
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }, [fetchOrders]);

  const deleteOrder = useCallback(async (id: string) => {
    // Optimistically remove from the list so the row disappears even if the
    // refetch races. If the backend call rejects, we re-fetch to restore
    // the row and surface the error to the caller.
    const previous = orders;
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      await orderApi.deleteOrder(id);
    } catch (error) {
      console.error('Failed to delete order:', error);
      setOrders(previous);
      throw error;
    }
  }, [orders]);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    await updateOrder(id, { status: status as any });
  }, [updateOrder]);

  // ── Fetch Single Order ──────────────────────────────────────────────────
  const fetchOrderById = useCallback(async (id: string): Promise<Order | null> => {
    try {
      const res = await orderApi.getOrderById(id);
      if (res.success && res.data?.order) {
        const o: any = res.data.order;
        const mapped: Order = {
          id: o._id || o.id || id,
          orderNumber: o.orderNumber,
          source: o.source as OrderSource,
          status: o.status as OrderStatus,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerEmail: o.customerEmail || '',
          customerAddress: o.customerAddress,
          deviceId: o.deviceId || o.device_id || '',
          deviceName: o.deviceName,
          network: o.network,
          deviceGrade: o.deviceGrade as DeviceGrade,
          storage: o.storage,
          offeredPrice: o.offeredPrice,
          finalPrice: o.finalPrice,
          postageMethod: o.postageMethod as PostageMethod,
          paymentMethod: (o.paymentMethod || 'bank') as PaymentMethod,
          paymentStatus: (o.paymentStatus || 'PENDING') as PaymentStatus,
          payoutDetails: {
            bankName: (o.payoutDetails?.accountName || o.payoutDetails?.account_name || ''),
            accountNumber: o.payoutDetails?.accountNumber || '',
            sortCode: o.payoutDetails?.sortCode || '',
          },
          transactionId: o.transactionId,
          priceRevisionReason: o.priceRevisionReason || o.price_revision_reason,
          partnerName: o.partnerName || o.partner_name || null,
          counterOffer: o.counterOffer
            ? {
                hasCounterOffer: !!o.counterOffer.hasCounterOffer,
                latestOfferId: o.counterOffer.latestOfferId,
                status: o.counterOffer.status,
                revisedPrice: o.counterOffer.revisedPrice ?? null,
                respondedAt: o.counterOffer.respondedAt ?? null,
                reason: o.counterOffer.reason ?? null,
              }
            : undefined,
        };
        return mapped;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch order by ID:', error);
      return null;
    }
  }, []);

  // ── Devices ───────────────────────────────────────────────────────────────
  const addDevice = useCallback(async (data: Omit<Device, 'id' | 'createdAt'>) => {
    try {
      const response = await deviceApi.createDevice({
        brand: data.brand,
        name: data.name,
        fullName: data.fullName,
        category: data.category,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        defaultPricing: data.defaultPricing,
      });

      if (response.success && response.data?.device) {
        const newDevice: Device = {
          id: response.data.device._id,
          brand: response.data.device.brand,
          name: response.data.device.name,
          fullName: response.data.device.fullName,
          category: response.data.device.category,
          imageUrl: response.data.device.imageUrl,
          isActive: response.data.device.isActive,
          createdAt: response.data.device.createdAt,
          defaultPricing: data.defaultPricing,
        };
        setDevices(prev => [newDevice, ...prev]);
        // Refetch pricing since backend create_device already inserted default_pricing entries
        await fetchPricing();
        return newDevice;
      }
    } catch (error) {
      console.error('Failed to create device:', error);
      throw error;
    }
  }, [fetchPricing]);

  const updateDevice = useCallback(async (id: string, updates: Partial<Device>, options?: { skipPricingSync?: boolean }) => {
    try {
      const response = await deviceApi.updateDevice(id, {
        brand: updates.brand,
        name: updates.name,
        fullName: updates.fullName,
        category: updates.category,
        imageUrl: updates.imageUrl,
        isActive: updates.isActive,
        defaultPricing: updates.defaultPricing,
      });

      if (response.success && response.data?.device) {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
        
        // Sync defaultPricing to backend pricing entries (unless skipPricingSync is true)
        if (updates.defaultPricing !== undefined && !options?.skipPricingSync) {
          const device = devices.find(d => d.id === id);
          const deviceName = updates.fullName || device?.fullName || '';
          
          // Fetch current pricing entries from backend to get correct IDs
          const pricingRes = await pricingApi.getAllPricing();
          const currentEntries = (pricingRes.success && pricingRes.data?.pricing)
            ? pricingRes.data.pricing
                .filter((p: any) => p.deviceId === id)
                .map((p: any) => ({
                  id: p._id,
                  deviceId: p.deviceId,
                  network: p.network,
                  storage: p.storage,
                  gradeNew: p.gradeNew,
                  gradeGood: p.gradeGood,
                  gradeBroken: p.gradeBroken,
                }))
            : [];
          
          if (updates.defaultPricing && updates.defaultPricing.length > 0) {
            // Prepare updates and creates in parallel
            const updatePromises: Promise<any>[] = [];
            const createPromises: Promise<any>[] = [];
            
            for (const pricing of updates.defaultPricing) {
              // Find existing entry by deviceId+network+storage combination
              const existing = currentEntries.find(
                e => e.network === pricing.network && e.storage === pricing.storage
              );
              
              if (existing) {
                // Update existing entry
                updatePromises.push(
                  pricingApi.updatePricing(existing.id, {
                    gradeNew: pricing.gradeNew,
                    gradeGood: pricing.gradeGood,
                    gradeBroken: pricing.gradeBroken,
                  })
                );
              } else {
                // Create new entry
                createPromises.push(
                  pricingApi.createPricing({
                    deviceId: id,
                    deviceName: deviceName,
                    network: pricing.network,
                    storage: pricing.storage,
                    gradeNew: pricing.gradeNew,
                    gradeGood: pricing.gradeGood,
                    gradeBroken: pricing.gradeBroken,
                  })
                );
              }
            }
            
            // Execute all updates and creates in parallel
            await Promise.all([...updatePromises, ...createPromises]);
            
            // Delete entries that are no longer in defaultPricing (in parallel)
            const newCombos = new Set(
              updates.defaultPricing.map(p => `${p.network}|${p.storage}`)
            );
            const deletePromises = currentEntries
              .filter(entry => !newCombos.has(`${entry.network}|${entry.storage}`))
              .map(entry => pricingApi.deletePricing(entry.id).catch(err => 
                console.error('Failed to delete pricing entry:', err)
              ));
            
            await Promise.all(deletePromises);
          } else {
            // Delete all pricing entries in parallel
            const deletePromises = currentEntries.map(entry =>
              pricingApi.deletePricing(entry.id).catch(err =>
                console.error('Failed to delete pricing entry:', err)
              )
            );
            await Promise.all(deletePromises);
          }
          
          // Refetch pricing to update UI
          await fetchPricing();
        }
      }
    } catch (error) {
      console.error('Failed to update device:', error);
      throw error;
    }
  }, [devices, pricingEntries, fetchPricing]);

  const deleteDevice = useCallback(async (id: string) => {
    try {
      await deviceApi.deleteDevice(id);
      setDevices(prev => prev.filter(d => d.id !== id));
      setPricingEntries(prev => prev.filter(p => p.deviceId !== id));
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  }, []);

  // ── Pricing ───────────────────────────────────────────────────────────────
  const addPricingEntry = useCallback(async (entry: Omit<PricingEntry, 'id' | 'updatedAt'>) => {
    try {
      const res = await pricingApi.createPricing({
        deviceId: entry.deviceId,
        deviceName: entry.deviceName,
        network: entry.network,
        storage: entry.storage,
        gradeNew: entry.gradeNew,
        gradeGood: entry.gradeGood,
        gradeBroken: entry.gradeBroken,
      });
      if (res.success && res.data?.pricing) {
        const newEntry: PricingEntry = {
          id: res.data.pricing._id,
          deviceId: res.data.pricing.deviceId,
          deviceName: res.data.pricing.deviceName,
          network: res.data.pricing.network,
          storage: res.data.pricing.storage,
          gradeNew: res.data.pricing.gradeNew,
          gradeGood: res.data.pricing.gradeGood,
          gradeBroken: res.data.pricing.gradeBroken,
          deeplink: entry.deeplink || '',
          updatedAt: res.data.pricing.updatedAt,
        };
        setPricingEntries(prev => [...prev, newEntry]);
        return newEntry;
      }
    } catch (error) {
      console.error('Failed to create pricing entry:', error);
      throw error;
    }
  }, []);

  const updatePricingEntry = useCallback(async (id: string, updates: Partial<PricingEntry>) => {
    try {
      const res = await pricingApi.updatePricing(id, {
        gradeNew: updates.gradeNew,
        gradeGood: updates.gradeGood,
        gradeBroken: updates.gradeBroken,
      });
      if (res.success && res.data?.pricing) {
        const pricing = res.data.pricing;
        setPricingEntries(prev => prev.map(p => p.id === id ? { 
          ...p, 
          gradeNew: pricing.gradeNew,
          gradeGood: pricing.gradeGood,
          gradeBroken: pricing.gradeBroken,
          updatedAt: pricing.updatedAt,
        } : p));
      }
    } catch (error) {
      console.error('Failed to update pricing entry:', error);
      throw error;
    }
  }, []);

  const deletePricingEntry = useCallback(async (id: string) => {
    try {
      await pricingApi.deletePricing(id);
      setPricingEntries(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete pricing entry:', error);
      throw error;
    }
  }, []);

  const bulkUpdatePricing = useCallback(async (updates: Array<{
    id: string;
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }>) => {
    try {
      const res = await pricingApi.bulkUpdatePricing(updates);
      if (res.success) {
        // Refetch pricing to ensure UI matches backend
        await fetchPricing();
      }
      return res;
    } catch (error) {
      console.error('Failed to bulk update pricing:', error);
      throw error;
    }
  }, [fetchPricing]);

  // ── Utilities CRUD (connected to backend) ────────────────────────────────
  const storageOptionsCRUD = {
    add: async (name: string) => {
      try {
        const response = await utilitiesApi.createStorageOption({ name, value: name });
        if (response.success && response.data) {
          const item: UtilityItem = {
            id: response.data.storageOption._id,
            name: response.data.storageOption.name,
            sortOrder: response.data.storageOption.sortOrder,
            isActive: response.data.storageOption.isActive,
          };
          setStorageOptions(prev => [...prev, item]);
        }
      } catch (error) {
        console.error('Failed to add storage option:', error);
      }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateStorageOption(id, updates);
        setStorageOptions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) {
        console.error('Failed to update storage option:', error);
      }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteStorageOption(id);
        setStorageOptions(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete storage option:', error);
      }
    },
    reorder: (items: UtilityItem[]) => setStorageOptions(items),
  };

  const conditionsCRUD = {
    add: async (name: string) => {
      try {
        const response = await utilitiesApi.createDeviceCondition({ name, value: name.toUpperCase() });
        if (response.success && response.data) {
          const item: UtilityItem = {
            id: response.data.condition._id,
            name: response.data.condition.name,
            sortOrder: response.data.condition.sortOrder,
            isActive: response.data.condition.isActive,
          };
          setConditions(prev => [...prev, item]);
        }
      } catch (error) {
        console.error('Failed to add condition:', error);
      }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateDeviceCondition(id, updates);
        setConditions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) {
        console.error('Failed to update condition:', error);
      }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteDeviceCondition(id);
        setConditions(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete condition:', error);
      }
    },
    reorder: (items: UtilityItem[]) => setConditions(items),
  };

  const networksCRUD = {
    add: async (name: string) => {
      try {
        const response = await utilitiesApi.createNetwork({ name, value: name });
        if (response.success && response.data) {
          const item: UtilityItem = {
            id: response.data.network._id,
            name: response.data.network.name,
            sortOrder: response.data.network.sortOrder,
            isActive: response.data.network.isActive,
          };
          setNetworks(prev => [...prev, item]);
        }
      } catch (error) {
        console.error('Failed to add network:', error);
      }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateNetwork(id, updates);
        setNetworks(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) {
        console.error('Failed to update network:', error);
      }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteNetwork(id);
        setNetworks(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete network:', error);
      }
    },
    reorder: (items: UtilityItem[]) => setNetworks(items),
  };

  const brandsCRUD = {
    add: async (name: string) => {
      try {
        const response = await utilitiesApi.createBrand({ name });
        if (response.success && response.data) {
          const item: UtilityItem = {
            id: response.data.brand._id,
            name: response.data.brand.name,
            sortOrder: response.data.brand.sortOrder,
            isActive: response.data.brand.isActive,
          };
          setBrands(prev => [...prev, item]);
        }
      } catch (error) {
        console.error('Failed to add brand:', error);
      }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateBrand(id, updates);
        setBrands(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) {
        console.error('Failed to update brand:', error);
      }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteBrand(id);
        setBrands(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete brand:', error);
      }
    },
    reorder: (items: UtilityItem[]) => setBrands(items),
  };

  const categoriesCRUD = {
    add: async (name: string) => {
      try {
        const response = await utilitiesApi.createCategory({ name });
        if (response.success && response.data) {
          const item: UtilityItem = {
            id: response.data.category._id,
            name: response.data.category.name,
            sortOrder: response.data.category.sortOrder,
            isActive: response.data.category.isActive,
          };
          setCategories(prev => [...prev, item]);
        }
      } catch (error) {
        console.error('Failed to add category:', error);
      }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateCategory(id, updates);
        setCategories(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) {
        console.error('Failed to update category:', error);
      }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteCategory(id);
        setCategories(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    },
    reorder: (items: UtilityItem[]) => setCategories(items),
  };

  const orderStatusesCRUD = {
    add: async (name: string, extra?: { value?: string; color?: string }) => {
      try {
        const response = await utilitiesApi.createOrderStatus({ name, value: extra?.value || name.toUpperCase().replace(/\s+/g, '_'), color: extra?.color });
        if (response.success && response.data) {
          const item: UtilityItem = { id: response.data.order_status._id, name: response.data.order_status.name, sortOrder: response.data.order_status.sortOrder, isActive: response.data.order_status.isActive, color: response.data.order_status.color, value: response.data.order_status.value };
          setOrderStatuses(prev => [...prev, item]);
        }
      } catch (error) { console.error('Failed to add order status:', error); }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updateOrderStatus(id, updates as any);
        setOrderStatuses(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) { console.error('Failed to update order status:', error); }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deleteOrderStatus(id);
        setOrderStatuses(prev => prev.filter(i => i.id !== id));
      } catch (error) { console.error('Failed to delete order status:', error); }
    },
    reorder: (items: UtilityItem[]) => setOrderStatuses(items),
  };

  const paymentStatusesCRUD = {
    add: async (name: string, extra?: { value?: string; color?: string }) => {
      try {
        const response = await utilitiesApi.createPaymentStatus({ name, value: extra?.value || name.toUpperCase().replace(/\s+/g, '_'), color: extra?.color });
        if (response.success && response.data) {
          const item: UtilityItem = { id: response.data.payment_status._id, name: response.data.payment_status.name, sortOrder: response.data.payment_status.sortOrder, isActive: response.data.payment_status.isActive, color: response.data.payment_status.color, value: response.data.payment_status.value };
          setPaymentStatuses(prev => [...prev, item]);
        }
      } catch (error) { console.error('Failed to add payment status:', error); }
    },
    update: async (id: string, updates: Partial<UtilityItem>) => {
      try {
        await utilitiesApi.updatePaymentStatus(id, updates as any);
        setPaymentStatuses(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } catch (error) { console.error('Failed to update payment status:', error); }
    },
    remove: async (id: string) => {
      try {
        await utilitiesApi.deletePaymentStatus(id);
        setPaymentStatuses(prev => prev.filter(i => i.id !== id));
      } catch (error) { console.error('Failed to delete payment status:', error); }
    },
    reorder: (items: UtilityItem[]) => setPaymentStatuses(items),
  };

  // ── API Gateway test order ────────────────────────────────────────────────
  const processApiOrder = useCallback(async (payload: Record<string, unknown>, partnerKey?: string) => {
    try {
      const res = await apiGatewayApi.testOrder(payload, partnerKey);
      const raw = (res as any)?.data ? (res as any).data : res;
      
      // Refresh logs and orders after test
      await fetchApiLogs();
      await fetchOrders();
      
      if (res.success || raw?.success) {
        return {
          success: true,
          orderNumber: raw?.orderNumber || raw?.data?.orderNumber || raw?.order?.orderNumber,
          message: raw?.message || raw?.data?.message || 'Order created successfully',
        };
      } else {
        return {
          success: false,
          error: raw?.error || raw?.data?.error || res.error || 'Failed to create order',
        };
      }
    } catch (error: any) {
      console.error('API test order error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create order',
      };
    }
  }, [fetchApiLogs, fetchOrders]);

  const fetchPartners = useCallback(async () => {
    try {
      setLoadingPartners(true);
      const res = await partnerApi.getAll();
      if (res.success && res.data?.partners) {
        const mapped = res.data.partners.map((p: any): Partner => ({
          id: p._id,
          name: p.name,
          keyPrefix: p.keyPrefix,
          isActive: p.isActive,
          totalOrders: p.totalOrders,
          lastUsedAt: p.lastUsedAt,
          createdAt: p.createdAt,
        }));
        setPartners(mapped);
      }
    } catch (error) {
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  const createPartner = useCallback(async (name: string) => {
    const res = await partnerApi.create(name);
    if (res.success && res.data?.partner) {
      const p = res.data.partner;
      setPartners(prev => [{
        id: (p as any)._id || p.id,
        name: p.name,
        keyPrefix: p.keyPrefix,
        isActive: p.isActive,
        totalOrders: p.totalOrders ?? 0,
        lastUsedAt: p.lastUsedAt ?? null,
        createdAt: p.createdAt,
      }, ...prev]);
    }
    return res;
  }, []);

  const regeneratePartnerKey = useCallback(async (id: string) => {
    const res = await partnerApi.regenerateKey(id);
    return res;
  }, []);

  const togglePartner = useCallback(async (id: string) => {
    const res = await partnerApi.toggle(id);
    if (res.success && res.data?.partner) {
      const p = res.data.partner;
      setPartners(prev => prev.map(x => x.id === id ? {
        ...x,
        isActive: p.isActive,
      } : x));
    }
  }, []);

  const deletePartner = useCallback(async (id: string) => {
    await partnerApi.delete(id);
    setPartners(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    orders, addOrder, updateOrder, deleteOrder, updateOrderStatus, fetchOrders, fetchOrderById, loadingOrders, loadMoreOrders, ordersHasMore, ordersPage,
    devices, addDevice, updateDevice, deleteDevice, loadingDevices, fetchDevices, loadMoreDevices, devicesHasMore,
    pricingEntries, addPricingEntry, updatePricingEntry, deletePricingEntry, bulkUpdatePricing, fetchPricing, loadingPricing, loadMorePricing, pricingHasMore,
    apiLogs, processApiOrder, fetchApiLogs, loadingApiLogs,
    storageOptions, storageOptionsCRUD,
    conditions, conditionsCRUD,
    networks, networksCRUD,
    brands, brandsCRUD,
    categories, categoriesCRUD,
    orderStatuses, orderStatusesCRUD,
    paymentStatuses, paymentStatusesCRUD,
    loadingUtilities,
    partners, loadingPartners, fetchPartners, createPartner, regeneratePartnerKey, togglePartner, deletePartner,
  };
}

export type AdminStore = ReturnType<typeof useAdminStore>;
