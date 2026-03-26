import { create } from 'zustand';
import { BuildingId, RecipeId, BUILDINGS_CONFIG, RECIPES } from '@/constants/crafting-config';
import { useInventoryStore } from './inventory-store';
import { useGameStore } from './game-store';

export interface QueuedItem {
  recipeId: RecipeId;
  status: 'queued' | 'producing' | 'ready';
  startTime?: number;
  finishTime?: number;
}

export interface BuildingState {
  id: BuildingId;
  level: number;
  unlockedSlots: number;
  queue: QueuedItem[];
}

interface CraftingState {
  buildings: Record<BuildingId, BuildingState>;
  startCrafting: (buildingId: BuildingId, recipeId: RecipeId) => boolean;
  collectProduct: (buildingId: BuildingId, itemIndex: number) => void;
  unlockSlot: (buildingId: BuildingId) => boolean;
  upgradeBuilding: (buildingId: BuildingId) => void;
  tick: () => void;
}

export const useCraftingStore = create<CraftingState>((set, get) => ({
  buildings: {
    mill: {
      id: 'mill',
      level: 2,
      unlockedSlots: 3,
      queue: [], // Start empty for now, or mock a few?
    },
    bakery: {
      id: 'bakery',
      level: 1,
      unlockedSlots: 1,
      queue: [],
    },
  },

  startCrafting: (buildingId, recipeId) => {
    const state = get();
    const building = state.buildings[buildingId];
    const recipe = RECIPES[recipeId];

    if (!building || !recipe) return false;
    if (building.queue.length >= building.unlockedSlots) return false;

    // Check ingredients
    const inventory = useInventoryStore.getState();
    const hasIngredients = recipe.ingredients.every(
      (ing) => (inventory.items[ing.id]?.quantity || 0) >= ing.amount
    );

    if (!hasIngredients) return false;

    // Consume ingredients
    recipe.ingredients.forEach((ing) => {
      inventory.removeResource(ing.id, ing.amount);
    });

    set((state) => {
      const newQueue = [...state.buildings[buildingId].queue];
      const itemsInProgress = newQueue.filter(i => i.status === 'producing' || i.status === 'ready').length;
      
      const newItem: QueuedItem = {
        recipeId,
        status: itemsInProgress === 0 ? 'producing' : 'queued',
      };

      if (newItem.status === 'producing') {
        const now = Date.now();
        newItem.startTime = now;
        newItem.finishTime = now + recipe.durationSec * 1000;
      }

      return {
        buildings: {
          ...state.buildings,
          [buildingId]: {
            ...state.buildings[buildingId],
            queue: [...newQueue, newItem],
          },
        },
      };
    });

    return true;
  },

  collectProduct: (buildingId, itemIndex) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (!building || !building.queue[itemIndex] || building.queue[itemIndex].status !== 'ready') {
        return state;
      }

      const item = building.queue[itemIndex];
      const recipe = RECIPES[item.recipeId];

      // Add to inventory
      useInventoryStore.getState().addResource(item.recipeId, 'product', 1);
      // Add XP
      useGameStore.getState().addXp(recipe.xpReward);

      const newQueue = building.queue.filter((_, i) => i !== itemIndex);
      
      return {
        buildings: {
          ...state.buildings,
          [buildingId]: {
            ...building,
            queue: newQueue,
          },
        },
      };
    });
  },

  unlockSlot: (buildingId) => {
    const building = get().buildings[buildingId];
    const config = BUILDINGS_CONFIG[buildingId];
    const currentUnlocked = building.unlockedSlots;
    const costIndex = currentUnlocked - config.initialSlots;
    
    if (costIndex >= config.slotUnlockCosts.length) return false;
    
    const cost = config.slotUnlockCosts[costIndex];
    const gameStore = useGameStore.getState();
    
    if (gameStore.diamonds < cost) return false;
    
    // Deduct diamonds (mocked as removeDiamonds doesn't exist yet, I'll use addDiamonds(-cost))
    gameStore.addDiamonds(-cost);
    
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...state.buildings[buildingId],
          unlockedSlots: state.buildings[buildingId].unlockedSlots + 1,
        },
      },
    }));
    
    return true;
  },

  upgradeBuilding: (buildingId) => {
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...state.buildings[buildingId],
          level: state.buildings[buildingId].level + 1,
        },
      },
    }));
  },

  tick: () => {
    const now = Date.now();
    let hasChanges = false;
    const newBuildings = { ...get().buildings };

    Object.keys(newBuildings).forEach((id) => {
      const bId = id as BuildingId;
      const building = { ...newBuildings[bId] };
      let queueChanged = false;
      const newQueue = [...building.queue];

      // 1. Check if the currently producing item (if any) is finished
      const producingIndex = newQueue.findIndex((i) => i.status === 'producing');
      if (producingIndex !== -1) {
        const item = newQueue[producingIndex];
        if (item.finishTime && now >= item.finishTime) {
          newQueue[producingIndex] = { ...item, status: 'ready' };
          queueChanged = true;
          hasChanges = true;
        }
      }

      // 2. Start the next queued item if nothing is currently producing
      // Note: In some designs, an item can produce while others are ready.
      // We'll follow the rule: only ONE thing produces at a time.
      const isAnythingProducing = newQueue.some((i) => i.status === 'producing');
      if (!isAnythingProducing) {
        const nextQueuedIndex = newQueue.findIndex((i) => i.status === 'queued');
        if (nextQueuedIndex !== -1) {
          const item = newQueue[nextQueuedIndex];
          const recipe = RECIPES[item.recipeId];
          newQueue[nextQueuedIndex] = {
            ...item,
            status: 'producing',
            startTime: now,
            finishTime: now + recipe.durationSec * 1000,
          };
          queueChanged = true;
          hasChanges = true;
        }
      }

      if (queueChanged) {
        building.queue = newQueue;
        newBuildings[bId] = building;
      }
    });

    if (hasChanges) {
      set({ buildings: newBuildings });
    }
  },
}));
