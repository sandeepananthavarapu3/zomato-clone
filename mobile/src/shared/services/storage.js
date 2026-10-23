export const storage = {
  set: (key, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  getString: (key) => {
    if (typeof window !== 'undefined') return window.localStorage.getItem(key);
    return null;
  },
  delete: (key) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  }
};

export const getItem = (key) => {
  const value = storage.getString(key);
  return value ? JSON.parse(value) : null;
};

export const setItem = (key, value) => {
  storage.set(key, JSON.stringify(value));
};

export const removeItem = (key) => {
  storage.delete(key);
};
