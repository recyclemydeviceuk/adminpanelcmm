import api from './api';

interface SendOTPResponse {
  message: string;
}

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface VerifyOTPResponse {
  token: string;
  admin: AdminUser;
}

interface GetMeResponse {
  admin: AdminUser;
}

export const adminAuthApi = {
  sendOTP: async (email: string) => {
    return api.post<SendOTPResponse>('/auth/request-otp', { email });
  },

  verifyOTP: async (email: string, otp: string) => {
    return api.post<VerifyOTPResponse>('/auth/verify-otp', { email, otp });
  },

  getMe: async () => {
    return api.get<GetMeResponse>('/auth/me');
  },

  logout: async () => {
    return api.post('/auth/logout', {});
  },
};

export type { AdminUser, SendOTPResponse, VerifyOTPResponse, GetMeResponse };
