import React from 'react';
import { Text as RNText } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const AppText = ({ variant = 'body', className, children, ...props }) => {
  const variants = {
    h1: "text-3xl font-bold text-textPrimary",
    h2: "text-2xl font-bold text-textPrimary",
    h3: "text-xl font-bold text-textPrimary",
    body: "text-base text-textPrimary",
    caption: "text-sm text-textSecondary",
    label: "text-xs font-medium text-textMuted"
  };

  return (
    <RNText className={twMerge(clsx(variants[variant], className))} {...props}>
      {children}
    </RNText>
  );
};

// Keep backward compat alias
export { AppText as Text };
