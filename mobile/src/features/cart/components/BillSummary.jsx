import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { PriceText } from '../../../shared/components/ui/PriceText';
import { useCartStore } from '../store/useCartStore';


export const BillSummary = ({ appliedCoupon, appliedCouponData, outstandingPenalty = 0 }) => {
  const { getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const deliveryFee = 4000;
  const tax = Math.round(subtotal * 0.05);
  
  let discount = 0;
  if (appliedCouponData) {
    discount = Math.round(subtotal * (appliedCouponData.discountPercentage / 100));
    if (appliedCouponData.maxDiscount && discount > appliedCouponData.maxDiscount) {
      discount = appliedCouponData.maxDiscount;
    }
  }

  const total = subtotal + deliveryFee + tax - discount + outstandingPenalty;


  return (
    <View className="bg-white p-4 mt-2 mb-4">
      <Text variant="h3" className="mb-4">Bill Summary</Text>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-textSecondary">Item Total</Text>
        <PriceText priceInPaise={subtotal} />
      </View>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-textSecondary">Delivery Fee</Text>
        <PriceText priceInPaise={deliveryFee} />
      </View>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-textSecondary">Taxes</Text>
        <PriceText priceInPaise={tax} />
      </View>

      {discount > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text style={{ color: '#28A745', fontWeight: 'bold' }}>Coupon Discount</Text>
          <Text style={{ color: '#28A745', fontWeight: 'bold' }}>- <PriceText priceInPaise={discount} style={{ color: '#28A745' }} /></Text>
        </View>
      )}
      
      {outstandingPenalty > 0 && (
        <View className="flex-row justify-between mb-2">
          <View>
            <Text style={{ color: '#E23744', fontWeight: 'bold' }}>Previous Cancellation Fee</Text>
            <Text style={{ color: '#999', fontSize: 11, maxWidth: 200 }}>Unpaid penalty from a previously cancelled order.</Text>
          </View>
          <Text style={{ color: '#E23744', fontWeight: 'bold' }}>+ <PriceText priceInPaise={outstandingPenalty} style={{ color: '#E23744' }} /></Text>
        </View>
      )}

      <View className="flex-row justify-between mt-2 border-t border-surface pt-4">
        <Text className="font-bold text-lg">Grand Total</Text>
        <PriceText priceInPaise={total} className="font-bold text-lg" />
      </View>
    </View>
  );
};
