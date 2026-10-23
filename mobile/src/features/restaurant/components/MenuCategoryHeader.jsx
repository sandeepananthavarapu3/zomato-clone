import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';

export const MenuCategoryHeader = ({ title }) => {
  return (
    <View className="bg-white py-4 mt-2">
      <Text variant="h2">{title}</Text>
    </View>
  );
};
