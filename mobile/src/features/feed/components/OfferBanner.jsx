import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Tag } from 'lucide-react-native';

export const OfferBanner = () => {
  const { user } = useAuthStore();

  // If user is eligible, show the Welcome banner
  if (user?.isEligibleForNewUserBenefits) {
    return (
      <TouchableOpacity style={styles.container} activeOpacity={0.9}>
        <View style={styles.banner}>
          <View style={styles.iconContainer}>
            <Tag color="#fff" size={28} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome Offer! 🎉</Text>
            <Text style={styles.subtitle}>Use code <Text style={styles.code}>WELCOME50</Text> for 50% OFF</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Otherwise, show standard offers or hide
  return null;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  banner: {
    backgroundColor: '#E23744',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 50,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  code: {
    fontWeight: '900',
    color: '#FFD700',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 4,
  }
});
