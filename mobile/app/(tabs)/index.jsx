import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRestaurantsQuery } from '../../src/features/feed/api/useRestaurantsQuery';
import { RestaurantCard } from '../../src/features/feed/components/RestaurantCard';
import { CategorySlider } from '../../src/features/feed/components/CategorySlider';
import { OfferBanner } from '../../src/features/feed/components/OfferBanner';
import { PromoBanners } from '../../src/features/feed/components/PromoBanners';
import { QuickFilterBar } from '../../src/features/feed/components/QuickFilterBar';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { MapPin } from 'lucide-react-native';

export default function HomeScreen() {
  const [sort, setSort] = React.useState('rating');
  const { data, fetchNextPage, hasNextPage, isLoading } = useRestaurantsQuery(sort);

  const restaurants = data?.pages.flatMap(page => page.data) || [];

  const renderHeader = () => (
    <View>
      <View className="px-4 py-3 flex-row items-center bg-white">
        <MapPin color="#E23744" size={24} className="mr-2" />
        <View>
          <Text className="font-bold text-lg">Home</Text>
          <Text className="text-textSecondary text-xs">Connaught Place, New Delhi</Text>
        </View>
      </View>
      <OfferBanner />
      <PromoBanners />
      <CategorySlider />
      <QuickFilterBar currentSort={sort} onSortChange={setSort} />
      <Text variant="h3" className="px-4 py-2 mt-2">124 restaurants delivering to you</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E23744" />
        </View>
      ) : (
        <FlashList
          data={restaurants}
          renderItem={({ item }) => (
            <View className="px-4">
              <RestaurantCard restaurant={item} />
            </View>
          )}
          estimatedItemSize={250}
          ListHeaderComponent={renderHeader}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}
