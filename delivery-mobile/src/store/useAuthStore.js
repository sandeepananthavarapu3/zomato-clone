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
      partner: null,
      tokens: null,
      isAuthenticated: false,
      
      login: (data) => set({
        partner: data.partner || data.restaurant,
        tokens: data.tokens,
        isAuthenticated: true
      }),
      
      logout: () => set({
        partner: null,
        tokens: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'delivery-auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
