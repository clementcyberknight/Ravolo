import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'app-storage',
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.remove(name);
  },
};

interface AppState {
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
