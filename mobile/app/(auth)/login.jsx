import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { Input } from '../../src/shared/components/ui/Input';
import { Button } from '../../src/shared/components/ui/Button';
import { useSendOtpMutation } from '../../src/features/auth/api/useAuthMutations';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const { mutate: sendOtp, isPending } = useSendOtpMutation();
  const router = useRouter();

  const handleContinue = () => {
    if (phone.length === 10) {
      sendOtp(phone, {
        onSuccess: (data) => {
          if (data.otp) {
            alert(`[TESTING MODE]\nYour OTP is: ${data.otp}\n\n(Twilio will only send real SMS if you upgrade your Twilio account to a paid tier)`);
          } else if (data.warning) {
            alert(data.warning);
          }
          router.push({ pathname: '/verify-otp', params: { phone, name } });
        },
        onError: (err) => {
          alert(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        }
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-10">
            <Text variant="h1" className="text-zomato mb-2 tracking-widest text-4xl italic font-extrabold">zomato</Text>
            <Text className="text-textSecondary text-center font-medium">India's #1 Food Delivery and Dining App</Text>
          </View>
          
          <View className="mb-6">
            <Text className="text-center font-semibold mb-4 text-lg">Log in or sign up</Text>
            
            <View className="border border-border rounded-lg bg-white overflow-hidden mb-4">
              <Input
                placeholder="Enter your name (optional for login)"
                value={name}
                onChangeText={setName}
                className="border-0 bg-transparent"
              />
            </View>

            <View className="flex-row items-center border border-border rounded-lg bg-white overflow-hidden mb-4">
              <View className="px-4 border-r border-border py-3">
                <Text>+91</Text>
              </View>
              <Input
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                className="flex-1 border-0 bg-transparent"
              />
            </View>
          </View>
          
          <Button 
            onPress={handleContinue} 
            isLoading={isPending}
            disabled={phone.length !== 10}
            className="w-full"
          >
            Continue
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
