import { create } from 'zustand';

const STORAGE_KEY = 'risewithin.session';

const readStoredSession = () => {
  if (typeof window === 'undefined') return {};
  try {
    const value = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
    return value?.accessToken && value?.refreshToken ? value : {};
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

const persist = (session) => {
  if (typeof window === 'undefined') return;
  if (session?.accessToken && session?.refreshToken) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const useAuth = create((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  ...readStoredSession(),
  setSession: (session) => {
    persist(session);
    set(session);
  },
  logout: () => {
    persist(null);
    set({ accessToken: null, refreshToken: null, user: null });
  }
}));
