import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { OtpInput } from '../../src/features/auth/components/OtpInput';
import { useVerifyOtpMutation } from '../../src/features/auth/api/useAuthMutations';
import { useAuthStore } from '../../src/features/auth/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function VerifyOtpScreen() {
  const { phone, name } = useLocalSearchParams();
  const { mutate: verifyOtp } = useVerifyOtpMutation();
  const setAuth = useAuthStore(state => state.setAuth);
  const router = useRouter();

  const handleComplete = (otp) => {
    verifyOtp({ phone, otp, name }, {
      onSuccess: (data) => {
        setAuth(data.user, data.tokens);
        router.replace('/');
      },
      onError: (err) => {
        alert(err.response?.data?.message || 'Invalid OTP');
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
      </View>
      
      <View className="px-6 mt-4">
        <Text variant="h1" className="mb-2">We have sent a verification code to</Text>
        <Text className="text-lg font-medium mb-8">+91 {phone}</Text>
        
        <OtpInput onComplete={handleComplete} />
        
        <Text className="text-center mt-6 text-zomato font-medium">Resend Code</Text>
      </View>
    </SafeAreaView>
  );
}
