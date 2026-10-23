import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { useAuthStore } from '../../src/features/auth/store/useAuthStore';
import { LogOut, Heart, MapPin, Settings } from 'lucide-react-native';

import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const menuItems = [
    { icon: <Heart color="#1C1C1C" size={20} />, title: 'Favorites' },
    { icon: <MapPin color="#1C1C1C" size={20} />, title: 'My Addresses' },
    { icon: <Settings color="#1C1C1C" size={20} />, title: 'Settings' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white p-6 mb-2 border-b border-surface">
        <View className="w-20 h-20 bg-zomato/10 rounded-full items-center justify-center mb-4">
          <Text className="text-zomato text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text variant="h1">{user?.name || 'User'}</Text>
        <Text className="text-textSecondary mt-1">{user?.phone}</Text>
      </View>

      <View className="bg-white px-4 py-2">
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className="flex-row items-center py-4 border-b border-surface"
            onPress={() => item.title === 'Settings' ? router.push('/settings') : alert(`${item.title} screen is not implemented yet`)}
          >
            <View className="w-8">{item.icon}</View>
            <Text className="font-medium text-base">{item.title}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity className="flex-row items-center py-4" onPress={handleLogout}>
          <View className="w-8"><LogOut color="#E23744" size={20} /></View>
          <Text className="font-medium text-base text-zomato">Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
