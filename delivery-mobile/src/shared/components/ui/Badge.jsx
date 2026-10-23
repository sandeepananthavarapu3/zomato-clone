import React from 'react';
import { View, Text } from 'react-native';

export const Badge = ({ children, color = 'bg-blue-500', textClassName, className }) => {
  return (
    <View className={`rounded px-1.5 py-0.5 ${color} ${className || ''}`}>
      <Text className={`text-[10px] font-bold text-white uppercase ${textClassName || ''}`}>
        {children}
      </Text>
    </View>
  );
};
