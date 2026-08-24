import api from './api';

export interface Partner {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  isTest: boolean;
  totalOrders: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatePartnerResponse {
  partner: Partner;
  apiKey: string;
}

export const partnerApi = {
  getAll: () => api.get<{ partners: any[] }>('/partners'),

  create: (name: string, isTest = false) =>
    api.post<CreatePartnerResponse>('/partners', { name, is_test: isTest }),

  regenerateKey: (id: string) =>
    api.post<CreatePartnerResponse>(`/partners/${id}/regenerate-key`, {}),

  toggle: (id: string) =>
    api.patch<{ partner: any }>(`/partners/${id}/toggle`, {}),

  delete: (id: string) => api.delete(`/partners/${id}`),
};
