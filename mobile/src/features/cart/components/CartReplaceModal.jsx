import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText as Text } from '../../../shared/components/ui/Text';
import { useCartStore } from '../store/useCartStore';

export function CartReplaceModal() {
  const { pendingReplaceItem, confirmReplaceCart, cancelReplaceCart } = useCartStore();

  if (!pendingReplaceItem) return null;

  return (
    <Modal transparent visible={!!pendingReplaceItem} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Replace cart item?</Text>
          <Text style={styles.message}>
            Your cart contains dishes from another restaurant. Do you want to discard the selection and add dishes from this restaurant?
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.cancelBtn} onPress={cancelReplaceCart}>
              <Text style={styles.cancelText}>NO</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.replaceBtn} onPress={confirmReplaceCart}>
              <Text style={styles.replaceText}>REPLACE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
    alignItems: 'center' 
  },
  modalContainer: { 
    width: '100%', 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40, // extra padding for bottom screen safe area
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#1C1C1C' 
  },
  message: { 
    fontSize: 15, 
    color: '#4A4A4A', 
    marginBottom: 24, 
    lineHeight: 22 
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 16 
  },
  cancelBtn: { 
    flex: 1,
    paddingVertical: 14, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E23744',
    alignItems: 'center'
  },
  cancelText: { 
    color: '#E23744', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  replaceBtn: { 
    flex: 1,
    backgroundColor: '#E23744', 
    paddingVertical: 14, 
    borderRadius: 8,
    alignItems: 'center'
  },
  replaceText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 15 
  }
});
