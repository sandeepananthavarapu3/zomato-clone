import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { VegBadge } from '../../../shared/components/ui/VegBadge';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { Image } from 'expo-image';
import { useCartStore } from '../../cart/store/useCartStore';

export const MenuItemCard = ({ item, restaurantId, restaurantName }) => {
  const { items, addItem, removeItem } = useCartStore();
  const cartItem = items.find(i => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <View className={`flex-row py-4 border-b border-surface ${!item.isAvailable ? 'opacity-50' : ''}`}>
      <View className="flex-1 pr-4">
        <VegBadge isVeg={item.isVeg} className="mb-1" />
        <Text className="font-semibold text-lg">{item.name}</Text>
        <PriceText priceInPaise={item.price} className="font-medium mt-1 mb-2" />
        {!!item.desc && (
          <Text className="text-textSecondary text-sm line-clamp-2" numberOfLines={2}>
            {item.desc}
          </Text>
        )}
      </View>
      <View className="relative w-32 items-center">
        <Image 
          source={{ uri: item.image }} 
          className="w-32 h-32 rounded-xl bg-surface"
          contentFit="cover"
        />
        {!item.isAvailable ? (
          <View className="absolute -bottom-4 bg-gray-200 rounded-lg shadow-sm border border-gray-300 w-24 h-10 flex-row items-center justify-center overflow-hidden">
            <Text className="text-gray-500 font-bold text-xs uppercase text-center leading-3">Out of
Stock</Text>
          </View>
        ) : (
          <View className="absolute -bottom-4 bg-white rounded-lg shadow-sm border border-zomato/20 w-24 h-10 flex-row items-center justify-center overflow-hidden">
            {quantity === 0 ? (
              <TouchableOpacity 
                className="w-full h-full items-center justify-center bg-white"
                onPress={() => addItem(item, restaurantId, restaurantName)}
              >
                <Text className="text-zomato font-bold text-lg uppercase">ADD</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center w-full justify-between px-2 bg-white h-full">
                <TouchableOpacity onPress={() => removeItem(item.id)} className="p-2">
                  <Text className="text-zomato font-bold text-lg">-</Text>
                </TouchableOpacity>
                <Text className="text-zomato font-bold">{quantity}</Text>
                <TouchableOpacity onPress={() => addItem(item, restaurantId, restaurantName)} className="p-2">
                  <Text className="text-zomato font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
