import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../src/shared/services/api';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { partner, logout, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(partner?.isOnline || false);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'AVAILABLE', 'HISTORY'

  React.useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const toggleStatus = useMutation({
    mutationFn: async (onlineStatus) => {
      const res = await api.patch('/delivery/status', { isOnline: onlineStatus });
      return res.data.data;
    },
    onSuccess: (updatedPartner) => {
      setIsOnline(updatedPartner.isOnline);
      useAuthStore.setState({ partner: updatedPartner });
    }
  });

  // Queries
  const { data: availableOrders = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['delivery-orders-available'],
    queryFn: async () => {
      const res = await api.get('/delivery/orders/available');
      return res.data.data;
    },
    refetchInterval: 3000,
    enabled: isOnline && activeTab === 'AVAILABLE'
  });

  const { data: activeOrders = [], isLoading: loadingActive } = useQuery({
    queryKey: ['delivery-orders-active'],
    queryFn: async () => {
      const res = await api.get('/delivery/orders/active');
      return res.data.data;
    },
    refetchInterval: 3000,
    enabled: isOnline && activeTab === 'ACTIVE'
  });

  const { data: historyOrders = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['delivery-orders-history'],
    queryFn: async () => {
      const res = await api.get('/delivery/orders/history');
      return res.data.data;
    },
    enabled: activeTab === 'HISTORY'
  });

  const { data: revenueData } = useQuery({
    queryKey: ['delivery-revenue'],
    queryFn: async () => {
      const res = await api.get('/delivery/revenue');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  // Mutations
  const acceptOrder = useMutation({
    mutationFn: async (orderId) => {
      await api.patch(`/delivery/orders/${orderId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-orders-available']);
      queryClient.invalidateQueries(['delivery-orders-active']);
      setActiveTab('ACTIVE');
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await api.patch(`/delivery/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-orders-active']);
      queryClient.invalidateQueries(['delivery-orders-history']);
    }
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined' && partner) {
      if (activeOrders.length > 0) {
        document.title = `(${activeOrders.length}) Active - ${partner.name}`;
      } else if (availableOrders.length > 0) {
        document.title = `(${availableOrders.length}) Available - ${partner.name}`;
      } else {
        document.title = `${partner.name} - Dashboard`;
      }
    }
  }, [activeOrders, availableOrders, partner]);

  if (!partner) return null;

  const renderOrder = ({ item }, type) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.price}>₹{item.pricing.total / 100}</Text>
      </View>
      <Text style={styles.restaurantName}>{item.restaurantId.name}</Text>
      <Text style={styles.address}>{item.restaurantId.address.street}, {item.restaurantId.address.city}</Text>
      <Text style={styles.address}>To: {item.deliveryAddress.formattedAddress}</Text>

      <View style={{ marginTop: 12, marginBottom: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 13, color: '#1C1C1C' }}>Delivery Earnings Receipt</Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>Base Pay</Text>
          <Text style={{ fontSize: 13, color: '#666' }}>₹20.00</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>Distance Pay</Text>
          <Text style={{ fontSize: 13, color: '#666' }}>₹{Math.max(0, Math.round((((item.pricing?.deliveryPayout || 0) / 100) - 20) * 0.6)).toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>Surge / Demand Bonus</Text>
          <Text style={{ fontSize: 13, color: '#666' }}>₹{Math.max(0, (((item.pricing?.deliveryPayout || 0) / 100) - 20) - Math.round((((item.pricing?.deliveryPayout || 0) / 100) - 20) * 0.6)).toFixed(2)}</Text>
        </View>
        
        <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 6 }} />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#166534' }}>Total Payout</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#16a34a' }}>₹{((item.pricing?.deliveryPayout || 0) / 100).toFixed(2)}</Text>
        </View>
      </View>

      {type === 'AVAILABLE' && (
        <TouchableOpacity style={styles.btnPrimary} onPress={() => acceptOrder.mutate(item._id)}>
          <Text style={styles.btnTextPrimary}>Accept Order</Text>
        </TouchableOpacity>
      )}

      {type === 'ACTIVE' && item.status === 'READY_FOR_PICKUP' && (
        <TouchableOpacity style={styles.btnWarning} onPress={() => updateOrderStatus.mutate({ orderId: item._id, status: 'OUT_FOR_DELIVERY' })}>
          <Text style={styles.btnTextPrimary}>Mark as Picked Up</Text>
        </TouchableOpacity>
      )}

      {type === 'ACTIVE' && item.status === 'OUT_FOR_DELIVERY' && (
        <TouchableOpacity style={styles.btnSuccess} onPress={() => updateOrderStatus.mutate({ orderId: item._id, status: 'DELIVERED' })}>
          <Text style={styles.btnTextPrimary}>Mark as Delivered</Text>
        </TouchableOpacity>
      )}

      {type === 'HISTORY' && (
        <View style={styles.btnDisabled}>
          <Text style={styles.btnTextPrimary}>Delivered Successfully</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{partner.name}</Text>
          <Text style={styles.subtitle}>Vehicle: {partner.vehicle.registrationNumber || partner.vehicle.type}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{isOnline ? 'You are ONLINE' : 'You are OFFLINE'}</Text>
        <Switch 
          value={isOnline} 
          onValueChange={(val) => toggleStatus.mutate(val)} 
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isOnline ? '#E23744' : '#f4f3f4'}
        />
      </View>

      <View style={styles.revenueContainer}>
        <View>
          <Text style={styles.revenueTitle}>Total Earnings</Text>
          <Text style={styles.revenueAmount}>
            ₹{revenueData ? (revenueData.totalRevenue / 100).toFixed(2) : '0.00'}
          </Text>
        </View>
        <View style={styles.revenueStats}>
          <Text style={styles.revenueStatsText}>{revenueData?.orderCount || 0} Orders Delivered</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ACTIVE' && styles.activeTab]} onPress={() => setActiveTab('ACTIVE')}>
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'AVAILABLE' && styles.activeTab]} onPress={() => setActiveTab('AVAILABLE')}>
          <Text style={[styles.tabText, activeTab === 'AVAILABLE' && styles.activeTabText]}>Available</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'HISTORY' && styles.activeTab]} onPress={() => setActiveTab('HISTORY')}>
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!isOnline && activeTab !== 'HISTORY' ? (
          <Text style={styles.empty}>Go online to see orders.</Text>
        ) : (
          <>
            {activeTab === 'ACTIVE' && (
              loadingActive ? <ActivityIndicator size="large" color="#E23744" style={{ marginTop: 50 }} /> :
              activeOrders.length === 0 ? <Text style={styles.empty}>No active deliveries.</Text> :
              <FlatList 
                data={activeOrders} keyExtractor={(item) => item._id}
                renderItem={(props) => renderOrder(props, 'ACTIVE')}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
            
            {activeTab === 'AVAILABLE' && (
              loadingAvailable ? <ActivityIndicator size="large" color="#E23744" style={{ marginTop: 50 }} /> :
              availableOrders.length === 0 ? <Text style={styles.empty}>No available orders right now.</Text> :
              <FlatList 
                data={availableOrders} keyExtractor={(item) => item._id}
                renderItem={(props) => renderOrder(props, 'AVAILABLE')}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}

            {activeTab === 'HISTORY' && (
              loadingHistory ? <ActivityIndicator size="large" color="#E23744" style={{ marginTop: 50 }} /> :
              historyOrders.length === 0 ? <Text style={styles.empty}>You have no delivery history.</Text> :
              <FlatList 
                data={historyOrders} keyExtractor={(item) => item._id}
                renderItem={(props) => renderOrder(props, 'HISTORY')}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </>
        )}
      </View>
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
  statusContainer: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  revenueContainer: { backgroundColor: '#fff', margin: 20, marginBottom: 15, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueTitle: { color: '#666', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  revenueAmount: { color: '#28A745', fontSize: 24, fontWeight: 'bold' },
  revenueStats: { backgroundColor: '#F0F9F4', padding: 8, borderRadius: 8 },
  revenueStatsText: { color: '#28A745', fontWeight: 'bold', fontSize: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#E23744' },
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#666' },
  activeTabText: { color: '#E23744' },
  content: { flex: 1, paddingTop: 15 },
  empty: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#28A745' },
  restaurantName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  address: { color: '#666', marginBottom: 15, lineHeight: 20 },
  btnPrimary: { backgroundColor: '#E23744', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnWarning: { backgroundColor: '#F59E0B', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#10B981', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#D1D5DB', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
