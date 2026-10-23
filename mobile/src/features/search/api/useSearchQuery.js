import { useQuery } from '@tanstack/react-query';

import { api } from '../../../shared/services/api';

export const useSearchQuery = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return [];
      const res = await api.get(`/restaurants/search?q=${encodeURIComponent(query)}`);
      
      const restaurants = res.data.data.restaurants.map(r => ({
        id: r.slug || r._id,
        type: 'restaurant',
        name: r.name,
        subtitle: (r.cuisineTypes || []).join(', ') || 'Restaurant'
      }));
      
      const dishes = res.data.data.dishes.map(d => ({
        id: d.restaurantId?.slug || d.restaurantId?._id || 'unknown',
        type: 'dish',
        name: d.name,
        subtitle: `from ${d.restaurantId?.name || 'Unknown Restaurant'}`
      }));
      
      return [...restaurants, ...dishes];
    },
    enabled: query.length > 2
  });
};
