import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const timeStorage = createMMKV({
  id: "server-time-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => timeStorage.set(name, value),
  getItem: (name) => timeStorage.getString(name) ?? null,
  removeItem: (name) => timeStorage.remove(name),
};

interface ServerTimeState {
  lastServerNowMs: number | null;
  lastClientSyncMs: number | null;
  setServerNowMs: (serverNowMs: number) => void;
  getEstimatedServerNowMs: () => number;
}

export const useServerTimeStore = create<ServerTimeState>()(
  persist(
    (set, get) => ({
      lastServerNowMs: null,
      lastClientSyncMs: null,
      setServerNowMs: (serverNowMs) =>
        set({
          lastServerNowMs: serverNowMs,
          lastClientSyncMs: Date.now(),
        }),
      getEstimatedServerNowMs: () => {
        const { lastServerNowMs, lastClientSyncMs } = get();
        if (!lastServerNowMs || !lastClientSyncMs) {
          return Date.now();
        }
        return lastServerNowMs + (Date.now() - lastClientSyncMs);
      },
    }),
    {
      name: "server-time-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
