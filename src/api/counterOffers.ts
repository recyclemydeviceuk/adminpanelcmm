import api from './api';

export interface CounterOffer {
  _id: string;
  orderId: string;
  orderNumber: string;
  originalPrice: number;
  revisedPrice: number;
  reason: string;
  deviceImages: Array<{
    url: string;
    key: string;
    uploadedAt: Date;
  }>;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  customerResponse?: 'ACCEPTED' | 'DECLINED';
  customerFeedback?: string;
  respondedAt?: Date;
  expiresAt: Date;
  reviewToken: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCounterOfferData {
  revisedPrice: number;
  reason: string;
  deviceImages?: Array<{
    url: string;
    key: string;
  }>;
}

export const createCounterOffer = async (orderId: string, data: CreateCounterOfferData) => {
  const response = await api.post(`/counter-offers`, { order_id: orderId, ...data });
  return response.data;
};

export const getCounterOfferByToken = async (token: string) => {
  const response = await api.get(`/counter-offers/token/${token}`);
  return response.data;
};

export const acceptCounterOffer = async (token: string) => {
  const response = await api.post(`/counter-offers/token/${token}/accept`, {});
  return response.data;
};

export const declineCounterOffer = async (token: string, feedback?: string) => {
  const response = await api.post(`/counter-offers/token/${token}/reject`, { feedback });
  return response.data;
};

export const getOrderCounterOffers = async (orderId: string) => {
  const response = await api.get(`/counter-offers/order/${orderId}`);
  return response.data;
};
