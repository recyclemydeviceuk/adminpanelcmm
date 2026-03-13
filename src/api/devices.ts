import api from './api';

export interface Device {
  _id: string;
  brand: string;
  name: string;
  fullName: string;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  specifications?: {
    screenSize?: string;
    processor?: string;
    camera?: string;
    battery?: string;
    releaseYear?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DevicesResponse {
  devices: Device[];
}

export interface CreateDevicePayload {
  brand: string;
  name: string;
  fullName: string;
  category: string;
  imageUrl?: string;
  isActive?: boolean;
  defaultPricing?: Array<{
    network: string;
    storage: string;
    gradeNew: number;
    gradeGood: number;
    gradeBroken: number;
  }>;
}

export interface UpdateDevicePayload extends Partial<CreateDevicePayload> {}

export const deviceApi = {
  async getAllDevices(params?: {
    brand?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
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
    return api.get<DevicesResponse>(`/devices?${queryParams.toString()}`);
  },

  async getDeviceById(id: string) {
    return api.get<{ device: Device; pricing: any[] }>(`/devices/${id}`);
  },

  async createDevice(data: CreateDevicePayload) {
    return api.post<{ device: Device; message: string }>('/devices', data);
  },

  async updateDevice(id: string, data: UpdateDevicePayload) {
    return api.put<{ device: Device; message: string }>(`/devices/${id}`, data);
  },

  async toggleDeviceStatus(id: string) {
    return api.patch<{ device: Device; message: string }>(`/devices/${id}/toggle`);
  },

  async deleteDevice(id: string) {
    return api.delete<{ message: string }>(`/devices/${id}`);
  },

  async importDevices(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ message: string; imported: number; skipped: number; errors: string[] }>('/devices/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default deviceApi;
