import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { CheckCircle2, Circle } from 'lucide-react-native';

const statuses = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'PREPARING', label: 'Food Preparing' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' }
];

import { XCircle } from 'lucide-react-native';

export const OrderTimeline = ({ currentStatus }) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <View className="bg-white p-4 rounded-xl shadow-sm items-center py-8">
        <XCircle color="#E23744" size={48} />
        <Text variant="h3" className="mt-4 text-[#E23744]">Order Cancelled</Text>
        <Text className="text-textSecondary text-center mt-2">This order has been cancelled.</Text>
      </View>
    );
  }

  let currentIndex = statuses.findIndex(s => s.key === currentStatus);
  if (currentIndex === -1 && currentStatus === 'RESTAURANT_ACCEPTED') currentIndex = 0;

  return (
    <View className="bg-white p-4 rounded-xl shadow-sm">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isLast = index === statuses.length - 1;
        
        return (
          <View key={status.key} className="flex-row">
            <View className="items-center mr-4">
              {isCompleted ? (
                <CheckCircle2 color="#3AB757" size={24} />
              ) : (
                <Circle color="#E8E8E8" size={24} />
              )}
              {!isLast && (
                <View className={`w-0.5 h-10 ${index < currentIndex ? 'bg-success' : 'bg-surface'}`} />
              )}
            </View>
            <View className="pt-1">
              <Text className={`font-medium ${isCompleted ? 'text-textPrimary' : 'text-textMuted'}`}>
                {status.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
