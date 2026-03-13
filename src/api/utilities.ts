import api from './api';

export interface StorageOption {
  _id: string;
  name: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCondition {
  _id: string;
  name: string;
  value: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Network {
  _id: string;
  name: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  value?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  value?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusItem {
  _id: string;
  name: string;
  value: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatusItem {
  _id: string;
  name: string;
  value: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UtilitiesResponse {
  storageOptions: StorageOption[];
  deviceConditions: DeviceCondition[];
  networks: Network[];
  brands: Brand[];
  categories: Category[];
  orderStatuses: OrderStatusItem[];
  paymentStatuses: PaymentStatusItem[];
}

export const utilitiesApi = {
  async getAllUtilities() {
    const [storageRes, conditionsRes, networksRes, brandsRes, categoriesRes, orderStatusRes, paymentStatusRes] = await Promise.allSettled([
      api.get<any>('/utilities/storage-options'),
      api.get<any>('/utilities/device-conditions'),
      api.get<any>('/utilities/networks'),
      api.get<any>('/utilities/brands'),
      api.get<any>('/utilities/categories'),
      api.get<any>('/utilities/order-statuses'),
      api.get<any>('/utilities/payment-statuses'),
    ]);
    // Python backend wraps response as { success, data: { KEY: [...] } }
    // Keys match camelCase: storageOptions, deviceConditions, networks, brands, categories, orderStatuses, paymentStatuses
    const get = (r: PromiseSettledResult<any>, ...keys: string[]): any[] => {
      if (r.status !== 'fulfilled') return [];
      const data = r.value?.data;
      for (const key of keys) {
        if (data?.[key]) return data[key];
      }
      return [];
    };
    return {
      success: true,
      data: {
        storageOptions: get(storageRes, 'storageOptions', 'storage_options'),
        deviceConditions: get(conditionsRes, 'deviceConditions', 'device_conditions'),
        networks: get(networksRes, 'networks'),
        brands: get(brandsRes, 'brands'),
        categories: get(categoriesRes, 'categories'),
        orderStatuses: get(orderStatusRes, 'orderStatuses', 'order_statuses'),
        paymentStatuses: get(paymentStatusRes, 'paymentStatuses', 'payment_statuses'),
      } as UtilitiesResponse,
    };
  },

  async getStorageOptions() {
    return api.get<{ storage_options: StorageOption[] }>('/utilities/storage-options');
  },
  async createStorageOption(data: { name: string; value?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ storageOption: StorageOption }>('/utilities/storage', data);
  },
  async updateStorageOption(id: string, data: Partial<StorageOption>) {
    return api.put<{ storageOption: StorageOption }>(`/utilities/storage/${id}`, data);
  },
  async deleteStorageOption(id: string) {
    return api.delete(`/utilities/storage/${id}`);
  },
  async reorderStorageOptions(items: { id: string; sortOrder: number }[]) {
    return api.post('/utilities/storage/reorder', { items });
  },

  async getDeviceConditions() {
    return api.get<{ device_conditions: DeviceCondition[] }>('/utilities/device-conditions');
  },
  async createDeviceCondition(data: { name: string; value?: string; description?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ condition: DeviceCondition }>('/utilities/conditions', data);
  },
  async updateDeviceCondition(id: string, data: Partial<DeviceCondition>) {
    return api.put<{ condition: DeviceCondition }>(`/utilities/conditions/${id}`, data);
  },
  async deleteDeviceCondition(id: string) {
    return api.delete(`/utilities/conditions/${id}`);
  },
  async reorderDeviceConditions(items: { id: string; sortOrder: number }[]) {
    return api.post('/utilities/conditions/reorder', { items });
  },

  async getNetworks() {
    return api.get<{ networks: Network[] }>('/utilities/networks');
  },
  async createNetwork(data: { name: string; value?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ network: Network }>('/utilities/networks', data);
  },
  async updateNetwork(id: string, data: Partial<Network>) {
    return api.put<{ network: Network }>(`/utilities/networks/${id}`, data);
  },
  async deleteNetwork(id: string) {
    return api.delete(`/utilities/networks/${id}`);
  },
  async reorderNetworks(items: { id: string; sortOrder: number }[]) {
    return api.post('/utilities/networks/reorder', { items });
  },

  async getBrands() {
    return api.get<{ brands: Brand[] }>('/utilities/brands');
  },
  async createBrand(data: { name: string; logo?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ brand: Brand }>('/utilities/brands', data);
  },
  async updateBrand(id: string, data: Partial<Brand>) {
    return api.put<{ brand: Brand }>(`/utilities/brands/${id}`, data);
  },
  async deleteBrand(id: string) {
    return api.delete(`/utilities/brands/${id}`);
  },
  async reorderBrands(items: { id: string; sortOrder: number }[]) {
    return api.post('/utilities/brands/reorder', { items });
  },

  async getCategories() {
    return api.get<{ categories: Category[] }>('/utilities/categories');
  },
  async createCategory(data: { name: string; description?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ category: Category }>('/utilities/categories', data);
  },
  async updateCategory(id: string, data: Partial<Category>) {
    return api.put<{ category: Category }>(`/utilities/categories/${id}`, data);
  },
  async deleteCategory(id: string) {
    return api.delete(`/utilities/categories/${id}`);
  },
  async reorderCategories(items: { id: string; sortOrder: number }[]) {
    return api.post('/utilities/categories/reorder', { items });
  },

  async getOrderStatuses() {
    return api.get<{ order_statuses: OrderStatusItem[] }>('/utilities/order-statuses');
  },
  async createOrderStatus(data: { name: string; value: string; color?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ order_status: OrderStatusItem }>('/utilities/order-statuses', data);
  },
  async updateOrderStatus(id: string, data: Partial<OrderStatusItem>) {
    return api.put<{ order_status: OrderStatusItem }>(`/utilities/order-statuses/${id}`, data);
  },
  async deleteOrderStatus(id: string) {
    return api.delete(`/utilities/order-statuses/${id}`);
  },

  async getPaymentStatuses() {
    return api.get<{ payment_statuses: PaymentStatusItem[] }>('/utilities/payment-statuses');
  },
  async createPaymentStatus(data: { name: string; value: string; color?: string; sortOrder?: number; isActive?: boolean }) {
    return api.post<{ payment_status: PaymentStatusItem }>('/utilities/payment-statuses', data);
  },
  async updatePaymentStatus(id: string, data: Partial<PaymentStatusItem>) {
    return api.put<{ payment_status: PaymentStatusItem }>(`/utilities/payment-statuses/${id}`, data);
  },
  async deletePaymentStatus(id: string) {
    return api.delete(`/utilities/payment-statuses/${id}`);
  },
};

export default utilitiesApi;
