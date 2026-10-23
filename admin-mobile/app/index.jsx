import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../src/shared/components/ui/Text';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { api } from '../src/shared/services/api';

export default function AdminLoginScreen() {
  const [adminId, setAdminId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { id: adminId });
      if (res.data.success) {
        login({ admin: { id: '1111', name: 'Zomato Admin' }, tokens: res.data.data.tokens });
        router.replace('/dashboard');
      }
    } catch (err) {
      alert('Invalid Admin ID (Hint: 1111)');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>zomato</Text>
      <Text style={styles.subtitle}>Admin Portal</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Admin ID</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter ID (1111)"
          value={adminId}
          onChangeText={setAdminId}
          keyboardType="numeric"
          autoFocus
        />
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E23744', justifyContent: 'center', alignItems: 'center', padding: 20 },
  brand: { fontSize: 48, fontWeight: '900', color: '#fff', fontStyle: 'italic' },
  subtitle: { fontSize: 18, color: '#fff', marginBottom: 40, opacity: 0.9 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 16, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20 },
  btn: { backgroundColor: '#E23744', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
