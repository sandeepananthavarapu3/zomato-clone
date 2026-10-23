import React from 'react';
import { View } from 'react-native';

export const VegBadge = ({ isVeg, className }) => {
  const colorClass = isVeg ? 'border-green-600' : 'border-red-600';
  const bgClass = isVeg ? 'bg-green-600' : 'bg-red-600';
  
  return (
    <View className={`w-4 h-4 border ${colorClass} items-center justify-center rounded-sm ${className || ''}`}>
      <View className={`w-2 h-2 rounded-full ${bgClass}`} />
    </View>
  );
};
