import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { SlidersHorizontal } from 'lucide-react-native';

const filters = ['Rating 4.0+', 'Fast Delivery', 'Pure Veg', 'Offers'];

export const QuickFilterBar = ({ currentSort, onSortChange }) => {
  return (
    <View className="py-2 mb-2 bg-white">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        <TouchableOpacity className="flex-row items-center border border-border rounded-lg px-3 py-1.5 mr-3">
          <SlidersHorizontal size={14} color="#1C1C1C" />
          <Text className="text-sm ml-1 font-medium">Sort</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`border rounded-lg px-3 py-1.5 mr-3 ${currentSort === 'new' ? 'border-[#E23744] bg-[#E23744]/10' : 'border-border'}`}
          onPress={() => onSortChange(currentSort === 'new' ? 'rating' : 'new')}
        >
          <Text className={`text-sm font-medium ${currentSort === 'new' ? 'text-[#E23744]' : 'text-[#1C1C1C]'}`}>New Arrivals</Text>
        </TouchableOpacity>
        
        {filters.map(filter => (
          <TouchableOpacity key={filter} className="border border-border rounded-lg px-3 py-1.5 mr-3">
            <Text className="text-sm font-medium text-[#1C1C1C]">{filter}</Text>
          </TouchableOpacity>
        ))}
        <View className="w-4" />
      </ScrollView>
    </View>
  );
};
