import { useMutation } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';
import { useCartStore } from '../../cart/store/useCartStore';

export const usePlaceOrderMutation = () => {
  return useMutation({
    mutationFn: async ({ items, couponCode }) => {
      const state = useCartStore.getState();
      
      const orderPayload = {
        restaurantId: state.restaurantId,
        couponCode: couponCode || undefined,
        items: items.map(item => ({
          itemId: item.id,
          quantity: item.quantity
        })),
        deliveryAddress: {
          street: "123 Main St",
          city: "Hyderabad",
          state: "TS",
          postalCode: "500001",
          coordinates: [78.4867, 17.3850],
          formattedAddress: "123 Main St, Hyderabad, TS 500001"
        },
        payment: {
          method: 'CASH',
          amount: items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        }
      };

      const response = await api.post('/orders', orderPayload);
      return response.data.data;
    }
  });
};
