import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { VegBadge } from '../../../shared/components/ui/VegBadge';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { useCartStore } from '../store/useCartStore';

export const CartItemRow = ({ item }) => {
  const { addItem, removeItem, restaurantId, restaurantName, restaurantWelcomeOffer } = useCartStore();

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-surface">
      <View className="flex-row items-center flex-1">
        <VegBadge isVeg={item.isVeg} className="mr-2" />
        <Text className="font-medium flex-1">{item.name}</Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row items-center border border-border rounded mr-4 bg-white">
          <TouchableOpacity onPress={() => removeItem(item.id)} className="px-3 py-1">
            <Text className="text-zomato font-bold">-</Text>
          </TouchableOpacity>
          <Text className="font-medium px-2">{item.quantity}</Text>
          <TouchableOpacity onPress={() => addItem(item, restaurantId, restaurantName, restaurantWelcomeOffer)} className="px-3 py-1">
            <Text className="text-zomato font-bold">+</Text>
          </TouchableOpacity>
        </View>
        <PriceText priceInPaise={item.price * item.quantity} className="font-medium w-16 text-right" />
      </View>
    </View>
  );
};
