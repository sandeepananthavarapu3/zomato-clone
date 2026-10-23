import { useQuery } from '@tanstack/react-query';

const mockRestaurantData = {
  id: 1,
  name: 'Burger King',
  cuisines: 'Burger, Fast Food',
  rating: 4.3,
  location: 'Connaught Place',
  distance: '2.5 km',
  image: 'https://via.placeholder.com/800x400',
  menu: [
    {
      title: 'Recommended',
      data: [
        { id: 101, name: 'Whopper', price: 17900, isVeg: false, desc: 'Our signature Whopper', image: 'https://via.placeholder.com/200x200' },
        { id: 102, name: 'Veg Whopper', price: 14900, isVeg: true, desc: 'Veg patty Whopper', image: 'https://via.placeholder.com/200x200' }
      ]
    }
  ]
};

import { api } from '../../../shared/services/api';

export const useRestaurantQuery = (id) => {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      // 1. Fetch the exact restaurant metadata
      const infoRes = await api.get(`/restaurants/${id}`);
      const restaurantInfo = infoRes.data.data;

      // 2. Fetch the actual menu for this slug
      const menuRes = await api.get(`/restaurants/${id}/menu`);
      const menuData = menuRes.data.data;

      // 3. Format menu for SectionList
      const formattedMenu = Object.keys(menuData).map(categoryName => ({
        title: categoryName,
        data: menuData[categoryName].map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg,
          desc: item.description,
          isAvailable: item.isAvailable,
          image: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000'
        }))
      }));

      return {
        id: restaurantInfo._id,
        name: restaurantInfo.name,
        cuisines: restaurantInfo.cuisineTypes.join(', '),
        rating: restaurantInfo.rating.average,
        location: restaurantInfo.address.city,
        distance: 'Nearby',
        image: restaurantInfo.coverImage,
        isWelcomeOfferEnabled: restaurantInfo.isWelcomeOfferEnabled,
        customCoupons: restaurantInfo.customCoupons || [],
        menu: formattedMenu
      };
    }
  });
};
