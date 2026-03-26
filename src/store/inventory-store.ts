import { create } from 'zustand';

export type ResourceType = 'crop' | 'animal' | 'product';

export interface InventoryItem {
  id: string; // The cropId, animalId, or productId
  type: ResourceType;
  quantity: number;
}

interface InventoryState {
  items: Record<string, InventoryItem>;
  addResource: (id: string, type: ResourceType, amount: number) => void;
  removeResource: (id: string, amount: number) => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
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
      return false; // Not enough quantity
    }
    
    set((state) => ({
      items: {
        ...state.items,
        [id]: {
          ...existing,
          quantity: existing.quantity - amount,
        },
      },
    }));
    return true;
  },
}));
