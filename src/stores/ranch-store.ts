import { create } from 'zustand';
import { CropType } from './farm-store';
import { useInventoryStore } from './inventory-store';

export type AnimalType = 'bee' | 'chicken' | 'cow' | 'goat' | 'pig' | 'sheep' | 'silkworm';
export type AnimalProduct = 'honey' | 'egg' | 'milk' | 'goat_milk' | 'pork' | 'wool' | 'silk';

export type RanchPlotStatus = 'empty' | 'hungry' | 'producing' | 'ready';

export interface RanchPlot {
  id: string;
  status: RanchPlotStatus;
  animalType?: AnimalType;
}

export const ANIMAL_CONFIG: Record<AnimalType, {
  name: string;
  feedCrop: CropType | null; 
  product: AnimalProduct;
  cost: number;
}> = {
  // Configured default feeding rules based on standard farm concepts
  bee: { name: 'Apiary', feedCrop: 'sunflower', product: 'honey', cost: 100 },
  chicken: { name: 'Chicken Coop', feedCrop: 'corn', product: 'egg', cost: 50 },
  cow: { name: 'Cow Barn', feedCrop: 'wheat', product: 'milk', cost: 200 },
  goat: { name: 'Goat Farm', feedCrop: 'wheat', product: 'goat_milk', cost: 150 },
  pig: { name: 'Pigsty', feedCrop: 'corn', product: 'pork', cost: 120 },
  sheep: { name: 'Sheep Fold', feedCrop: 'wheat', product: 'wool', cost: 130 },
  silkworm: { name: 'Silkworm House', feedCrop: 'tea_leaves', product: 'silk', cost: 180 },
};

interface RanchState {
  plots: Record<string, RanchPlot>;
  plotIds: string[];
  buyRanchPlot: () => void;
  buyAnimal: (plotId: string, animalType: AnimalType) => boolean;
  feedAnimal: (plotId: string) => boolean;
  growAnimal: (plotId: string) => void;
  collectProduct: (plotId: string) => void;
  mateAnimals: (animalType: AnimalType) => boolean; 
}

const getInitialPlots = () => {
  const plots: Record<string, RanchPlot> = {};
  const plotIds: string[] = [];
  // Initial starting ranch size: 4 plots
  for (let i = 0; i < 4; i++) {
    const id = `ranch-plot-${i}`;
    plotIds.push(id);
    plots[id] = { id, status: 'empty' };
  }
  return { plots, plotIds };
};

const initial = getInitialPlots();

export const useRanchStore = create<RanchState>((set, get) => ({
  plots: initial.plots,
  plotIds: initial.plotIds,

  buyRanchPlot: () => set((state) => {
    if (state.plotIds.length >= 16) return state; // Maximum 16 ranch plots for now
    const newId = `ranch-plot-${Date.now()}`;
    return {
      plotIds: [...state.plotIds, newId],
      plots: { ...state.plots, [newId]: { id: newId, status: 'empty' } },
    };
  }),

  buyAnimal: (plotId, animalType) => {
    set((state) => ({
      plots: {
        ...state.plots,
        [plotId]: { ...state.plots[plotId], status: 'hungry', animalType },
      }
    }));
    return true;
  },

  feedAnimal: (plotId) => {
    const state = get();
    const plot = state.plots[plotId];
    if (plot.status !== 'hungry' || !plot.animalType) return false;
    
    const config = ANIMAL_CONFIG[plot.animalType];
    const feedCrop = config.feedCrop;
    
    if (feedCrop) {
      const inventoryStore = useInventoryStore.getState();
      const removed = inventoryStore.removeResource(feedCrop, 1);
      if (!removed) return false; // Inventory did not possess the required crop
    }
    
    set((state) => ({
      plots: {
        ...state.plots,
        [plotId]: { ...state.plots[plotId], status: 'producing' }
      }
    }));
    return true;
  },

  growAnimal: (plotId) => set((state) => ({
    plots: {
      ...state.plots,
      [plotId]: { ...state.plots[plotId], status: 'ready' }
    }
  })),

  collectProduct: (plotId) => {
    const state = get();
    const plot = state.plots[plotId];
    if (plot.status !== 'ready' || !plot.animalType) return;
    
    const product = ANIMAL_CONFIG[plot.animalType].product;
    useInventoryStore.getState().addResource(product, 'product', 1);
    
    set((state) => ({
      plots: {
        ...state.plots,
        [plotId]: { ...state.plots[plotId], status: 'hungry' } // Cycles back to hungry after collection
      }
    }));
  },

  mateAnimals: (animalType) => {
    const state = get();
    const adults = Object.values(state.plots).filter(p => p.animalType === animalType);
    
    if (adults.length >= 2) {
      const emptyPlot = Object.values(state.plots).find(p => p.status === 'empty');
      if (emptyPlot) {
        state.buyAnimal(emptyPlot.id, animalType);
        return true; // Successfully mated and placed new offspring
      }
    }
    return false; // Not enough parents or no space
  }
}));
