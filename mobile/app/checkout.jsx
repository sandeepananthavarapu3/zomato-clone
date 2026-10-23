import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, TextInput, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../src/shared/components/ui/Text';
import { Button } from '../src/shared/components/ui/Button';
import { useCartStore } from '../src/features/cart/store/useCartStore';
import { CartItemRow } from '../src/features/cart/components/CartItemRow';
import { BillSummary } from '../src/features/cart/components/BillSummary';
import { usePlaceOrderMutation } from '../src/features/checkout/api/useCheckoutMutations';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, MapPin, Tag } from 'lucide-react-native';
import { useAuthStore } from '../src/features/auth/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/shared/services/api';

export default function CheckoutScreen() {
  const { items, restaurantName, restaurantWelcomeOffer, clearCart, restaurantId, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const { user } = useAuthStore();
  
  const { data: userData } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data;
    }
  });
  
  const { mutate: placeOrder, isPending } = usePlaceOrderMutation();
  const router = useRouter();

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [couponAlertMsg, setCouponAlertMsg] = useState(null);
  const [showAllOffers, setShowAllOffers] = useState(false);

  
  const { data: couponsData, refetch } = useQuery({
    queryKey: ['restaurant-coupons', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return { custom: [], isWelcomeEnabled: false };
      const res = await api.get(`/restaurants/${restaurantId}/coupons`);
      return {
        custom: (res.data.data || []).filter(c => c.isActive),
        isWelcomeEnabled: res.data.isWelcomeOfferEnabled
      };
    },
    enabled: !!restaurantId
  });

  const availableCoupons = couponsData?.custom || [];
  const freshWelcomeOfferEnabled = couponsData?.isWelcomeEnabled ?? restaurantWelcomeOffer;
  const isEligible = user?.isEligibleForNewUserBenefits && freshWelcomeOfferEnabled;


  
  
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  React.useEffect(() => {
    // If the backend returns 404 (due to a database wipe), auto-clear the ghost cart
    if (restaurantId) {
      api.get(`/restaurants/${restaurantId}/coupons`).catch(err => {
        if (err.response?.status === 404) {
          setCouponAlertMsg('Database was reset. Clearing old cart items.');
          clearCart();
          router.replace('/');
        }
      });
    }
  }, [restaurantId]);
  
  const allOffers = React.useMemo(() => {
    let offers = [...availableCoupons];
    if (isEligible) {
      offers.push({ code: 'WELCOME50', discountPercentage: 50, maxDiscount: 10000, minOrderValue: 9900 });
    }
    return offers.sort((a, b) => b.discountPercentage - a.discountPercentage);
  }, [availableCoupons, isEligible]);
  
  const handleApplyCoupon = () => {
    if (appliedCoupon === 'WELCOME50') {
      setAppliedCoupon(null); setAppliedCouponData(null);
    } else {
      setAppliedCoupon('WELCOME50'); setAppliedCouponData({ code: 'WELCOME50', discountPercentage: 50, maxDiscount: 10000 });
    }
  };

  
  
  const handleApplyCustom = async () => {
    if (!customInput.trim()) return;
    const code = customInput.trim().toUpperCase();
    
    if (code === 'WELCOME50') {
      if (isEligible) {
        if (subtotal < 9900) {
           setCouponAlertMsg(`Add ₹${((9900 - subtotal) / 100).toFixed(2)} more to use WELCOME50`);
           return;
        }
        setAppliedCoupon(code);
        setAppliedCouponData({ code: 'WELCOME50', discountPercentage: 50, maxDiscount: 10000, minOrderValue: 9900 });
        setCustomInput('');
      } else {
        setCouponAlertMsg('You are not eligible for the WELCOME50 coupon.');
      }
      return;
    }

    try {
      const { restaurantId } = useCartStore.getState();
      const res = await api.get(`/restaurants/${restaurantId}/coupons`);
      const coupons = res.data.data;
      
      const validCoupon = coupons.find(c => c.code === code && c.isActive);
      if (validCoupon) {
        if (validCoupon.minOrderValue && subtotal < validCoupon.minOrderValue) {
           setCouponAlertMsg(`Add ₹${((validCoupon.minOrderValue - subtotal) / 100).toFixed(2)} more to use this coupon`);
           return;
        }
        setAppliedCoupon(code);
        setAppliedCouponData(validCoupon);
        setCustomInput('');
      } else {
        setCouponAlertMsg('Invalid or expired coupon code.');
      }
    } catch (err) {
      setCouponAlertMsg('Error validating coupon.');
    }
  };


  const handlePlaceOrder = () => {
    placeOrder({ items, couponCode: appliedCoupon }, {
      onSuccess: (data) => {
        clearCart();
        router.push(`/tracking/${data._id}`);
      },
      onError: (err) => {
        setCouponAlertMsg(err.response?.data?.message || "Failed to place order.");
        setAppliedCoupon(null); setAppliedCouponData(null); // Reset if backend rejects coupon
      }
    });
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text variant="h2">Cart is empty</Text>
        <Button variant="secondary" className="mt-4" onPress={() => router.push('/')}>Go back</Button>
      
    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="bg-white px-4 py-4 flex-row items-center border-b border-surface">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/')} className="mr-4">
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
        <View>
          <Text variant="h2">{restaurantName}</Text>
        </View>
      </View>
      
      <ScrollView className="flex-1">
        <View className="bg-white p-4 mb-2 flex-row items-start">
          <MapPin color="#E23744" size={24} className="mr-3" />
          <View className="flex-1">
            <Text className="font-bold text-base">Delivery at Home</Text>
            <Text className="text-textSecondary text-sm mt-1">123, Block A, Connaught Place, New Delhi</Text>
          </View>
        </View>

        <View className="bg-white px-4 pt-4 pb-2 mb-2">
          <View className="flex-row items-center mb-4 pb-3 border-b border-gray-100">
            <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
              <Text className="text-xl">🏪</Text>
            </View>
            <View>
              <Text className="font-bold text-lg text-gray-800">{restaurantName}</Text>
              <Text className="text-gray-500 text-xs">Delivery in 30-35 mins</Text>
            </View>
          </View>
          {items.map(item => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </View>

        
        <View style={styles.customCouponContainer}>
          <TextInput 
            placeholder="Enter Coupon Code"
            value={customInput}
            onChangeText={setCustomInput}
            style={styles.customInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity onPress={handleApplyCustom} style={styles.customApplyBtn}>
            <Text style={styles.customApplyText}>APPLY</Text>
          </TouchableOpacity>
        </View>

        
        
        {allOffers.length > 0 && (<>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>Available Offers</Text>
          {allOffers.length > 1 && (
            <TouchableOpacity onPress={() => setShowAllOffers(!showAllOffers)}>
              <Text style={{ color: '#E23744', fontWeight: 'bold', fontSize: 14 }}>
                {showAllOffers ? 'Hide Offers' : `View all ${allOffers.length} coupons`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {(() => {
          let topCoupon = allOffers.find(c => !c.minOrderValue || subtotal >= c.minOrderValue);
          if (!topCoupon && allOffers.length > 0) topCoupon = allOffers[0];
          const displayOffers = showAllOffers ? allOffers : (topCoupon ? [topCoupon] : []);
          
          return displayOffers.map(coupon => {
            const isEligibleCoupon = !coupon.minOrderValue || subtotal >= coupon.minOrderValue;
            return (
          <View key={coupon.code} style={[styles.couponContainer, appliedCoupon === coupon.code && { borderColor: '#28A745' }, !isEligibleCoupon && { opacity: 0.6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Tag color={appliedCoupon === coupon.code ? "#28A745" : (isEligibleCoupon ? "#E23744" : "#999")} size={20} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.couponTitle, appliedCoupon === coupon.code && { color: '#28A745' }, !isEligibleCoupon && { color: '#999' }]}>{coupon.code}</Text>
                <Text style={[styles.couponSub, !isEligibleCoupon && { color: '#999' }]}>
                  {coupon.code === 'WELCOME50' ? 'Save 50% on this order!' : `Save ${coupon.discountPercentage}%${coupon.maxDiscount ? ` up to ₹${(coupon.maxDiscount/100).toFixed(0)}` : ''}!`}
                  {coupon.minOrderValue > 0 ? ` • Min Order ₹${coupon.minOrderValue / 100}` : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => {
                if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
                  setCouponAlertMsg(`Add ₹${((coupon.minOrderValue - subtotal) / 100).toFixed(2)} more to use this coupon`);
                  return;
                }
                if (appliedCoupon === coupon.code) {
                  setAppliedCoupon(null);
                  setAppliedCouponData(null);
                } else {
                  setAppliedCoupon(coupon.code);
                  setAppliedCouponData(coupon);
                }
              }} 
              style={[styles.applyBtn, appliedCoupon === coupon.code && { borderColor: '#28A745' }, !isEligibleCoupon && { borderColor: '#ccc' }]}
            >
              <Text style={[styles.applyBtnText, appliedCoupon === coupon.code && { color: '#28A745' }, !isEligibleCoupon && { color: '#ccc' }]}>{appliedCoupon === coupon.code ? 'REMOVE' : 'APPLY'}</Text>
            </TouchableOpacity>
          </View>
            );
          });
        })()}
        </>)}

        {appliedCoupon && !allOffers.find(c => c.code === appliedCoupon) && (
          <View style={[styles.couponContainer, { borderColor: '#28A745' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Tag color="#28A745" size={20} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.couponTitle, { color: '#28A745' }]}>{appliedCoupon}</Text>
                <Text style={styles.couponSub}>Coupon Applied</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setAppliedCoupon(null); setAppliedCouponData(null); }} style={[styles.applyBtn, { borderColor: '#28A745' }]}>
              <Text style={[styles.applyBtnText, { color: '#28A745' }]}>REMOVE</Text>
            </TouchableOpacity>
          </View>
        )}

        <BillSummary appliedCoupon={appliedCoupon} appliedCouponData={appliedCouponData} outstandingPenalty={userData?.outstandingPenalty || 0} />
      </ScrollView>

      <View className="bg-white p-4 border-t border-surface">
        <Button onPress={handlePlaceOrder} isLoading={isPending} className="w-full">
          Place Order
        </Button>
      </View>

      <Modal transparent visible={!!couponAlertMsg} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <Tag color="#E23744" size={24} />
            </View>
            <Text style={styles.modalText}>{couponAlertMsg}</Text>
            <TouchableOpacity onPress={() => setCouponAlertMsg(null)} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8
  },
  modalIconBg: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 22
  },
  modalBtn: {
    backgroundColor: '#E23744',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%'
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16
  },


  customCouponContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  customApplyBtn: {
    backgroundColor: '#E23744',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6
  },
  customApplyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },

  couponContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed'
  },
  couponTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  couponSub: {
    fontSize: 12,
    color: '#28A745',
    marginTop: 2
  },
  applyBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E23744',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  applyBtnText: {
    color: '#E23744',
    fontWeight: 'bold',
    fontSize: 12
  }
});
