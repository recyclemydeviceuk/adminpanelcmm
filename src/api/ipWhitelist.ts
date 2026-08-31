import api from './api';

export interface IpWhitelistEntry {
  id: string;
  ip_address: string;
  label: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Response of GET /gateway/test — what the caller's source IP looks like to us. */
export interface GatewayTestResult {
  success: boolean;
  message: string;
  source_ip: string;
  /** null when the whitelist lookup itself failed — treat as "unknown". */
  ip_whitelisted: boolean | null;
  timestamp: string;
  partner?: string;
  partner_key_valid?: boolean;
  mode?: 'test' | 'live';
}

export const ipWhitelistApi = {
  getAll: () => api.get<{ entries: IpWhitelistEntry[] }>('/ip-whitelist'),

  add: (ip_address: string, label?: string, description?: string) =>
    api.post<{ entry: IpWhitelistEntry }>('/ip-whitelist', { ip_address, label, description }),

  toggle: (id: string) =>
    api.patch<{ entry: IpWhitelistEntry }>(`/ip-whitelist/${id}/toggle`, {}),

  remove: (id: string) => api.delete(`/ip-whitelist/${id}`),

  /** Connectivity check — reports the source IP we actually see. */
  test: () => api.get<GatewayTestResult>('/gateway/test'),
};
