import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { StarRating } from '../../../shared/components/ui/StarRating';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Tag } from 'lucide-react-native';

export const RestaurantCard = ({ restaurant }) => {
  const router = useRouter();
  const { user } = useAuthStore();

  const showWelcomeBadge = user?.isEligibleForNewUserBenefits && restaurant.isWelcomeOfferEnabled;

  return (
    <TouchableOpacity 
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-surface"
      onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      activeOpacity={0.9}
    >
      <View className="relative">
        <Image 
          source={{ uri: restaurant.image }} 
          className="w-full h-48"
          contentFit="cover"
        />
        {restaurant.isPromoted && (
          <View className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-medium">Promoted</Text>
          </View>
        )}
        {showWelcomeBadge && (
          <View className="absolute bottom-3 left-3 bg-blue-600 px-2 py-1 rounded-md flex-row items-center shadow-sm">
            <Tag color="#fff" size={14} className="mr-1" />
            <Text className="text-white text-xs font-bold">50% OFF</Text>
          </View>
        )}
        <View className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 rounded-md shadow-sm">
          <Text className="text-xs font-bold text-textPrimary">{restaurant.deliveryTime}</Text>
        </View>
      </View>
      
      <View className="p-3">
        <View className="flex-row justify-between items-start mb-1">
          <Text variant="h3" className="flex-1 mr-2" numberOfLines={1}>{restaurant.name}</Text>
          <StarRating rating={restaurant.rating} size={14} className="py-1 px-1.5" />
        </View>
        
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-sm text-textSecondary flex-1" numberOfLines={1}>
            {restaurant.cuisines.join(', ')}
          </Text>
          <View className="flex-row items-center">
            <PriceText priceInPaise={restaurant.costForTwo} className="text-sm text-textSecondary" />
            <Text className="text-sm text-textSecondary"> for two</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
