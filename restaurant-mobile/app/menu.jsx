import React, { useRef } from 'react';
import { Platform, Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Switch, Image, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../src/shared/services/api';
import { useRouter } from 'expo-router';

export default function MenuScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef(null);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItemId, setEditingItemId] = React.useState(null);
  const [newItem, setNewItem] = React.useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: true,
    imageUrl: ''
  });

  const { data: menu = [], isLoading } = useQuery({
    queryKey: ['partner-menu'],
    queryFn: async () => {
      const res = await api.get('/partner/menu');
      return res.data.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (item) => {
      await api.post('/partner/menu', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner-menu']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (item) => {
      const { _id, ...rest } = item;
      await api.patch(`/partner/menu/${_id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner-menu']);
      resetForm();
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isAvailable }) => {
      await api.patch(`/partner/menu/${id}`, { isAvailable });
    },
    onSuccess: () => queryClient.invalidateQueries(['partner-menu'])
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/partner/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner-menu']);
    }
  });

  const handleDelete = (id) => {
    const performDelete = () => {
      deleteMutation.mutate(id);
    };
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this menu item?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Menu Item",
        "Are you sure you want to delete this menu item?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", onPress: performDelete, style: 'destructive' }
        ]
      );
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingItemId(null);
    setNewItem({ name: '', description: '', price: '', category: '', isVeg: true, imageUrl: '' });
  };

  const handleSave = () => {
    if (!newItem.name || !newItem.price || !newItem.category) return;
    
    const payload = {
      ...newItem,
      price: parseFloat(newItem.price)
    };

    if (editingItemId) {
      updateMutation.mutate({ _id: editingItemId, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleEdit = (item) => {
    setEditingItemId(item._id);
    setNewItem({
      name: item.name || '',
      description: item.description || '',
      price: (item.price / 100).toString(),
      category: item.category || '',
      isVeg: item.isVeg,
      imageUrl: item.imageUrl || ''
    });
    setIsFormOpen(true);
    // Scroll to top to show form
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')} style={{ marginRight: 15 }}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Menu</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={{ flex: 1, padding: 20 }}>
        {!isFormOpen ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsFormOpen(true)}>
            <Text style={styles.addBtnText}>+ Add New Item</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{editingItemId ? 'Edit Item' : 'Add Item'}</Text>
            <TextInput style={styles.input} placeholder="Item Name" value={newItem.name} onChangeText={t => setNewItem({...newItem, name: t})} />
            <TextInput style={styles.input} placeholder="Description" value={newItem.description} onChangeText={t => setNewItem({...newItem, description: t})} />
            <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="numeric" value={newItem.price} onChangeText={t => setNewItem({...newItem, price: t})} />
            <TextInput style={styles.input} placeholder="Category (e.g., Starters, Mains)" value={newItem.category} onChangeText={t => setNewItem({...newItem, category: t})} />
            <TextInput style={styles.input} placeholder="Custom Image URL (Optional)" value={newItem.imageUrl} onChangeText={t => setNewItem({...newItem, imageUrl: t})} />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <Text style={{ marginRight: 10, fontWeight: 'bold' }}>Is Vegetarian?</Text>
              <Switch value={newItem.isVeg} onValueChange={v => setNewItem({...newItem, isVeg: v})} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.btnPrimary, { flex: 1, alignItems: 'center' }]} onPress={handleSave}>
                <Text style={styles.btnTextPrimary}>{editingItemId ? 'Update Item' : 'Save Item'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSecondary, { flex: 1, alignItems: 'center' }]} onPress={resetForm}>
                <Text style={styles.btnTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {menu.map((item) => (
          <View key={item._id} style={styles.menuCard}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
            ) : (
              <View style={[styles.menuImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#999', fontSize: 10 }}>No Image</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.vegBadge, { borderColor: item.isVeg ? '#28A745' : '#E23744' }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#28A745' : '#E23744' }]} />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemCategory}>{item.category}</Text>
              <Text style={styles.itemPrice}>₹{(item.price / 100).toFixed(2)}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
              
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={{ color: '#0066cc', fontWeight: 'bold', fontSize: 13 }}>✏️ EDIT ITEM</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Text style={{ color: '#E23744', fontWeight: 'bold', fontSize: 13 }}>🗑️ DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: item.isAvailable ? '#28A745' : '#E23744', marginBottom: 4, fontWeight: 'bold' }}>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</Text>
              <Switch 
                value={item.isAvailable} 
                onValueChange={(val) => toggleStatusMutation.mutate({ id: item._id, isAvailable: val })} 
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={item.isAvailable ? '#E23744' : '#f4f3f4'}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 16, color: '#E23744', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#E23744', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10 },
  btnPrimary: { backgroundColor: '#E23744', padding: 12, borderRadius: 8 },
  btnSecondary: { backgroundColor: '#eee', padding: 12, borderRadius: 8 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold' },
  btnTextSecondary: { color: '#333', fontWeight: 'bold' },
  menuCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  menuImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemCategory: { fontSize: 12, color: '#666', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 4 },
  itemDesc: { fontSize: 12, color: '#888', marginTop: 4 },
  vegBadge: { width: 12, height: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  vegDot: { width: 6, height: 6, borderRadius: 3 }
});
