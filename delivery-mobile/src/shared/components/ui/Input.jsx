import React from 'react';
import { View, TextInput, Text } from 'react-native';

export const Input = ({ label, error, leftIcon, rightIcon, className, ...props }) => {
  return (
    <View className={`w-full ${className || ''}`}>
      {label && <Text className="text-sm font-medium text-textSecondary mb-1">{label}</Text>}
      <View className={`flex-row items-center border rounded-lg px-3 py-2 ${error ? 'border-red-500' : 'border-border'} bg-white`}>
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput 
          className="flex-1 text-base text-textPrimary"
          placeholderTextColor="#9C9C9C"
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
};
