import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className,
  textClassName,
  ...props 
}) => {
  const baseClasses = "rounded-lg items-center justify-center flex-row";
  
  const variants = {
    primary: "bg-zomato",
    secondary: "bg-transparent border border-zomato",
    ghost: "bg-transparent"
  };
  
  const sizes = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8"
  };

  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-zomato font-semibold",
    ghost: "text-textPrimary font-semibold"
  };

  return (
    <TouchableOpacity 
      className={twMerge(clsx(baseClasses, variants[variant], sizes[size], className))}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#E23744'} />
      ) : (
        <Text className={twMerge(clsx(textVariants[variant], textClassName))}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
