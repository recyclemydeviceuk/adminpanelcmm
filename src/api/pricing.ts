import api from './api';

export interface Pricing {
  _id: string;
  deviceId: string;
  deviceName: string;
  network: string;
  storage: string;
  gradeNew: number;
  gradeGood: number;
  gradeBroken: number;
  updatedAt: string;
  createdAt: string;
}

export interface PricingResponse {
  pricing: Pricing[];
}

export interface QuoteResponse {
  price: number;
  deviceName: string;
  network: string;
  storage: string;
  grade: string;
}

export const pricingApi = {
  async getAllPricing(params?: {
    deviceId?: string;
    network?: string;
    storage?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return api.get<PricingResponse>(`/pricing?${queryParams.toString()}`);
  },

  async getPricingByDevice(deviceId: string) {
    return api.get<PricingResponse>(`/pricing/device/${deviceId}`);
  },

  async getQuote(params: {
    deviceId: string;
    network: string;
    storage: string;
    grade: 'NEW' | 'GOOD' | 'BROKEN';
  }) {
    const queryParams = new URLSearchParams({
      deviceId: params.deviceId,
      network: params.network,
      storage: params.storage,
      grade: params.grade,
    });
    return api.get<QuoteResponse>(`/pricing/quote?${queryParams.toString()}`);
  },

  async createPricing(data: {
    deviceId: string;
    deviceName: string;
    network: string;
    storage: string;
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }) {
    return api.post<{ pricing: Pricing }>('/pricing', data);
  },

  async updatePricing(id: string, data: Partial<{
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }>) {
    return api.put<{ pricing: Pricing }>(`/pricing/${id}`, data);
  },

  async bulkUpdatePricing(updates: Array<{
    id: string;
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }>) {
    return api.post<{ message: string; modifiedCount: number }>('/pricing/bulk-update', { updates });
  },

  async deletePricing(id: string) {
    return api.delete<{ message: string }>(`/pricing/${id}`);
  },
};

export default pricingApi;
