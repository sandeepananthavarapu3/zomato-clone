import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { useOrdersQuery } from '../../src/features/orders/api/useOrdersQuery';
import { OrderCard } from '../../src/features/orders/components/OrderCard';
import { FlashList } from '@shopify/flash-list';

export default function OrdersScreen() {
  const { data: orders, isLoading } = useOrdersQuery();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="bg-white px-4 py-4 border-b border-surface">
        <Text variant="h2">Your Orders</Text>
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#E23744" />
        </View>
      ) : (
        <FlashList 
          data={orders}
          renderItem={({ item }) => <OrderCard order={item} />}
          estimatedItemSize={150}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
