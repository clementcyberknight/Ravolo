import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "syndicate-storage" });

const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.remove(name),
};

export type SyndicateRole = "Grandmaster" | "Enforcer" | "Initiate";
export type SyndicateActivity = "online" | "recent" | "idle";

export interface MySyndicate {
  id: string;
  name: string;
  rank: number;
  logo: any;
  role: SyndicateRole;
  wealth: number;
  memberCount: number;
  maxMembers: number;
  season: string;
}

interface SyndicateState {
  joinedSyndicate: MySyndicate | null;
  syndicates: any[];
  joinSyndicate: (syndicate: MySyndicate) => void;
  leaveSyndicate: () => void;
  setSyndicates: (syndicates: any[]) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useSyndicateStore = create<SyndicateState>()(
  persist(
    (set) => ({
      joinedSyndicate: null,
      syndicates: [],
      joinSyndicate: (syndicate) => set({ joinedSyndicate: syndicate }),
      leaveSyndicate: () => set({ joinedSyndicate: null }),
      setSyndicates: (syndicates) => set({ syndicates }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "syndicate-storage",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
