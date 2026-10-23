import { Tabs } from 'expo-router';
import { Home, Search, ShoppingBag, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#E23744',
      tabBarInactiveTintColor: '#9C9C9C',
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
        elevation: 0,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Delivery',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Search',
          tabBarIcon: ({ color }) => <Search color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="orders" 
        options={{ 
          title: 'Orders',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={24} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={24} />
        }} 
      />
    </Tabs>
  );
}
