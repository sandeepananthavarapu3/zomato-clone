import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';

export const StarRating = ({ rating, size = 12, className }) => {
  return (
    <View className={`flex-row items-center bg-green-600 px-1 rounded ${className || ''}`}>
      <Text className="text-white text-xs font-bold mr-1">{rating.toFixed(1)}</Text>
      <Star size={size} color="white" fill="white" />
    </View>
  );
};
