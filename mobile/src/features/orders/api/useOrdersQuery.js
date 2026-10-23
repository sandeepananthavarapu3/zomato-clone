import { useQuery } from '@tanstack/react-query';

import { api } from '../../../shared/services/api';

export const useOrdersQuery = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders/my-orders');
      return response.data.data.map(order => ({
        id: order._id,
        restaurantName: order.restaurantName,
        date: new Date(order.createdAt).toLocaleString(),
        items: order.items.map(i => `${i.quantity} x ${i.name}`).join(', '),
        total: order.pricing?.total || 0,
        status: order.status
      }));
    }
  });
};
