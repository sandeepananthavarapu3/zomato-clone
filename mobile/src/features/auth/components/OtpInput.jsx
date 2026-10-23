import React, { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';

export const OtpInput = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < length - 1) {
      inputs.current[index + 1].focus();
    }
    
    if (newOtp.every(val => val !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleBackspace = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View className="flex-row justify-between w-full">
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => inputs.current[index] = ref}
          className="w-12 h-12 border border-border rounded-lg text-center text-xl font-bold bg-white text-textPrimary"
          keyboardType="numeric"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleBackspace(e, index)}
        />
      ))}
    </View>
  );
};
