import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../src/shared/services/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

// We just keep auth logic in the root index for simplicity.
export default function LoginScreen() {
  const [phone, setPhone] = useState('9125443419');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [resName, setResName] = useState('');
  const login = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const router = useRouter();

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) return alert('Enter a valid 10-digit number');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone });
      if (res.data.otp) {
        alert(`[TESTING MODE] Your OTP is: ${res.data.otp}`);
      }
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return alert('Enter a 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/restaurant/verify-otp', { 
        phone, 
        code: otp, 
        isSignup: mode === 'signup',
        name: resName 
      });
      // Update global API token for future requests
      api.interceptors.request.use(config => {
        config.headers.Authorization = `Bearer ${res.data.data.tokens.accessToken}`;
        return config;
      });
      login(res.data.data);
      router.replace('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  if (isAuthenticated) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partner Portal</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Already with Zomato</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('signup')} style={[styles.tab, mode === 'signup' && styles.tabActive]}>
          <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Join Zomato</Text>
        </TouchableOpacity>
      </View>

      {step === 1 ? (
        <View style={styles.card}>
          {mode === 'signup' && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Restaurant Name</Text>
              <TextInput 
                style={[styles.input, { marginBottom: 0 }]}
                value={resName}
                onChangeText={setResName}
                placeholder="e.g. Zomato Clone Biryani"
              />
            </View>
          )}
          <Text style={styles.label}>Restaurant Owner Phone</Text>
          <TextInput 
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9125443419"
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput 
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit code"
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1C', marginBottom: 30, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#E23744' },
  tabText: { color: '#666', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#E23744', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
