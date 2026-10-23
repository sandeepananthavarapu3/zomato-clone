import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../src/shared/services/api';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { admin, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const [activeTab, setActiveTab] = useState('REVENUE');
  
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const res = await api.get('/admin/revenue');
      return res.data.data;
    },
    refetchInterval: 5000
  });

  if (!admin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Zomato Admin HQ</Text>
          <Text style={styles.subtitle}>Global Platform Revenue</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#E23744" style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Revenue (Platform Fee + Commission)</Text>
            <Text style={styles.heroAmount}>
              ₹{revenueData ? (revenueData.totalPlatformRevenue / 100).toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.heroSub}>{revenueData?.totalOrders || 0} Total Completed Orders</Text>
          </View>

          <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 15 }}>
            <TouchableOpacity onPress={() => setActiveTab('REVENUE')} style={{ flex: 1, padding: 10, borderBottomWidth: 3, borderBottomColor: activeTab === 'REVENUE' ? '#E23744' : '#ddd' }}>
              <Text style={{ color: activeTab === 'REVENUE' ? '#E23744' : '#666', textAlign: 'center', fontWeight: 'bold' }}>Revenue Breakdown</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('ORDERS')} style={{ flex: 1, padding: 10, borderBottomWidth: 3, borderBottomColor: activeTab === 'ORDERS' ? '#E23744' : '#ddd' }}>
              <Text style={{ color: activeTab === 'ORDERS' ? '#E23744' : '#666', textAlign: 'center', fontWeight: 'bold' }}>Detailed Receipts</Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'REVENUE' ? (
            <FlatList 
              data={revenueData?.breakdown || []}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.listCard}>
                  <View>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listSub}>{item.orderCount} Orders</Text>
                  </View>
                  <Text style={styles.listAmount}>₹{(item.revenue / 100).toFixed(2)}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No completed orders yet.</Text>}
            />
          ) : (
            <FlatList 
              data={revenueData?.orders || []}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={[styles.listCard, { flexDirection: 'column', alignItems: 'stretch', padding: 0, overflow: 'hidden' }]}>
                  <View style={{ backgroundColor: '#1C1C1C', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{item.restaurantId?.name || 'Restaurant'}</Text>
                      <Text style={{ color: '#aaa', fontSize: 12 }}>Order #{item.orderNumber?.split('-')[1] || item._id.slice(-6)}</Text>
                    </View>
                    <Text style={{ color: item.status === 'CANCELLED' ? '#FF3B30' : '#28A745', fontWeight: 'bold' }}>{item.status}</Text>
                  </View>
                  
                  <View style={{ padding: 15, backgroundColor: '#fff' }}>
                    <Text style={{ color: '#333', fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>Platform Receipt</Text>
                    
                    {item.status === 'CANCELLED' ? (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Order Total Refunded</Text>
                          <Text style={{ color: '#E23744', fontSize: 13, fontWeight: '500' }}>-₹{((item.pricing?.total || 0)/100).toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Rider Payout Cancelled</Text>
                          <Text style={{ color: '#999', fontSize: 13, fontWeight: '500' }}>₹0.00</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Commission Reversed</Text>
                          <Text style={{ color: '#999', fontSize: 13, fontWeight: '500' }}>₹0.00</Text>
                        </View>
                        
                        {(item.pricing?.zomatoRevenue || 0) > 0 && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#666', fontSize: 13 }}>Restaurant Cancellation Penalty</Text>
                            <Text style={{ color: '#333', fontSize: 13, fontWeight: '500' }}>+₹{((item.pricing?.zomatoRevenue || 0)/100).toFixed(2)}</Text>
                          </View>
                        )}

                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#1C1C1C', fontSize: 15, fontWeight: 'bold' }}>Net Zomato Revenue</Text>
                          <Text style={{ color: (item.pricing?.zomatoRevenue || 0) > 0 ? '#28A745' : '#999', fontSize: 15, fontWeight: 'bold' }}>
                            ₹{((item.pricing?.zomatoRevenue || 0)/100).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Commission (10%)</Text>
                          <Text style={{ color: '#333', fontSize: 13, fontWeight: '500' }}>+₹{((item.pricing?.zomatoCommission || 0)/100).toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Platform Fee</Text>
                          <Text style={{ color: '#333', fontSize: 13, fontWeight: '500' }}>+₹{((item.pricing?.platformFee || 0)/100).toFixed(2)}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>Delivery Fee Collected</Text>
                          <Text style={{ color: '#333', fontSize: 13, fontWeight: '500' }}>+₹{((item.pricing?.deliveryFee || 0)/100).toFixed(2)}</Text>
                        </View>
                        {(item.pricing?.previousCancellationPenalty || 0) > 0 && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#666', fontSize: 13 }}>Prior Cancel Penalty Collected</Text>
                            <Text style={{ color: '#333', fontSize: 13, fontWeight: '500' }}>+₹{((item.pricing?.previousCancellationPenalty || 0)/100).toFixed(2)}</Text>
                          </View>
                        )}
                        
                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ color: '#E23744', fontSize: 13 }}>Delivery Payout to Rider</Text>
                          <Text style={{ color: '#E23744', fontSize: 13 }}>-₹{((item.pricing?.deliveryPayout || 0)/100).toFixed(2)}</Text>
                        </View>
                        {(item.pricing?.zomatoAbsorbedDiscount || 0) > 0 && (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#E23744', fontSize: 13 }}>WELCOME Promo Subsidy</Text>
                            <Text style={{ color: '#E23744', fontSize: 13 }}>-₹{((item.pricing?.zomatoAbsorbedDiscount || 0)/100).toFixed(2)}</Text>
                          </View>
                        )}
                        
                        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#1C1C1C', fontSize: 15, fontWeight: 'bold' }}>Net Zomato Revenue</Text>
                          <Text style={{ color: (item.pricing?.zomatoRevenue || 0) >= 0 ? '#28A745' : '#E23744', fontSize: 15, fontWeight: 'bold' }}>
                            ₹{((item.pricing?.zomatoRevenue || 0)/100).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { backgroundColor: '#1C1C1C', padding: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#E23744', marginTop: 4, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  heroCard: { backgroundColor: '#E23744', margin: 20, padding: 30, borderRadius: 16, alignItems: 'center', shadowColor: '#E23744', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  heroAmount: { color: '#fff', fontSize: 48, fontWeight: '900', marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15, color: '#333' },
  listCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
  listName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  listSub: { fontSize: 13, color: '#666' },
  listAmount: { fontSize: 18, fontWeight: 'bold', color: '#28A745' },
  empty: { textAlign: 'center', marginTop: 40, color: '#666' }
});
