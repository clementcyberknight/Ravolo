import { create } from 'zustand';
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

const inventoryStorage = createMMKV({
  id: "inventory-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => inventoryStorage.set(name, value),
  getItem: (name) => inventoryStorage.getString(name) ?? null,
  removeItem: (name) => inventoryStorage.remove(name),
};

export type ResourceType = 'seed' | 'crop' | 'animal' | 'product';

export interface InventoryItem {
  id: string; // The cropId, animalId, or productId
  type: ResourceType;
  quantity: number;
}

interface InventoryState {
  items: Record<string, InventoryItem>;
  addResource: (id: string, type: ResourceType, amount: number) => void;
  removeResource: (id: string, amount: number) => boolean;
  applyInventoryDelta: (id: string, amountDelta: number, type?: ResourceType) => void;
  setInventoryFromServer: (items: Record<string, number>) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: {},

      addResource: (id, type, amount) =>
        set((state) => {
          const existing = state.items[id] || { id, type, quantity: 0 };
          return {
            items: {
              ...state.items,
              [id]: {
                ...existing,
                quantity: existing.quantity + amount,
              },
            },
          };
        }),

      removeResource: (id, amount) => {
        const state = get();
        const existing = state.items[id];
        if (!existing || existing.quantity < amount) {
          return false;
        }

        set((curr) => ({
          items: {
            ...curr.items,
            [id]: {
              ...existing,
              quantity: existing.quantity - amount,
            },
          },
        }));
        return true;
      },

  applyInventoryDelta: (id, amountDelta, type = "crop") =>
        set((state) => {
          const existing = state.items[id] || { id, type, quantity: 0 };
          const nextQuantity = Math.max(0, existing.quantity + amountDelta);

          return {
            items: {
              ...state.items,
              [id]: {
                ...existing,
                type,
                quantity: nextQuantity,
              },
            },
          };
        }),

      setInventoryFromServer: (items) =>
        set(() => {
          const mapped: Record<string, InventoryItem> = {};
          Object.entries(items).forEach(([id, quantity]) => {
            mapped[id] = {
              id,
              type: id.startsWith("seed:") ? "seed" : "crop",
              quantity: Math.max(0, Math.floor(quantity)),
            };
          });
          return { items: mapped };
        }),
    }),
    {
      name: "inventory-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
