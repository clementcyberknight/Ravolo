import { create } from 'zustand';
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { useInventoryStore } from './inventory-store';
import { CROP_GUIDE, CropType } from '@/constants/crops';

const farmStorage = createMMKV({
  id: "farm-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => farmStorage.set(name, value),
  getItem: (name) => farmStorage.getString(name) ?? null,
  removeItem: (name) => farmStorage.remove(name),
};

export type PlotStatus = 'empty' | 'planted' | 'ready';

export interface FarmPlot {
  id: string;
  status: PlotStatus;
  cropId?: CropType;
  plantedAt?: number; // timestamp in ms
  readyAt?: number;
}

interface FarmState {
  plots: Record<string, FarmPlot>; 
  plotIds: string[]; 
  selectedCropId: CropType;
  setSelectedCropId: (cropId: CropType) => void;
  plantCrop: (id: string) => void;
  harvestCrop: (id: string) => void;
  markReady: (id: string) => void;
  buyPlot: () => void;
  applyPlantResult: (payload: {
    plotId: number | string;
    cropId: CropType;
    plantedAtMs: number;
    readyAtMs?: number;
  }) => void;
  applyHarvestResult: (plotId: number | string) => void;
  setFarmFromServer: (payload: {
    plots: Array<{
      plotId: number | string;
      status: PlotStatus;
      cropId?: string;
      plantedAt?: number | null;
      readyAt?: number | null;
    }>;
    selectedCropId?: CropType;
  }) => void;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set) => ({
      plots: {},
      plotIds: [],
      selectedCropId: 'wheat',

      setSelectedCropId: (cropId) => set({ selectedCropId: cropId }),

      plantCrop: (id) =>
        set((state) => {
          const plot = state.plots[id];
          if (!plot || plot.status !== "empty") return state;

          const hasSeed = useInventoryStore
            .getState()
            .removeResource(state.selectedCropId, 1);
          if (!hasSeed) return state;

          return {
            plots: {
              ...state.plots,
              [id]: {
                ...plot,
                status: "planted",
                cropId: state.selectedCropId,
                plantedAt: Date.now(),
              },
            },
          };
        }),

      harvestCrop: (id) =>
        set((state) => {
          const plot = state.plots[id];
          if (!plot || plot.cropId === undefined) return state;

          const cropDef = CROP_GUIDE[plot.cropId];
          const now = Date.now();
          const elapsed = plot.plantedAt ? (now - plot.plantedAt) / 1000 : 0;

          if (plot.status === 'planted' && elapsed < cropDef.growthTime) {
            return state;
          }

          useInventoryStore.getState().addResource(plot.cropId, 'crop', cropDef.yield);

          return {
            plots: {
              ...state.plots,
              [id]: { ...plot, status: 'empty', cropId: undefined, plantedAt: undefined },
            },
          };
        }),

      markReady: (id) =>
        set((state) => {
          const plot = state.plots[id];
          if (!plot || plot.status !== 'planted') return state;
          return {
            plots: {
              ...state.plots,
              [id]: { ...plot, status: 'ready' },
            },
          };
        }),

      buyPlot: () =>
        set((state) => {
          if (state.plotIds.length >= 32) return state;

          const newId = `plot-${state.plotIds.length}`;
          return {
            plotIds: [...state.plotIds, newId],
            plots: {
              ...state.plots,
              [newId]: { id: newId, status: 'empty' },
            },
          };
        }),

      applyPlantResult: ({ plotId, cropId, plantedAtMs, readyAtMs }) =>
        set((state) => {
          const idNum =
            typeof plotId === "number"
              ? plotId
              : Number(String(plotId).replace("plot-", ""));
          const id = Number.isFinite(idNum) ? `plot-${idNum}` : String(plotId);
          const existingPlot = state.plots[id] ?? { id, status: "empty" as const };
          const hasPlot = state.plotIds.includes(id);

          return {
            plotIds: hasPlot ? state.plotIds : [...state.plotIds, id],
            plots: {
              ...state.plots,
              [id]: {
                ...existingPlot,
                id,
                status: "planted",
                cropId,
                plantedAt: plantedAtMs,
                readyAt: readyAtMs,
              },
            },
          };
        }),

      applyHarvestResult: (plotId) =>
        set((state) => {
          const idNum =
            typeof plotId === "number"
              ? plotId
              : Number(String(plotId).replace("plot-", ""));
          const id = Number.isFinite(idNum) ? `plot-${idNum}` : String(plotId);
          const plot = state.plots[id];
          if (!plot) {
            return state;
          }

          return {
            plots: {
              ...state.plots,
              [id]: {
                ...plot,
                status: "empty",
                cropId: undefined,
                plantedAt: undefined,
                readyAt: undefined,
              },
            },
          };
        }),

      setFarmFromServer: ({ plots, selectedCropId }) =>
        set((state) => {
          const mappedPlots: Record<string, FarmPlot> = {};
          const mappedIds: string[] = [];

          plots.forEach((plot) => {
            const idNum =
              typeof plot.plotId === "number"
                ? plot.plotId
                : Number(String(plot.plotId).replace("plot-", ""));
            const id = Number.isFinite(idNum) ? `plot-${idNum}` : String(plot.plotId);
            mappedIds.push(id);
            mappedPlots[id] = {
              id,
              status: plot.status,
              cropId: plot.cropId as CropType | undefined,
              plantedAt: plot.plantedAt ?? undefined,
              readyAt: plot.readyAt ?? undefined,
            };
          });

          mappedIds.sort((a, b) => {
            const ai = Number(a.replace("plot-", ""));
            const bi = Number(b.replace("plot-", ""));
            return ai - bi;
          });

          return {
            plots: mappedPlots,
            plotIds: mappedIds,
            selectedCropId: selectedCropId ?? state.selectedCropId,
          };
        }),
    }),
    {
      name: "farm-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

