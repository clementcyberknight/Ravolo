import { create } from 'zustand';
import { useInventoryStore } from './inventory-store';

export type PlotStatus = 'empty' | 'planted' | 'ready';

export type CropType =
  | 'cacao'
  | 'carrot'
  | 'chili'
  | 'coffee_beans'
  | 'corn'
  | 'cotton'
  | 'grapes'
  | 'lavender'
  | 'mud_pit'
  | 'oat'
  | 'onion'
  | 'pepper'
  | 'potato'
  | 'rice'
  | 'saffron'
  | 'sapling_patch'
  | 'soybean'
  | 'strawberry'
  | 'sugarcane'
  | 'sunflower'
  | 'tea_leaves'
  | 'tomato'
  | 'vanilla'
  | 'wheat';

export const CROP_TYPES: CropType[] = [
  'cacao', 'carrot', 'chili', 'coffee_beans', 'corn', 'cotton', 'grapes',
  'lavender', 'mud_pit', 'oat', 'onion', 'pepper', 'potato', 'rice',
  'saffron', 'sapling_patch', 'soybean', 'strawberry', 'sugarcane', 'sunflower',
  'tea_leaves', 'tomato', 'vanilla', 'wheat'
];

export interface FarmPlot {
  id: string;
  status: PlotStatus;
  cropId?: CropType;
}

interface FarmState {
  plots: Record<string, FarmPlot>; // Performance: Using a dictionary for O(1) lookups and decoupled tile renders
  plotIds: string[]; // Ordered list of plot IDs
  plantCrop: (id: string) => void;
  growCrop: (id: string) => void;
  harvestCrop: (id: string) => void;
  buyPlot: () => void;
}

const getRandomCrop = (): CropType => {
  const index = Math.floor(Math.random() * CROP_TYPES.length);
  return CROP_TYPES[index];
};

const getInitialPlots = () => {
  const plots: Record<string, FarmPlot> = {};
  const plotIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const randomSeed = Math.random();
    let status: PlotStatus = 'empty';
    if (randomSeed > 0.6) {
      status = 'ready';
    } else if (randomSeed > 0.3) {
      status = 'planted';
    }
    
    const id = `plot-${i}`;
    plotIds.push(id);
    plots[id] = {
      id,
      status,
      cropId: status !== 'empty' ? getRandomCrop() : undefined,
    };
  }
  return { plots, plotIds };
};

const initial = getInitialPlots();

export const useFarmStore = create<FarmState>((set) => ({
  plots: initial.plots,
  plotIds: initial.plotIds,

  plantCrop: (id) =>
    set((state) => ({
      plots: {
        ...state.plots,
        [id]: { ...state.plots[id], status: 'planted', cropId: getRandomCrop() },
      },
    })),

  growCrop: (id) =>
    set((state) => ({
      plots: {
        ...state.plots,
        [id]: { ...state.plots[id], status: 'ready' },
      },
    })),

  harvestCrop: (id) =>
    set((state) => {
      const plot = state.plots[id];
      if (plot && plot.status === 'ready' && plot.cropId) {
        useInventoryStore.getState().addResource(plot.cropId, 'crop', 1);
      }
      return {
        plots: {
          ...state.plots,
          [id]: { ...state.plots[id], status: 'empty', cropId: undefined },
        },
      };
    }),

  buyPlot: () =>
    set((state) => {
      // Prevent buying more than 32 plots
      if (state.plotIds.length >= 32) return state;

      // Create a unique ID for the new plot
      const newId = `plot-${Date.now()}`;
      return {
        plotIds: [...state.plotIds, newId],
        plots: {
          ...state.plots,
          [newId]: { id: newId, status: 'empty' },
        },
      };
    }),
}));
