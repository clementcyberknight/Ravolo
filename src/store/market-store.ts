import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

type ActiveEvent = {
  id?: string;
  title?: string;
  description?: string;
  multiplier?: number;
  outcome?: string;
  startsAtMs?: number;
  expiresAtMs?: number;
  playerTip?: string;
  trigger?: string;
  affectedItems?: string[];
};

const marketStorage = createMMKV({
  id: "market-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => marketStorage.set(name, value),
  getItem: (name) => marketStorage.getString(name) ?? null,
  removeItem: (name) => marketStorage.remove(name),
};

interface MarketState {
  prices: Record<string, number>;
  activeEvent: ActiveEvent | null;
  setMarketStatusFromServer: (payload: {
    prices?: Record<string, number>;
    activeEvent?: ActiveEvent | null;
  }) => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      prices: {},
      activeEvent: null,
      setMarketStatusFromServer: (payload) =>
        set((state) => ({
          prices: payload.prices ?? state.prices,
          activeEvent:
            payload.activeEvent === undefined
              ? state.activeEvent
              : payload.activeEvent,
        })),
    }),
    {
      name: "market-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
