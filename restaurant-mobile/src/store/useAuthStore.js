import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const customStorage = {
  getItem: (name) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(name);
    }
    return null;
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(name);
    }
  },
};

export const useAuthStore = create(
  persist(
    (set) => ({
      restaurant: null,
      tokens: null,
      isAuthenticated: false,
      
      login: (data) => set({
        restaurant: data.restaurant || data.partner,
        tokens: data.tokens,
        isAuthenticated: true
      }),
      
      logout: () => set({
        restaurant: null,
        tokens: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'restaurant-auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
