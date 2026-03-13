import api from './api';

export interface DashboardStats {
  orders: {
    total: number;
    today: number;
    week: number;
    month: number;
    pending: number;
  };
  revenue: {
    total: number;
    month: number;
  };
  devices: {
    total: number;
    active: number;
  };
  api: {
    requests24h: number;
  };
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  status: string;
  source: string;
  customerName: string;
  deviceName: string;
  offeredPrice: number;
  finalPrice?: number;
  createdAt: string;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: string;
}

export const dashboardApi = {
  getStats: () => api.get<{ stats: DashboardStats }>('/dashboard/stats'),

  getRecentOrders: (limit?: number) =>
    api.get<{ orders: RecentOrder[] }>('/dashboard/recent-orders', { params: { limit } }),

  getStatusBreakdown: () =>
    api.get<{ breakdown: StatusBreakdown[]; total: number }>('/dashboard/status-breakdown'),

  getRevenue: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ totalRevenue: number; paidOrders: number; avgOrderValue: string }>('/dashboard/revenue', { params }),

  getOrdersOverTime: (period?: '7days' | '30days' | '90days' | '1year') =>
    api.get<{ period: string; data: Array<{ _id: any; count: number; date: string }> }>('/dashboard/orders-over-time', { params: { period } }),

  getTopDevices: (limit?: number) =>
    api.get<{ topDevices: Array<{ _id: string; count: number; totalValue: number }> }>('/dashboard/top-devices', { params: { limit } }),
};
