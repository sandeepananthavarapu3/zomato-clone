import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../../../shared/services/storage';
import { Alert, Platform } from 'react-native';

const mmkvStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      pendingReplaceItem: null,
      restaurantId: null,
      restaurantName: null,
      restaurantWelcomeOffer: true,
      
      addItem: (item, resId, resName, isWelcomeOfferEnabled = true) => {
        const currentResId = get().restaurantId;
        
        if (currentResId && currentResId !== resId) {
          set({ pendingReplaceItem: { item, resId, resName, isWelcomeOfferEnabled } });
          return;
        }

        const items = get().items;
        const existingItem = items.find(i => i.id === item.id);
        
        if (existingItem) {
          set({
            items: items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i),
            restaurantId: resId,
            restaurantName: resName,
            restaurantWelcomeOffer: isWelcomeOfferEnabled
          });
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }],
            restaurantId: resId,
            restaurantName: resName,
            restaurantWelcomeOffer: isWelcomeOfferEnabled
          });
        }
      },
      
      removeItem: (itemId) => {
        const items = get().items;
        const existingItem = items.find(i => i.id === itemId);
        
        if (existingItem?.quantity === 1) {
          const newItems = items.filter(i => i.id !== itemId);
          set({ items: newItems, ...(newItems.length === 0 ? { restaurantId: null, restaurantName: null } : {}) });
        } else {
          set({
            items: items.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
          });
        }
      },
      
      
      confirmReplaceCart: () => {
        const pending = get().pendingReplaceItem;
        if (pending) {
          set({
            items: [{...pending.item, quantity: 1}],
            restaurantId: pending.resId,
            restaurantName: pending.resName,
            restaurantWelcomeOffer: pending.isWelcomeOfferEnabled,
            pendingReplaceItem: null
          });
        }
      },
      cancelReplaceCart: () => set({ pendingReplaceItem: null }),
  
      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null, restaurantWelcomeOffer: true }),
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
