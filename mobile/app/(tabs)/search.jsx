import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon } from 'lucide-react-native';
import { useDebounce } from '../../src/shared/hooks/useDebounce';
import { useSearchQuery } from '../../src/features/search/api/useSearchQuery';
import { SearchResultItem } from '../../src/features/search/components/SearchResultItem';
import { FlashList } from '@shopify/flash-list';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const { data: results, isLoading } = useSearchQuery(debouncedQuery);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-3 border-b border-surface">
        <View className="flex-row items-center bg-surface px-3 py-2 rounded-xl">
          <SearchIcon color="#E23744" size={20} className="mr-2" />
          <TextInput 
            className="flex-1 text-base h-8"
            placeholder="Restaurant name or a dish..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>
      
      <View className="flex-1 px-4">
        {results?.length > 0 && (
          <FlashList 
            data={results}
            renderItem={({ item }) => <SearchResultItem item={item} />}
            estimatedItemSize={60}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
