import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { Search, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const SearchResultItem = ({ item }) => {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      className="flex-row items-center py-3 border-b border-surface"
      onPress={() => router.push(`/restaurant/${item.id}`)}
    >
      <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-3">
        {item.type === 'restaurant' ? <MapPin size={20} color="#696969" /> : <Search size={20} color="#696969" />}
      </View>
      <View>
        <Text className="font-medium text-base">{item.name}</Text>
        <Text className="text-textSecondary text-xs">{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};
