import { create } from 'zustand';

interface AppState {
  user: any | null;
  isAuthenticated: boolean;
  setUser: (user: any | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
