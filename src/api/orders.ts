import api from './api';

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  postcode: string;
  deviceId?: string;
  deviceName: string;
  network: string;
  deviceGrade: 'NEW' | 'GOOD' | 'BROKEN';
  storage: string;
  offeredPrice: number;
  postageMethod: 'label' | 'postbag';
  payoutDetails: {
    accountName: string;
    sortCode: string;
    accountNumber: string;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  source: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  deviceName: string;
  network: string;
  deviceGrade: string;
  storage: string;
  offeredPrice: number;
  finalPrice?: number;
  postageMethod: string;
  trackingNumber?: string;
  paymentMethod: string;
  paymentStatus: string;
  payoutDetails: {
    accountName?: string;
    accountNumber: string;
    sortCode: string;
  };
  transactionId?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface OrderFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  paymentStatus?: string;
  grade?: string;
  network?: string;
  postageMethod?: string;
  partner?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function toQueryString(params?: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  return queryParams.toString();
}

export const orderApi = {
  async createOrder(payload: CreateOrderPayload) {
    return api.post<{ order: Order; message: string }>('/orders', payload);
  },

  async getAllOrders(params?: OrderFilterParams) {
    return api.get<OrdersResponse>(`/orders?${toQueryString(params)}`);
  },

  /** Server-side CSV export using the same filters as the orders list. */
  async exportOrders(params?: Omit<OrderFilterParams, 'page' | 'limit' | 'sortBy' | 'sortOrder'>) {
    return api.download(`/export/orders?${toQueryString(params)}`);
  },

  async getOrderById(id: string) {
    return api.get<{ order: Order }>(`/orders/${id}`);
  },

  async updateOrder(id: string, data: Partial<CreateOrderPayload>) {
    return api.put<{ order: Order; message: string }>(`/orders/${id}`, data);
  },

  async updateOrderStatus(id: string, status: string, comment?: string) {
    // `comment` is an optional staff note that gets included in the customer's
    // status-update email. Omitted/empty → the standard email goes out.
    return api.patch<{ order: Order; message: string }>(`/orders/${id}/status`, { status, comment });
  },

  async deleteOrder(id: string) {
    return api.delete<{ message: string }>(`/orders/${id}`);
  },

  async bulkUpdateOrders(orderIds: string[], updates: Partial<Order>) {
    return api.post<{ message: string; modifiedCount: number }>('/orders/bulk-update', {
      orderIds,
      updates,
    });
  },
};

export default orderApi;
