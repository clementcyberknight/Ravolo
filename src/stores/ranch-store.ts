import { create } from 'zustand';
import { useInventoryStore } from './inventory-store';

export type FacilityType = 'chicken_coop' | 'cow_shed' | 'pigsty' | 'apiary' | 'goat_farm' | 'sheep_farm' | 'silkworm_house';

export interface FacilityConfig {
  id: FacilityType;
  name: string;
  description: string;
  asset: any;
  product: string;
  feedId: string;
  unlockLevel: number;
  baseProductionTimeSec: number;
}

export const FACILITY_CONFIG: Record<FacilityType, FacilityConfig> = {
  chicken_coop: {
    id: 'chicken_coop',
    name: 'Chicken Coop',
    description: 'Produces eggs regularly',
    asset: require('@/assets/image/assets_images_icons_animals_chicken_coop.webp'),
    product: 'egg',
    feedId: 'corn',
    unlockLevel: 1,
    baseProductionTimeSec: 14 * 60, // 14 mins
  },
  cow_shed: {
    id: 'cow_shed',
    name: 'Cow Shed',
    description: 'Produces milk regularly',
    asset: require('@/assets/image/assets_images_icons_animals_cow_shed.webp'),
    product: 'milk',
    feedId: 'wheat',
    unlockLevel: 13,
    baseProductionTimeSec: 45 * 60,
  },
  pigsty: {
    id: 'pigsty',
    name: 'Pigsty',
    description: 'Produces pork regularly',
    asset: require('@/assets/image/assets_images_icons_animals_pigsty.webp'),
    product: 'pork',
    feedId: 'corn',
    unlockLevel: 25,
    baseProductionTimeSec: 60 * 60,
  },
  apiary: {
    id: 'apiary',
    name: 'Apiary',
    description: 'Produces honey from flowers',
    asset: require('@/assets/image/assets_images_icons_animals_apiary.webp'),
    product: 'honey',
    feedId: 'sunflower',
    unlockLevel: 18,
    baseProductionTimeSec: 30 * 60,
  },
  goat_farm: {
    id: 'goat_farm',
    name: 'Goat Farm',
    description: 'Produces goat milk',
    asset: require('@/assets/image/assets_images_icons_animals_goat_farm.webp'),
    product: 'goat_milk',
    feedId: 'wheat',
    unlockLevel: 32,
    baseProductionTimeSec: 50 * 60,
  },
  sheep_farm: {
    id: 'sheep_farm',
    name: 'Sheep Farm',
    description: 'Produces soft wool',
    asset: require('@/assets/image/assets_images_icons_animals_sheep_farm.webp'),
    product: 'wool',
    feedId: 'wheat',
    unlockLevel: 40,
    baseProductionTimeSec: 80 * 60, // Wait times exaggerated logic
  },
  silkworm_house: {
    id: 'silkworm_house',
    name: 'Silkworm House',
    description: 'Produces fine silk',
    asset: require('@/assets/image/assets_images_icons_animals_silkworm_house.webp'),
    product: 'silk',
    feedId: 'tea_leaves',
    unlockLevel: 50,
    baseProductionTimeSec: 120 * 60,
  }
};

export interface FacilityState {
  level: number;
  feedCount: number;
  readyCount: number;
  producingSince: number | null; // Timestamp
}

interface RanchState {
  facilities: Record<FacilityType, FacilityState>;
  
  feedFacility: (id: FacilityType) => void;
  collectProduct: (id: FacilityType) => void;
  upgradeFacility: (id: FacilityType) => void;
}

const initialFacilities: Record<FacilityType, FacilityState> = {
  chicken_coop: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  cow_shed: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  pigsty: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  apiary: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  goat_farm: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  sheep_farm: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
  silkworm_house: { level: 1, feedCount: 0, readyCount: 0, producingSince: null },
};

export const useRanchStore = create<RanchState>((set, get) => ({
  facilities: initialFacilities,

  feedFacility: (id) => {
    const config = FACILITY_CONFIG[id];
    const inventory = useInventoryStore.getState();
    const invItem = inventory.items[config.feedId];
    
    // Check if player has feed
    if (invItem && invItem.quantity > 0) {
      if (inventory.removeResource(config.feedId, 1)) {
         set((state) => {
           let newProducingSince = state.facilities[id].producingSince;
           let feedCount = state.facilities[id].feedCount;
           
           if (newProducingSince === null) {
              newProducingSince = Date.now();
           } else {
              feedCount += 1; // Queue up feed if already producing
           }

           return {
             facilities: {
               ...state.facilities,
               [id]: {
                 ...state.facilities[id],
                 feedCount: feedCount,
                 producingSince: newProducingSince
               }
             }
           };
         });
      }
    }
  },

  collectProduct: (id) => {
    set((state) => {
      const fac = state.facilities[id];
      const config = FACILITY_CONFIG[id];
      
      if (fac.readyCount > 0) {
        // Add to inventory
        useInventoryStore.getState().addResource(config.product, 'product', fac.readyCount);
        
        let newProducingSince = null;
        let newFeedCount = fac.feedCount;

        // If we have queued feed, immediately start producing again
        if (newFeedCount > 0) {
           newProducingSince = Date.now();
           newFeedCount -= 1;
        }

        return {
          facilities: {
            ...state.facilities,
            [id]: {
              ...fac,
              readyCount: 0,
              feedCount: newFeedCount,
              producingSince: newProducingSince
            }
          }
        };
      }
      return state;
    });
  },

  upgradeFacility: (id) => {
    // Basic upgrade mock - will cost coins dynamically later
    set((state) => ({
      facilities: {
        ...state.facilities,
        [id]: {
          ...state.facilities[id],
          level: state.facilities[id].level + 1,
        }
      }
    }));
  }
}));
