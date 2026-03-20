import { create } from "zustand";

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
}

export const useGameStore = create<GameState>((set) => ({
  level: 6,
  xp: 65,
  xpToNextLevel: 100,
  coins: 125,
  diamonds: 30,

  addXp: (amount) =>
    set((state) => {
      let xp = state.xp + amount;
      let level = state.level;
      let xpToNextLevel = state.xpToNextLevel;

      while (xp >= xpToNextLevel) {
        xp -= xpToNextLevel;
        level += 1;
        // Each level requires 20% more XP
        xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
      }

      return { xp, level, xpToNextLevel };
    }),

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

  removeCoins: (amount) =>
    set((state) => ({ coins: Math.max(0, state.coins - amount) })),

  addDiamonds: (amount) =>
    set((state) => ({ diamonds: state.diamonds + amount })),
}));
