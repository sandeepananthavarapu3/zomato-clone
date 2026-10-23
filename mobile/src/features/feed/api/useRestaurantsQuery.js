import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../../../shared/services/api';

const mockRestaurants = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Restaurant ${i + 1}`,
  image: 'https://via.placeholder.com/400x300',
  cuisines: ['North Indian', 'Chinese'],
  rating: 4.2,
  deliveryTime: '30-40 min',
  costForTwo: 50000,
  isPromoted: i % 5 === 0
}));

export const useRestaurantsQuery = (sort = 'rating') => {
  return useInfiniteQuery({
    queryKey: ['restaurants', sort],
    queryFn: async ({ pageParam = 1 }) => {
      // Fetch nearby restaurants from backend API
      const response = await api.get(`/restaurants/nearby?lat=17.385&lng=78.4867&sort=${sort}`);
      const backendData = response.data.data;
      
      // Map backend fields to frontend model
      const mappedData = backendData.map(r => ({
        id: r.slug, // Use slug for routing
        name: r.name,
        image: r.coverImage,
        cuisines: r.cuisineTypes,
        rating: r.rating.average,
        deliveryTime: `${r.estimatedDeliveryTimeMinutes} min`,
        costForTwo: r.costForTwo,
        isPromoted: false,
        isWelcomeOfferEnabled: r.isWelcomeOfferEnabled
      }));

      return {
        data: mappedData,
        nextPage: undefined // We get all 20 at once for now
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
};
