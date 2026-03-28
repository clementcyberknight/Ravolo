import { ResourceType } from "@/store/inventory-store";

export interface ShopItem {
  id: string;
  name: string;
  img: any;
  qty: number;
  price: number;
  oldPrice?: number;
  pct?: number;
  tag?: string;
  resourceId: string;
  resourceType: ResourceType;
}

export interface BundleItem {
  img: any;
  label: string;
}

export interface Bundle {
  id: string;
  name: string;
  pct: number;
  price: number;
  oldPrice: number;
  items: BundleItem[];
}

export interface TokenPack {
  id: string;
  amount: number;
  price: number;
  oldPrice?: number;
  tag?: string;
}

// Assets
const cornImg = require("@/assets/image/assets_images_icons_crops_corn.webp");
const carrotImg = require("@/assets/image/assets_images_icons_crops_carrot.webp");
const berryImg = require("@/assets/image/assets_images_icons_areaitems_berries.webp");
export const coinIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");
export const hourglassIcon = require("@/assets/image/assets_images_icons_misc_hourglass.webp");

export const FLASH_SALE_ITEMS: ShopItem[] = [
  { 
    id: "f1", name: "Corn", img: cornImg, qty: 50, price: 80, oldPrice: 150, pct: 47, 
    resourceId: "corn", resourceType: "crop" 
  },
  { 
    id: "f2", name: "Carrot", img: carrotImg, qty: 30, price: 60, oldPrice: 120, pct: 50,
    resourceId: "carrot", resourceType: "crop"
  },
  { 
    id: "f3", name: "Berry", img: berryImg, qty: 25, price: 45, oldPrice: 90, pct: 50,
    resourceId: "berry", resourceType: "crop" 
  },
];

export const DAILY_DEALS: ShopItem[] = [
  { id: "d1", name: "Corn", img: cornImg, qty: 20, price: 45, oldPrice: 60, resourceId: "corn", resourceType: "crop" },
  { id: "d2", name: "Carrot", img: carrotImg, qty: 15, price: 50, oldPrice: 70, resourceId: "carrot", resourceType: "crop" },
  { id: "d3", name: "Berry", img: berryImg, qty: 12, price: 38, oldPrice: 55, resourceId: "berry", resourceType: "crop" },
];

export const SEED_PACKS: ShopItem[] = [
  { id: "s1", name: "Corn", img: cornImg, qty: 10, price: 30, resourceId: "corn", resourceType: "crop" },
  { id: "s2", name: "Corn", img: cornImg, qty: 50, price: 120, oldPrice: 150, tag: "-20%", resourceId: "corn", resourceType: "crop" },
  { id: "s3", name: "Carrot", img: carrotImg, qty: 10, price: 40, resourceId: "carrot", resourceType: "crop" },
  { id: "s4", name: "Carrot", img: carrotImg, qty: 50, price: 160, oldPrice: 200, tag: "-20%", resourceId: "carrot", resourceType: "crop" },
  { id: "s5", name: "Berry", img: berryImg, qty: 10, price: 35, resourceId: "berry", resourceType: "crop" },
  { id: "s6", name: "Berry", img: berryImg, qty: 50, price: 140, oldPrice: 175, tag: "-20%", resourceId: "berry", resourceType: "crop" },
];

export const TOKEN_PACKS: TokenPack[] = [
  { id: "t1", amount: 100, price: 0.99 },
  { id: "t2", amount: 500, price: 3.99, oldPrice: 4.99, tag: "BEST" },
  { id: "t3", amount: 1200, price: 7.99, oldPrice: 11.99, tag: "-33%" },
  { id: "t4", amount: 3000, price: 16.99, oldPrice: 29.99, tag: "-43%" },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b1", name: "Starter Pack", pct: 53, price: 99, oldPrice: 210,
    items: [
      { img: cornImg, label: "20x" },
      { img: carrotImg, label: "15x" },
      { img: berryImg, label: "10x" },
    ],
  },
  {
    id: "b2", name: "Harvest Bundle", pct: 53, price: 399, oldPrice: 850,
    items: [
      { img: cornImg, label: "100x" },
      { img: carrotImg, label: "80x" },
      { img: berryImg, label: "60x" },
    ],
  },
];
