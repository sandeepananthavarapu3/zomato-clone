import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { useCartStore } from '../store/useCartStore';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';

export const CartFloatingBar = () => {
  const { items, getSubtotal, getItemCount } = useCartStore();
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <View className="absolute bottom-5 left-4 right-4">
      <TouchableOpacity 
        className="bg-zomato rounded-xl p-4 flex-row justify-between items-center shadow-lg"
        onPress={() => router.push('/checkout')}
      >
        <View className="flex-row items-center">
          <ShoppingBag color="white" size={20} className="mr-2" />
          <View>
            <Text className="text-white font-bold">{getItemCount()} items added</Text>
            <PriceText priceInPaise={getSubtotal()} className="text-white text-xs" />
          </View>
        </View>
        <Text className="text-white font-bold text-lg">View Cart ➔</Text>
      </TouchableOpacity>
    </View>
  );
};
