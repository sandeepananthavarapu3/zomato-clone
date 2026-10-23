import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../src/shared/components/ui/Text';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, MapPin, Bell, Globe, Shield, FileText, Trash2, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../src/features/auth/store/useAuthStore';
import { useDeleteAccountMutation } from '../src/features/auth/api/useAuthMutations';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation();

  const handleDeleteAccount = () => {
    const message = "Are you sure you want to delete your account? You will lose all your data, but your phone number hash will be permanently retained to prevent promo abuse.";
    
    // React Native Web fallback for confirm
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        executeDeletion();
      }
    } else {
      Alert.alert(
        "Delete Account",
        message,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDeletion }
        ]
      );
    }
  };

  const executeDeletion = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        alert("Account successfully deleted. Your phone hash has been securely retained in our ledger.");
        logout();
        router.replace('/login');
      },
      onError: (err) => {
        alert("Failed to delete account. Please try again.");
      }
    });
  };

  const renderSectionHeader = (title) => (
    <Text className="text-textSecondary font-bold text-sm uppercase px-4 py-3 bg-surface mt-2">
      {title}
    </Text>
  );

  const renderSettingItem = (icon, title, isDestructive = false, onPress = null) => (
    <TouchableOpacity 
      className="flex-row items-center px-4 py-4 bg-white border-b border-surface"
      onPress={onPress || (() => alert(`${title} is not implemented yet`))}
      disabled={isPending && isDestructive}
    >
      <View className="w-8">
        {icon}
      </View>
      <Text className={`flex-1 font-medium text-base ${isDestructive ? 'text-zomato' : 'text-textPrimary'}`}>
        {isPending && isDestructive ? "Deleting..." : title}
      </Text>
      {!isDestructive && <ChevronRight color="#999" size={20} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="bg-white px-4 py-4 flex-row items-center shadow-sm z-10 border-b border-surface">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} className="mr-4">
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
        <Text variant="h2">Settings</Text>
      </View>

      <ScrollView className="flex-1 bg-white">
        {renderSectionHeader('My Account')}
        {renderSettingItem(<User color="#1C1C1C" size={20} />, 'Edit Profile')}
        {renderSettingItem(<MapPin color="#1C1C1C" size={20} />, 'Saved Addresses')}
        {renderSettingItem(<Trash2 color="#E23744" size={20} />, 'Delete Account', true, handleDeleteAccount)}

        {renderSectionHeader('App Preferences')}
        {renderSettingItem(<Bell color="#1C1C1C" size={20} />, 'Notifications')}
        {renderSettingItem(<Globe color="#1C1C1C" size={20} />, 'Language')}

        {renderSectionHeader('About')}
        {renderSettingItem(<Shield color="#1C1C1C" size={20} />, 'Privacy Policy')}
        {renderSettingItem(<FileText color="#1C1C1C" size={20} />, 'Terms of Service')}
        
        <View className="py-8 items-center bg-surface">
          <Text className="text-textSecondary text-xs">Zomato Clone v1.0.0</Text>
          <Text className="text-textSecondary text-xs mt-1">Made with ♥️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

