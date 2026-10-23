import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { Button } from '../../../shared/components/ui/Button';

import { useRouter } from 'expo-router';

export const OrderCard = ({ order }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      className="bg-white p-4 mb-3 border-b border-surface"
      onPress={() => router.push(`/tracking/${order.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text variant="h3">{order.restaurantName}</Text>
          <Text className="text-textSecondary text-xs mt-1">{order.date}</Text>
        </View>
        <PriceText priceInPaise={order.total} className="font-bold" />
      </View>
      
      <Text className="text-textSecondary mb-3">{order.items}</Text>
      
      <View className="flex-row justify-between items-center mt-2 border-t border-surface pt-3">
        <Text className="text-success font-medium uppercase text-xs">{order.status}</Text>
        <Button variant="secondary" size="sm" className="py-1.5 px-4 rounded-md" onPress={() => alert('Reorder is not implemented yet')}>
          Reorder
        </Button>
      </View>
    </TouchableOpacity>
  );
};
