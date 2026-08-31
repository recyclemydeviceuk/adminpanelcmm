import api from './api';

export interface ApiLogEntry {
  _id: string;
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
  partnerName?: string | null;
  ipWhitelisted?: boolean | null;
}

export const apiGatewayApi = {
  getAllLogs: (params?: {
    page?: number;
    limit?: number;
    success?: boolean;
    sourceIp?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get<{
    logs: ApiLogEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>('/api-logs', { params }),

  getLogById: (id: string) => api.get<{ log: ApiLogEntry }>(`/api-logs/${id}`),

  getLogStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      successRate: string;
      avgResponseTime: string;
      topSourceIps: Array<{ _id: string; count: number }>;
    }>('/api-logs/stats', { params }),

  cleanupOldLogs: (daysOld?: number) =>
    api.delete(`/api-logs`),

  testOrder: (payload: Record<string, unknown>, partnerKey?: string) =>
    api.post<{
      success: boolean;
      orderNumber?: string;
      message?: string;
      error?: string;
      order?: {
        id: string;
        orderNumber: string;
        status: string;
        createdAt: string;
      };
    }>('/gateway/orders', payload, partnerKey ? { headers: { 'X-Partner-Key': partnerKey } } : undefined),
};
