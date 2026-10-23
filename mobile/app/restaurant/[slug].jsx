import React from 'react';
import { View, ScrollView, SectionList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRestaurantQuery } from '../../src/features/restaurant/api/useRestaurantQuery';
import { Image } from 'expo-image';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { StarRating } from '../../src/shared/components/ui/StarRating';
import { MenuItemCard } from '../../src/features/restaurant/components/MenuItemCard';
import { MenuCategoryHeader } from '../../src/features/restaurant/components/MenuCategoryHeader';
import { CartFloatingBar } from '../../src/features/cart/components/CartFloatingBar';
import { ArrowLeft, Tag, Search } from 'lucide-react-native';
import { useAuthStore } from '../../src/features/auth/store/useAuthStore';

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { data: restaurant, isLoading } = useRestaurantQuery(slug);
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortType, setSortType] = React.useState('none');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredMenu = React.useMemo(() => {
    if (!restaurant?.menu) return [];

    const isSearching = searchQuery.trim().length > 0;
    const isSorting = sortType !== 'none';
    const isFilteringCat = selectedCategory !== 'All';

    // If no filters/sorts are active, return original menu
    if (!isSearching && !isSorting && !isFilteringCat) {
      return restaurant.menu;
    }

    // If sorting globally or searching globally, flatten the list
    if (isSorting || isSearching) {
      let flatItems = restaurant.menu.flatMap(section => 
         section.data.map(item => ({ ...item, _category: section.title }))
      );

      // Filter by search
      if (isSearching) {
        const q = searchQuery.toLowerCase();
        flatItems = flatItems.filter(item => 
          item.name.toLowerCase().includes(q) || 
          (item.description && item.description.toLowerCase().includes(q))
        );
      }

      // Filter by category
      if (isFilteringCat) {
        flatItems = flatItems.filter(item => item._category === selectedCategory || item.category === selectedCategory);
      }

      // Sort
      if (sortType === 'nameAsc') flatItems.sort((a, b) => a.name.localeCompare(b.name));
      if (sortType === 'priceAsc') flatItems.sort((a, b) => a.price - b.price);
      if (sortType === 'priceDesc') flatItems.sort((a, b) => b.price - a.price);

      return flatItems.length > 0 ? [{ title: isSearching ? 'Search Results' : 'Sorted Menu', data: flatItems }] : [];
    } 
    
    // If ONLY filtering by category (no global sort/search), keep the section
    if (isFilteringCat) {
       const section = restaurant.menu.find(s => s.title === selectedCategory);
       return section ? [section] : [];
    }

    return restaurant.menu;
  }, [restaurant, searchQuery, sortType, selectedCategory]);


  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#E23744" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="relative h-64">
        <Image 
          source={{ uri: restaurant.image }} 
          className="w-full h-full"
          contentFit="cover"
        />
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} className="absolute top-12 left-4 bg-white/90 p-2 rounded-full">
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
      </View>
      
      <View className="px-4 py-4 border-b border-surface">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text variant="h1">{restaurant.name}</Text>
            <Text className="text-textSecondary mt-1">{restaurant.cuisines}</Text>
            <Text className="text-textSecondary text-xs">{restaurant.location} | {restaurant.distance}</Text>
          </View>
          <View className="bg-green-600 rounded-lg p-2 items-center">
            <Text className="text-white font-bold text-lg">{restaurant.rating}</Text>
            <Text className="text-white text-xs">Delivery</Text>
          </View>
        </View>
      </View>

      

      <View style={{ height: 75 }} className="mt-4 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {user?.isEligibleForNewUserBenefits && restaurant.isWelcomeOfferEnabled && (
          <View className="bg-blue-50 p-3 rounded-xl flex-row items-center border border-blue-200 mr-3" style={{ width: 260 }}>
            <View className="bg-blue-600 p-2 rounded-full mr-3">
              <Tag color="#fff" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-blue-700">WELCOME50</Text>
              <Text className="text-xs text-blue-600 mt-0.5">Save 50% on your first order</Text>
            </View>
          </View>
        )}
        
        {restaurant.customCoupons?.filter(c => c.isActive).map(c => (
          <View key={c.code} className="bg-purple-50 p-3 rounded-xl flex-row items-center border border-purple-200 mr-3" style={{ width: 240 }}>
            <View className="bg-purple-600 p-2 rounded-full mr-3">
              <Tag color="#fff" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-purple-700">{c.code}</Text>
              <Text className="text-xs text-purple-600 mt-0.5">Get {c.discountPercentage}% OFF (Max ₹{c.maxDiscount / 100})</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      </View>

      
      <View className="px-4 mb-2">
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
          <Search color="#666" size={20} />
          <TextInput 
            placeholder="Search in menu..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-base text-gray-800"
            placeholderTextColor="#999"
          />
        </View>

        <View className="flex-row mt-3 items-center">
          <Text className="text-xs font-bold text-gray-500 mr-2 uppercase w-12">Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', ...(restaurant?.menu?.map(s => s.title) || [])].map((cat, i) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full mr-2 border ${isActive ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`text-xs ${isActive ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="flex-row mt-2 items-center">
          <Text className="text-xs font-bold text-gray-500 mr-2 uppercase w-12">Sort:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['None', 'Name A-Z', 'Price Low-High', 'Price High-Low'].map((type, i) => {
              const key = ['none', 'nameAsc', 'priceAsc', 'priceDesc'][i];
              const isActive = sortType === key;
              return (
                <TouchableOpacity 
                  key={key} 
                  onPress={() => setSortType(key)}
                  className={`px-3 py-1.5 rounded-full mr-2 border ${isActive ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`text-xs ${isActive ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <SectionList 
        sections={filteredMenu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="px-4">
            <MenuItemCard 
              item={item} 
              restaurantId={restaurant.id} 
              restaurantName={restaurant.name} 
              isWelcomeOfferEnabled={restaurant.isWelcomeOfferEnabled}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-4">
            <MenuCategoryHeader title={title} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      <CartFloatingBar />
    </View>
  );
}
