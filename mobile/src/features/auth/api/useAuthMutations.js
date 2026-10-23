import { useMutation } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';

export const useSendOtpMutation = () => {
  return useMutation({
    mutationFn: async (phone) => {
      const res = await api.post('/auth/send-otp', { phone });
      return res.data;
    }
  });
};

export const useVerifyOtpMutation = () => {
  return useMutation({
    mutationFn: async ({ phone, otp, name }) => {
      const res = await api.post('/auth/verify-otp', { phone, code: otp, name });
      return res.data.data; // returns { user, tokens, benefits, isNewRegistration }
    }
  });
};

export const useDeleteAccountMutation = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete('/auth/account');
      return res.data;
    }
  });
};
