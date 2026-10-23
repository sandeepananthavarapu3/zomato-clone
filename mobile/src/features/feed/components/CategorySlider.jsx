import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppText as Text } from '../../../shared/components/ui/Text';

const categories = [
  { id: 1, name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop' },
  { id: 2, name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop' },
  { id: 3, name: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
  { id: 4, name: 'Dosa', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=300&auto=format&fit=crop' },
  { id: 5, name: 'Chicken', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=300&auto=format&fit=crop' },
  { id: 6, name: 'Paneer', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?q=80&w=300&auto=format&fit=crop' },
  { id: 7, name: 'Cakes', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=300&auto=format&fit=crop' },
  { id: 8, name: 'Rolls', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=300&auto=format&fit=crop' },
  { id: 9, name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop' },
  { id: 10, name: 'Momos', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=300&auto=format&fit=crop' },
  { id: 11, name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=300&auto=format&fit=crop' },
  { id: 12, name: 'Noodles', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=300&auto=format&fit=crop' },
  { id: 13, name: 'Coffee', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=300&auto=format&fit=crop' },
  { id: 14, name: 'Pasta', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=300&auto=format&fit=crop' },
  { id: 15, name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&auto=format&fit=crop' },
  { id: 16, name: 'Sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=300&auto=format&fit=crop' }
];

export const CategorySlider = () => {
  const router = useRouter();
  return (
    <View className="py-4 bg-white mt-2">
      <Text className="font-extrabold text-xl mb-4 px-4 text-gray-800 tracking-tight">Eat what makes you happy</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View className="flex-row items-center">
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} className="items-center mr-6" onPress={() => router.push("/restaurant/zomato-clone-biryani")}>
              <View className="w-24 h-24 rounded-full shadow-sm bg-gray-100 overflow-hidden mb-3">
                <Image 
                  source={{ uri: cat.image }} 
                  className="w-full h-full"
                  contentFit="cover"
                />
              </View>
              <Text className="text-sm font-medium text-gray-700">{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
