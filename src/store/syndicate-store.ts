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
export type BackendRole = "owner" | "officer" | "member";

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

export interface DashboardMember {
  userId: string;
  role: BackendRole;
  level: number;
  lastSeenAtMs: number;
  online: boolean;
}

export interface DashboardCommodity {
  itemId: string;
  quantity: number;
  sellPriceMicro: number;
  sellPriceGold: number;
  monopolyPct: number;
  crashPct: number;
  memberShares: Record<string, number>;
}

export interface ActiveBoost {
  shieldExpiresAtMs: number;
  idolLevel: number;
  idolStatus: "blessed" | "punished" | "none";
  blessedUntilMs: number;
  punishedUntilMs: number;
}

export interface JoinRequest {
  userId: string;
  requestedAtMs: number;
  level: number;
}

export interface SyndicateDashboard {
  name: string;
  emblemId: string;
  activeBoost: ActiveBoost;
  totalGold: number;
  totalMembers: number;
  onlineCount: number;
  members: DashboardMember[];
  commodities: DashboardCommodity[];
  joinRequests: JoinRequest[];
}

interface SyndicateState {
  joinedSyndicate: MySyndicate | null;
  /** At most one outstanding join request; blocks requesting other clans. */
  pendingJoinSyndicateId: string | null;
  syndicates: any[];
  dashboard: SyndicateDashboard | null;
  dashboardLoading: boolean;

  joinSyndicate: (syndicate: MySyndicate) => void;
  leaveSyndicate: () => void;
  setPendingJoinSyndicateId: (syndicateId: string | null) => void;
  setSyndicates: (syndicates: any[]) => void;
  setDashboard: (dashboard: SyndicateDashboard) => void;
  clearDashboard: () => void;
  setDashboardLoading: (loading: boolean) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useSyndicateStore = create<SyndicateState>()(
  persist(
    (set) => ({
      joinedSyndicate: null,
      pendingJoinSyndicateId: null,
      syndicates: [],
      dashboard: null,
      dashboardLoading: false,

      joinSyndicate: (syndicate) =>
        set({ joinedSyndicate: syndicate, pendingJoinSyndicateId: null }),
      leaveSyndicate: () =>
        set({
          joinedSyndicate: null,
          dashboard: null,
          dashboardLoading: false,
          pendingJoinSyndicateId: null,
        }),
      setPendingJoinSyndicateId: (syndicateId) =>
        set({ pendingJoinSyndicateId: syndicateId }),
      setSyndicates: (syndicates) => set({ syndicates }),
      setDashboard: (dashboard) =>
        set({ dashboard, dashboardLoading: false }),
      clearDashboard: () => set({ dashboard: null }),
      setDashboardLoading: (loading) => set({ dashboardLoading: loading }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "syndicate-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        joinedSyndicate: state.joinedSyndicate,
        pendingJoinSyndicateId: state.pendingJoinSyndicateId,
        syndicates: state.syndicates,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
