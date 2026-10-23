import React from 'react';
import { View, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../../src/shared/components/ui/Text';
import { useOrderQuery } from '../../src/features/tracking/api/useOrderQuery';
import { useOrderSocket } from '../../src/features/tracking/hooks/useOrderSocket';
import { OrderTimeline } from '../../src/features/tracking/components/OrderTimeline';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/shared/services/api';

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { data: order, isLoading } = useOrderQuery(orderId);
  const { driverLocation } = useOrderSocket(orderId);

  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const queryClient = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/orders/${id}/cancel`);
      return res.data;
    },
    onSuccess: (data) => {
      setCancelModalVisible(false);
      queryClient.invalidateQueries(['order', orderId]);
      queryClient.invalidateQueries(['orders']);
    },
    onError: (err) => {
      setCancelModalVisible(false);
      alert(err?.response?.data?.message || 'Failed to cancel order');
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#E23744" />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <Text>Order not found or loading...</Text>
        <TouchableOpacity onPress={() => router.push('/')} className="mt-4 p-3 bg-[#E23744] rounded-lg">
          <Text className="text-white font-bold">Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canCancel = order && ['PLACED', 'RESTAURANT_ACCEPTED'].includes(order.status);
  let elapsedMins = 0;
  let penaltyText = '';
  if (order) {
    elapsedMins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    if (elapsedMins <= 1) {
      penaltyText = "You will get a full refund.";
    } else if (elapsedMins <= 20) {
      penaltyText = "You will be charged a 50% cancellation fee.";
    } else {
      penaltyText = "You will be charged a 100% cancellation fee (no refund).";
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="bg-white px-4 py-4 flex-row items-center shadow-sm z-10">
        <TouchableOpacity onPress={() => router.push('/')} className="mr-4">
          <ArrowLeft color="#1C1C1C" size={24} />
        </TouchableOpacity>
        <Text variant="h2">Track Order</Text>
      </View>
      
      <View className="h-64 bg-slate-200 justify-center items-center">
        <Text className="text-textSecondary">Map Integration Placeholder</Text>
        {driverLocation && <Text>Driver updating location...</Text>}
      </View>
      
      <View className="p-4 flex-1">
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm mb-4">
          <View>
            <Text className="font-bold text-lg">
              {order.driverId ? order.driverId.name : "Waiting for assignment"}
            </Text>
            <Text className="text-textSecondary text-sm">Delivery Partner</Text>
          </View>
          {order.driverId && (
            <View className="bg-zomato/10 p-3 rounded-full">
              <Phone color="#E23744" size={20} />
            </View>
          )}
        </View>

        <OrderTimeline currentStatus={order.status} />
        
        {canCancel && (
          <TouchableOpacity 
            onPress={() => setCancelModalVisible(true)}
            className="mt-4 bg-white border border-[#E23744] p-3 rounded-lg items-center"
          >
            <Text className="text-[#E23744] font-bold">Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#E23744' }}>Cancel Order?</Text>
            
            <Text style={{ fontSize: 16, color: '#444', marginBottom: 20, lineHeight: 22 }}>
              Are you sure you want to cancel your order?{"\n\n"}
              <Text style={{ fontWeight: 'bold', color: '#000' }}>{penaltyText}</Text>
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={{ padding: 12, borderRadius: 8, backgroundColor: '#eee', flex: 1, alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#444' }}>Keep Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => cancelMutation.mutate(orderId)}
                disabled={cancelMutation.isLoading}
                style={{ padding: 12, borderRadius: 8, backgroundColor: '#E23744', flex: 1, alignItems: 'center' }}
              >
                {cancelMutation.isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: 'bold', color: '#fff' }}>Confirm Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
