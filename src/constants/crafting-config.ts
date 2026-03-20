export type BuildingId = 'mill' | 'bakery';
export type RecipeId = 'flour' | 'cornmeal' | 'corn_syrup' | 'rice_flour' | 'cornbread' | 'bread' | 'muffin';

export interface Ingredient {
  id: string;
  amount: number;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  durationSec: number;
  ingredients: Ingredient[];
  levelRequired: number;
  xpReward: number;
  asset: any;
}

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  description: string;
  asset: any;
  unlockLevel: number;
  recipes: RecipeId[];
  initialSlots: number;
  maxSlots: number;
  slotUnlockCosts: number[]; // cost in diamonds for each subsequent slot
}

export const RECIPES: Record<RecipeId, Recipe> = {
  flour: {
    id: 'flour',
    name: 'Flour',
    durationSec: 432, // 7m 12s
    ingredients: [{ id: 'wheat', amount: 2 }],
    levelRequired: 1,
    xpReward: 5,
    asset: require('@/assets/image/assets_images_icons_crafts_flour.webp'),
  },
  cornmeal: {
    id: 'cornmeal',
    name: 'Cornmeal',
    durationSec: 540, // 9m
    ingredients: [{ id: 'corn', amount: 2 }],
    levelRequired: 1,
    xpReward: 7,
    asset: require('@/assets/image/assets_images_icons_crafts_cornmeal.webp'),
  },
  corn_syrup: {
    id: 'corn_syrup',
    name: 'Corn Syrup',
    durationSec: 3240, // 54m
    ingredients: [
      { id: 'corn', amount: 4 },
      { id: 'wheat', amount: 2 },
    ],
    levelRequired: 1,
    xpReward: 15,
    asset: require('@/assets/image/assets_images_icons_crafts_corn_syrup.webp'),
  },
  rice_flour: {
    id: 'rice_flour',
    name: 'Rice Flour',
    durationSec: 810, // 13m 30s
    ingredients: [{ id: 'rice', amount: 2 }],
    levelRequired: 1,
    xpReward: 8,
    asset: require('@/assets/image/assets_images_icons_crafts_rice_flour.webp'),
  },
  cornbread: {
    id: 'cornbread',
    name: 'Cornbread',
    durationSec: 1800, // 30m mock
    ingredients: [
      { id: 'cornmeal', amount: 2 },
      { id: 'egg', amount: 2 },
    ],
    levelRequired: 1,
    xpReward: 12,
    asset: require('@/assets/image/assets_images_icons_crafts_cornbread.webp'),
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    durationSec: 3600, // 1h mock
    ingredients: [{ id: 'flour', amount: 3 }],
    levelRequired: 1,
    xpReward: 10,
    asset: require('@/assets/image/assets_images_icons_crafts_bread.webp'),
  },
  muffin: {
    id: 'muffin',
    name: 'Muffin',
    durationSec: 2700, // 45m mock
    ingredients: [
      { id: 'flour', amount: 1 },
      { id: 'cornmeal', amount: 1 },
      { id: 'egg', amount: 2 },
    ],
    levelRequired: 1,
    xpReward: 15,
    asset: require('@/assets/image/assets_images_icons_crafts_corn_muffins.webp'),
  },
};

export const BUILDINGS_CONFIG: Record<BuildingId, BuildingConfig> = {
  mill: {
    id: 'mill',
    name: 'Mill',
    description: 'Grind your crops into fine powders.',
    asset: require('@/assets/image/assets_images_icons_buildings_mill.webp'),
    unlockLevel: 1,
    recipes: ['flour', 'cornmeal', 'corn_syrup', 'rice_flour'],
    initialSlots: 1,
    maxSlots: 9,
    slotUnlockCosts: [10, 20, 40, 60, 100, 150, 200, 300],
  },
  bakery: {
    id: 'bakery',
    name: 'Bakery',
    description: 'Bake delicious goods using flour and eggs.',
    asset: require('@/assets/image/assets_images_icons_buildings_bakery.webp'),
    unlockLevel: 1,
    recipes: ['cornbread', 'bread', 'muffin'],
    initialSlots: 1,
    maxSlots: 9,
    slotUnlockCosts: [10, 20, 40, 60, 100, 150, 200, 300],
  },
};
