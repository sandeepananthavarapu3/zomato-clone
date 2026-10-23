import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, TextInput, Platform, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../src/shared/services/api';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { restaurant, logout, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  
  const [welcomeOffer, setWelcomeOffer] = React.useState(restaurant?.isWelcomeOfferEnabled ?? true);
  const [customCoupons, setCustomCoupons] = React.useState(restaurant?.customCoupons || []);
  const [newCouponCode, setNewCouponCode] = React.useState('');
  const [newCouponPercent, setNewCouponPercent] = React.useState('');
  const [newCouponMax, setNewCouponMax] = React.useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = React.useState('');
  const [rejectOrderId, setRejectOrderId] = React.useState(null);


  React.useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const toggleOfferMutation = useMutation({
    mutationFn: async (val) => {
      const res = await api.patch('/partner/welcome-offer', { isWelcomeOfferEnabled: val });
      return res.data.data;
    },
    onSuccess: (data) => {
      setWelcomeOffer(data.isWelcomeOfferEnabled);
      useAuthStore.setState({ restaurant: data });
    }
  });

  
  const updateCouponsMutation = useMutation({
    mutationFn: async (coupons) => {
      const res = await api.patch('/partner/coupons', { customCoupons: coupons });
      return res.data.data;
    },
    onSuccess: (data) => {
      setCustomCoupons(data);
      useAuthStore.setState({ restaurant: { ...restaurant, customCoupons: data } });
      setNewCouponCode('');
      setNewCouponPercent('');
      setNewCouponMax('');
      setNewCouponMinOrder('');
    }
  });

  const handleAddCoupon = () => {
    if (!newCouponCode || !newCouponPercent) return;
    const newCoupon = {
      code: newCouponCode.toUpperCase(),
      discountPercentage: parseInt(newCouponPercent),
      maxDiscount: newCouponMax ? parseInt(newCouponMax) * 100 : null,
      minOrderValue: newCouponMinOrder ? parseInt(newCouponMinOrder) * 100 : 0,
      isActive: true
    };
    updateCouponsMutation.mutate([...customCoupons, newCoupon]);
  };
  
  const handleToggleCustomCoupon = (index) => {
    const updated = [...customCoupons];
    updated[index].isActive = !updated[index].isActive;
    updateCouponsMutation.mutate(updated);
  };

  const handleDeleteCustomCoupon = (index) => {
    
    const performDelete = () => {
      const updated = [...customCoupons];
      updated.splice(index, 1);
      updateCouponsMutation.mutate(updated);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this coupon?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Coupon",
        "Are you sure you want to delete this coupon?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", onPress: performDelete, style: 'destructive' }
        ]
      );
    }
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['partner-orders'],
    queryFn: async () => {
      const res = await api.get('/partner/orders');
      return res.data.data;
    },
    refetchInterval: 3000
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && restaurant) {
      if (orders.length > 0) {
        document.title = `(${orders.length}) ${restaurant.name} - Orders`;
      } else {
        document.title = `${restaurant.name} - Dashboard`;
      }
    }
  }, [orders, restaurant]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await api.patch(`/partner/orders/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries(['partner-orders'])
  });

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
        <Text style={[styles.statusBadge, item.status === 'PLACED' ? styles.newBadge : styles.activeBadge]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.items}>{item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</Text>
      
      <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 13, color: '#1C1C1C' }}>Earnings Receipt</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>Subtotal</Text>
          <Text style={{ fontSize: 13, color: '#666' }}>₹{(item.pricing.subtotal / 100).toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#E23744' }}>Coupon Absorbed</Text>
          <Text style={{ fontSize: 13, color: '#E23744' }}>-₹{((item.pricing.restaurantAbsorbedDiscount || 0) / 100).toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#E23744' }}>Zomato Commission (10%)</Text>
          <Text style={{ fontSize: 13, color: '#E23744' }}>-₹{((item.pricing.zomatoCommission || 0) / 100).toFixed(2)}</Text>
        </View>

        <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 6 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1C1C1C' }}>Net Payout</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: item.status === 'CANCELLED' ? '#E23744' : '#10B981' }}>
            {item.status === 'CANCELLED' ? '-₹20.00' : `₹${(item.pricing.restaurantPayout / 100).toFixed(2)}`}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { marginTop: 16 }]}>
        <Text style={styles.price}>Total Bill: ₹{item.pricing.total / 100}</Text>
        <View style={styles.actions}>
          {item.status === 'PLACED' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => updateStatus.mutate({ id: item._id, status: 'PREPARING' })}>
                <Text style={styles.btnTextPrimary}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#FF3B30' }]} onPress={() => setRejectOrderId(item._id)}>
                <Text style={styles.btnTextPrimary}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.status === 'PREPARING' && (
            <TouchableOpacity style={styles.btnSuccess} onPress={() => updateStatus.mutate({ id: item._id, status: 'READY_FOR_PICKUP' })}>
              <Text style={styles.btnTextPrimary}>Mark Ready</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const { data: revenueData } = useQuery({
    queryKey: ['partner-revenue'],
    queryFn: async () => {
      const res = await api.get('/partner/revenue');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  if (!restaurant) return null;

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{restaurant.name}</Text>
          <Text style={styles.subtitle}>Partner Dashboard</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => router.push('/menu')} style={[styles.logoutBtn, { backgroundColor: '#E23744' }]}>
            <Text style={styles.logoutText}>Manage Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.revenueContainer}>
        <View>
          <Text style={styles.revenueTitle}>Total Earnings (After Zomato Tax)</Text>
          <Text style={styles.revenueAmount}>
            ₹{revenueData ? (revenueData.totalRevenue / 100).toFixed(2) : '0.00'}
          </Text>
        </View>
        <View style={styles.revenueStats}>
          <Text style={styles.revenueStatsText}>{revenueData?.orderCount || 0} Orders Delivered</Text>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>WELCOME50 Promo</Text>
            <Text style={styles.toggleSub}>Allow new users to apply 50% off coupon.</Text>
          </View>
          <Switch 
            value={welcomeOffer}
            onValueChange={(val) => toggleOfferMutation.mutate(val)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={welcomeOffer ? '#E23744' : '#f4f3f4'}
          />
        </View>
      </View>

      
      <View style={styles.toggleContainer}>
        <Text style={styles.sectionTitle}>Custom Coupons</Text>
        {customCoupons.map((c, idx) => (
          <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{c.code} <Text style={{ color: '#28A745' }}>({c.discountPercentage}% OFF)</Text></Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Max ₹{c.maxDiscount ? c.maxDiscount / 100 : 'Unlimited'} 
                {c.minOrderValue > 0 ? ` • Min Order ₹${c.minOrderValue / 100}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Switch 
                value={c.isActive}
                onValueChange={() => handleToggleCustomCoupon(idx)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={c.isActive ? '#E23744' : '#f4f3f4'}
              />
              <TouchableOpacity onPress={() => handleDeleteCustomCoupon(idx)} style={{ padding: 4 }}>
                <Text style={{ color: '#E23744', fontSize: 16, fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TextInput placeholder="Code (e.g. SAVE20)" value={newCouponCode} onChangeText={setNewCouponCode} style={styles.input} />
          <TextInput placeholder="%" value={newCouponPercent} onChangeText={setNewCouponPercent} keyboardType="numeric" style={[styles.input, { width: 60 }]} />
          <TextInput placeholder="Max ₹" value={newCouponMax} onChangeText={setNewCouponMax} keyboardType="numeric" style={[styles.input, { width: 65 }]} />
          <TextInput placeholder="Min ₹" value={newCouponMinOrder} onChangeText={setNewCouponMinOrder} keyboardType="numeric" style={[styles.input, { width: 65 }]} />
        </View>
        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 10, alignItems: 'center' }]} onPress={handleAddCoupon} disabled={updateCouponsMutation.isPending}>
          <Text style={styles.btnTextPrimary}>Add Coupon</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Live Orders</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#E23744" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>No active orders.</Text>
      ) : (
        <FlatList 
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <Modal visible={!!rejectOrderId} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#E23744' }}>Reject Order?</Text>
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 20, lineHeight: 22 }}>
              Are you sure you want to reject this order? A cancellation penalty of <Text style={{ fontWeight: 'bold', color: '#000' }}>₹20.00</Text> will be deducted from your total earnings.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setRejectOrderId(null)} style={{ padding: 12, borderRadius: 8, backgroundColor: '#eee', flex: 1, alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#444' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  updateStatus.mutate({ id: rejectOrderId, status: 'CANCELLED' });
                  setRejectOrderId(null);
                }} 
                style={{ padding: 12, borderRadius: 8, backgroundColor: '#E23744', flex: 1, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: 'bold', color: '#fff' }}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { backgroundColor: '#1C1C1C', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#ccc', marginTop: 4 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  revenueContainer: { backgroundColor: '#fff', margin: 20, marginBottom: 0, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueTitle: { color: '#666', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  revenueAmount: { color: '#28A745', fontSize: 24, fontWeight: 'bold' },
  revenueStats: { backgroundColor: '#F0F9F4', padding: 8, borderRadius: 8 },
  revenueStatsText: { color: '#28A745', fontWeight: 'bold', fontSize: 12 },
  toggleContainer: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  toggleTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  toggleSub: { fontSize: 12, color: '#666', marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 10 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  statusBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  newBadge: { backgroundColor: '#E23744', color: '#fff' },
  activeBadge: { backgroundColor: '#FFF3CD', color: '#856404' },
  items: { color: '#666', marginBottom: 15, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', paddingTop: 15 },
  price: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 10 },
  btnPrimary: { backgroundColor: '#E23744', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  btnSuccess: { backgroundColor: '#28A745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold' }
});
