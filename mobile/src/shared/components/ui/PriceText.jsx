import React from 'react';
import { Text } from './Text';

export const PriceText = ({ priceInPaise, variant = 'body', className }) => {
  const rupees = priceInPaise / 100;
  return (
    <Text variant={variant} className={className}>
      ₹{rupees}
    </Text>
  );
};
