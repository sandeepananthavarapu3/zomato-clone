import React, { useRef, useState, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
// Calculate banner width considering padding
const BANNER_WIDTH = Math.min(width * 0.85, 600);
const ITEM_WIDTH = BANNER_WIDTH + 16; // width + marginRight

const BANNERS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    title: 'Match Day Deals'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1000&auto=format&fit=crop',
    title: 'Pro Benefits'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop',
    title: 'Great Offers'
  }
];

export const PromoBanners = () => {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % BANNERS.length;
      setCurrentIndex(nextIndex);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextIndex * ITEM_WIDTH, animated: true });
      }
    }, 3000); // Slide every 3 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View className="py-2">
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {BANNERS.map(banner => (
          <TouchableOpacity key={banner.id} className="mr-4" onPress={() => router.push("/restaurant/zomato-clone-biryani")}>
            <View 
              style={{ width: BANNER_WIDTH, height: 160 }} 
              className="rounded-2xl overflow-hidden bg-black"
            >
              <Image 
                source={{ uri: banner.image }} 
                className="w-full h-full opacity-80 absolute"
                contentFit="cover"
              />
              <View className="absolute bottom-0 left-0 p-4 w-full bg-black/40">
                <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>{banner.title}</Text>
                <Text style={{ color: 'white', fontSize: 14 }}>Explore now ➔</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
