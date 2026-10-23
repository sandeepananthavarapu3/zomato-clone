import { useQuery } from '@tanstack/react-query';

import { api } from '../../../shared/services/api';

export const useOrderQuery = (orderId) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data; // Return the exact backend order object directly
    },
    refetchInterval: 3000 // Poll every 3 seconds to see live updates!
  });
};
