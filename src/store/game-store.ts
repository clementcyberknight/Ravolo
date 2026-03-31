import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const gameStorage = createMMKV({
  id: "game-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => gameStorage.set(name, value),
  getItem: (name) => gameStorage.getString(name) ?? null,
  removeItem: (name) => gameStorage.remove(name),
};

interface GameState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  diamonds: number;

  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  addDiamonds: (amount: number) => void;
  setEconomyFromServer: (payload: {
    level?: number;
    xp?: number;
    xpToNextLevel?: number;
    coins?: number;
    diamonds?: number;
  }) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      coins: 0,
      diamonds: 0,

      addXp: (amount) =>
        set((state) => {
          let xp = state.xp + amount;
          let level = state.level;
          let xpToNextLevel = state.xpToNextLevel;

          while (xp >= xpToNextLevel) {
            xp -= xpToNextLevel;
            level += 1;
            xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
          }

          return { xp, level, xpToNextLevel };
        }),

      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      removeCoins: (amount) =>
        set((state) => ({ coins: Math.max(0, state.coins - amount) })),

      addDiamonds: (amount) =>
        set((state) => ({ diamonds: state.diamonds + amount })),

      setEconomyFromServer: (payload) =>
        set((state) => ({
          level: payload.level ?? state.level,
          xp: payload.xp ?? state.xp,
          xpToNextLevel: payload.xpToNextLevel ?? state.xpToNextLevel,
          coins: payload.coins ?? state.coins,
          diamonds: payload.diamonds ?? state.diamonds,
        })),
    }),
    {
      name: "game-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
