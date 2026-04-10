import { ASSET_MAP } from "@/components/inventory-modal";
import { websocketManager } from "@/services/websocket-manager";
import { useGameStore } from "@/store/game-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useMarketStore } from "@/store/market-store";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const coinIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");
const diamondIcon = require("@/assets/image/assets_images_icons_misc_diamonds.webp");
const closeIconSvg = require("@/assets/inapp-icons/x-close.svg");

const SEEDLING_ASSET_MAP: Record<string, any> = {
  "seed:cacao": require("@/assets/seedlings/cacao_seedling.png"),
  "seed:carrot": require("@/assets/seedlings/carrot_seedling.png"),
  "seed:chili": require("@/assets/seedlings/chile_seedling.png"),
  "seed:coffee": require("@/assets/seedlings/coffee_beans.png"),
  "seed:corn": require("@/assets/seedlings/corn_seedling.png"),
  "seed:cotton": require("@/assets/seedlings/cotton_seedling.png"),
  "seed:grapes": require("@/assets/seedlings/grape_seedling.png"),
  "seed:lavender": require("@/assets/seedlings/lavender_seedling.png"),
  "seed:mud_pit": require("@/assets/seedlings/mud_pit.png"),
  "seed:oat": require("@/assets/seedlings/oat_seedling.png"),
  "seed:onion": require("@/assets/seedlings/onion_seedling.png"),
  "seed:pepper": require("@/assets/seedlings/pepper_seedling.png"),
  "seed:potato": require("@/assets/seedlings/potato_seedling.png"),
  "seed:rice": require("@/assets/seedlings/rice_seedling.png"),
  "seed:saffron": require("@/assets/seedlings/saffron_seedling.png"),
  "seed:sapling": require("@/assets/seedlings/sapling_patch.png"),
  "seed:soybean": require("@/assets/seedlings/soyabeans_seedling.png"),
  "seed:strawberry": require("@/assets/seedlings/strawberry_seedling.png"),
  "seed:sugarcane": require("@/assets/seedlings/sugarcane_seedling.png"),
  "seed:sunflower": require("@/assets/seedlings/sunflower_seedling.png"),
  "seed:tea": require("@/assets/seedlings/tea_leaves.png"),
  "seed:tomato": require("@/assets/seedlings/tomatoes_seedling.png"),
  "seed:vanilla": require("@/assets/seedlings/vanilla_seedling.png"),
  "seed:wheat": require("@/assets/seedlings/wheat_seedling.png"),
};

const MARKET_ASSET_MAP: Record<string, any> = {
  ...ASSET_MAP,
  "animal:chicken": require("@/assets/image/assets_images_icons_animals_chicken_coop.webp"),
  "animal:cow": require("@/assets/image/assets_images_icons_animals_cow_shed.webp"),
  "animal:goat": require("@/assets/image/assets_images_icons_animals_goat_farm.webp"),
  "animal:pig": require("@/assets/image/assets_images_icons_animals_pigsty.webp"),
  "animal:sheep": require("@/assets/image/assets_images_icons_animals_sheep_farm.webp"),
  "animal:silkworm": require("@/assets/image/assets_images_icons_animals_silkworm_house.webp"),
  "animal:bee": require("@/assets/image/assets_images_icons_animals_apiary.webp"),
  beef: require("@/assets/image/assets_images_icons_animalproducts_pork.webp"),
  chicken_meat: require("@/assets/image/assets_images_icons_animalproducts_egg.webp"),
  goat_meat: require("@/assets/image/assets_images_icons_animalproducts_goat_milk.webp"),
  cocoa_pods: require("@/assets/image/assets_images_icons_areaitems_cacao_pod.webp"),
  grape: require("@/assets/image/assets_images_icons_crops_grapes.webp"),
  sapling: require("@/assets/image/assets_images_icons_crops_sapling_patch.webp"),
  mud: require("@/assets/image/assets_images_icons_crops_mud_pit.webp"),
  sunflower_seeds: require("@/assets/image/assets_images_icons_areaitems_sunflower_seed.webp"),
  "craft:flour": require("@/assets/image/assets_images_icons_crafts_flour.webp"),
  "craft:cake": require("@/assets/image/assets_images_icons_crafts_cake.webp"),
  "craft:chocolate": require("@/assets/image/assets_images_icons_crafts_chocolate.webp"),
  "craft:coffee": require("@/assets/image/assets_images_icons_crops_coffee_beans.webp"),
  "craft:cheese": require("@/assets/image/assets_images_icons_crafts_cheese.webp"),
  "craft:butter": require("@/assets/image/assets_images_icons_crafts_butter.webp"),
  "craft:jam": require("@/assets/image/assets_images_icons_crafts_blueberry_jam.webp"),
  "craft:oil": require("@/assets/image/assets_images_icons_crafts_sunflower_oil.webp"),
  "craft:cloth": require("@/assets/image/assets_images_icons_crafts_artisan_tapestry.webp"),
  "craft:wine": require("@/assets/image/assets_images_icons_crafts_grape_wine.webp"),
  "tool:bakery": require("@/assets/image/assets_images_icons_buildings_bakery.webp"),
  "tool:mill": require("@/assets/image/assets_images_icons_buildings_mill.webp"),
  "tool:slaughter_house": require("@/assets/image/assets_images_icons_buildings_smoker.webp"),
  "tool:cheese_factory": require("@/assets/image/assets_images_icons_buildings_creamery.webp"),
  "tool:butter_churn": require("@/assets/image/assets_images_icons_buildings_dairy.webp"),
  "tool:winery": require("@/assets/image/assets_images_icons_buildings_distillery.webp"),
  "tool:oil_press": require("@/assets/image/assets_images_icons_buildings_oil_press.webp"),
  "tool:chocolate_processor": require("@/assets/image/assets_images_icons_buildings_confectioner.webp"),
  "tool:jam_station": require("@/assets/image/assets_images_icons_buildings_jam_house.webp"),
};

function formatMarketName(id: string) {
  const raw = id.startsWith("seed:") ? id.slice("seed:".length) : id;
  return raw
    .replace(/^craft:/, "")
    .replace(/^animal:/, "")
    .replace(/^tool:/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMarketAsset(id: string) {
  return SEEDLING_ASSET_MAP[id] || MARKET_ASSET_MAP[id] || coinIcon;
}

function hasMappedMarketAsset(id: string) {
  return Boolean(SEEDLING_ASSET_MAP[id] || MARKET_ASSET_MAP[id]);
}

function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface MarketListItem {
  id: string;
  item: string;
  name: string;
  buy: number;
  sell: number;
  image: any;
  isSeed: boolean;
  ownedQuantity: number;
  usesFallbackAsset: boolean;
}

const marketKeyExtractor = (item: MarketListItem) => item.id;
const saleKeyExtractor = (item: { id: string }) => item.id;

const MarketItemRow = React.memo(function MarketItemRow({
  item,
  isBuying,
  isSelling,
  onBuy,
  onSell,
}: {
  item: MarketListItem;
  isBuying: boolean;
  isSelling: boolean;
  onBuy: (id: string) => void;
  onSell: (id: string) => void;
}) {
  return (
    <View style={styles.playerSaleCard}>
      <View style={styles.cardLeft}>
        <Image
          source={item.image}
          style={styles.saleItemCover}
          contentFit="contain"
        />
        <View style={styles.cardInfo}>
          <Text style={styles.saleItemTitle}>{item.name}</Text>
          <Text style={styles.sellerName}>
            {item.ownedQuantity > 0
              ? `Owned ${item.ownedQuantity}`
              : item.isSeed
                ? "Seedling"
                : "Marketplace"}
          </Text>
        </View>
      </View>
      <View style={styles.marketPriceColumn}>
        <Pressable
          style={[styles.salePriceBox, isBuying && styles.buyButtonDisabled]}
          onPress={() => onBuy(item.id)}
          disabled={isBuying}
        >
          <Text style={styles.salePriceLabel}>Buy</Text>
          <Text style={styles.salePriceText}>{item.buy.toLocaleString()}</Text>
          <Image
            source={coinIcon}
            style={styles.buyButtonIcon}
            contentFit="contain"
          />
        </Pressable>
        <Pressable
          style={[
            styles.salePriceBox,
            (item.ownedQuantity <= 0 || isSelling) && styles.buyButtonDisabled,
          ]}
          onPress={() => onSell(item.id)}
          disabled={item.ownedQuantity <= 0 || isSelling}
        >
          <Text style={styles.salePriceLabel}>Sell</Text>
          <Text style={styles.salePriceText}>
            {item.sell.toLocaleString()}
          </Text>
          <Image
            source={coinIcon}
            style={styles.buyButtonIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </View>
  );
});

const SaleInventoryCard = React.memo(function SaleInventoryCard({
  item,
  isSelected,
  onSelect,
}: {
  item: { id: string; quantity: number };
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Pressable
      style={[styles.invItemCard, isSelected && styles.invItemCardSelected]}
      onPress={() => onSelect(item.id)}
    >
      <Image
        source={getMarketAsset(item.id)}
        style={styles.invItemImage}
        contentFit="contain"
      />
      <Text style={styles.invItemTitle}>{formatMarketName(item.id)}</Text>
      <Text style={styles.invItemCount}>x{item.quantity}</Text>
    </Pressable>
  );
});

const MarketListEmpty = React.memo(function MarketListEmpty() {
  return (
    <View style={styles.marketEmptyState}>
      <Text style={styles.emptyStateText}>No market items found.</Text>
    </View>
  );
});

const InventoryListEmpty = React.memo(function InventoryListEmpty() {
  return (
    <View style={styles.marketEmptyState}>
      <Text style={styles.emptyStateText}>No inventory items found.</Text>
    </View>
  );
});

// ------------------------ MOCK DATA ------------------------
const PLAYER_SALES = [
  {
    id: "s1",
    item: "corn",
    name: "Corn",
    quantity: 10,
    price: 90,
    seller: "Dukat",
    image: require("@/assets/image/assets_images_icons_crops_corn.webp"),
  },
  {
    id: "s2",
    item: "carrot",
    name: "Carrot",
    quantity: 10,
    price: 60,
    seller: "Dukat",
    image: require("@/assets/image/assets_images_icons_crops_carrot.webp"),
  },
  {
    id: "s3",
    item: "cornbread",
    name: "Cornbread",
    quantity: 10,
    price: 2100,
    seller: "Demash",
    image: require("@/assets/image/assets_images_icons_crafts_cornbread.webp"),
  },
  {
    id: "s4",
    item: "rope",
    name: "Rope",
    quantity: 1,
    price: 4400,
    seller: "Danny",
    image: require("@/assets/image/assets_images_icons_rare_rope.webp"),
  },
  {
    id: "s5",
    item: "leather_strap",
    name: "Leather Strap",
    quantity: 10,
    price: 18000,
    seller: "Getout",
    image: require("@/assets/image/assets_images_icons_rare_leather_strap.webp"),
  },
  {
    id: "s6",
    item: "plank",
    name: "Plank",
    quantity: 10,
    price: 33000,
    seller: "Getout",
    image: require("@/assets/image/assets_images_icons_rare_plank.webp"),
  },
];

const PLAYER_REQUESTS = [
  {
    id: "r1",
    item: "nails",
    name: "Nails",
    reward: 700,
    requester: "Mumblemonster",
    progress: 0,
    required: 10,
    time: "Ends in 23h 59m",
    image: require("@/assets/image/assets_images_icons_rare_nails.webp"),
  },
  {
    id: "r2",
    item: "iron_bar",
    name: "Iron Bar",
    reward: 910,
    requester: "Farmer#53015",
    progress: 0,
    required: 10,
    time: "Ends in 23h 56m",
    image: require("@/assets/image/assets_images_icons_rare_iron_bar.webp"),
  },
];

const COSMETICS_DATA = [
  {
    id: "border_golden",
    name: "Golden Harvest Border",
    description: "A shimmering golden frame",
    price: 500,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_golden_harvest.webp"),
    tag: { label: "Popular", color: "#B8860B", bgColor: "#FFF8DC" },
  },
  {
    id: "border_emerald",
    name: "Emerald Vine Border",
    description: "Lush green vines wrap your profile",
    price: 350,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_emerald_vine.webp"),
  },
  {
    id: "border_rustic",
    name: "Rustic Barn Border",
    description: "Weathered wood planks from the old barn",
    price: 250,
    image: require("@/assets/image/assets_images_icons_avatarborder_border_rustic_barn.webp"),
  },
  {
    id: "bg_golden_meadow",
    name: "Golden Meadow",
    description: "Warm sunset hues over rolling fields",
    price: 500,
    image: require("@/assets/image/assets_images_farmmap_backgrounds_goldenmeadowbg.webp"),
    tag: { label: "New", color: "#0066CC", bgColor: "#E6F0FA" },
  },
  {
    id: "bg_misty",
    name: "Misty Morning",
    description: "Peaceful fog drifts across your farm at dawn",
    price: 450,
    image: require("@/assets/image/assets_images_farmmap_backgrounds_mistymorningbg.webp"),
  },
];

type TopTab = "buy_sell" | "requests";
type BuySellTab = "all" | "my_sales" | "merchant";
type RequestsTab = "open" | "my_requests";

interface MarketModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MarketModal = ({ visible, onClose }: MarketModalProps) => {
  const insets = useSafeAreaInsets();

  const [topTab, setTopTab] = useState<TopTab>("buy_sell");
  const [buySellTab, setBuySellTab] = useState<BuySellTab>("all");
  const [requestsTab, setRequestsTab] = useState<RequestsTab>("open");

  // Create Sale State
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null,
  );
  const [saleQuantity, setSaleQuantity] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [activeMarketActionId, setActiveMarketActionId] = useState<string | null>(null);
  const [buyModalItemId, setBuyModalItemId] = useState<string | null>(null);
  const [buyModalQuantity, setBuyModalQuantity] = useState(1);
  const [sellModalItemId, setSellModalItemId] = useState<string | null>(null);
  const [sellModalQuantity, setSellModalQuantity] = useState(1);
  const [marketSearchQuery, setMarketSearchQuery] = useState("");
  const [saleSearchQuery, setSaleSearchQuery] = useState("");

  // Create Request State
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [requestItemId, setRequestItemId] = useState<string | null>(null);
  const [requestPrice, setRequestPrice] = useState(4);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  const coins = useGameStore((state) => state.coins);
  const marketPrices = useMarketStore((state) => state.prices);

  const inventoryItems = useInventoryStore((state) => state.items);
  const inventoryList = useMemo(
    () =>
      Object.values(inventoryItems)
        .filter((item) => item.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity || a.id.localeCompare(b.id)),
    [inventoryItems],
  );
  const maxSaleQuantity = selectedInventoryId
    ? inventoryItems[selectedInventoryId]?.quantity || 0
    : 0;
  const sellModalAvailableQuantity = sellModalItemId
    ? inventoryItems[sellModalItemId]?.quantity || 0
    : 0;
  const marketItems = useMemo(
    () =>
      Object.entries(marketPrices)
        .map(([id, price]) => ({
          id,
          item: id,
          name: id.startsWith("seed:")
            ? `${formatMarketName(id)} Seeds`
            : formatMarketName(id),
          buy: price.buy,
          sell: price.sell,
          image: getMarketAsset(id),
          isSeed: id.startsWith("seed:"),
          ownedQuantity: inventoryItems[id]?.quantity || 0,
          usesFallbackAsset: !hasMappedMarketAsset(id),
        }))
        .sort((a, b) => {
          if ((b.ownedQuantity > 0) !== (a.ownedQuantity > 0)) {
            return Number(b.ownedQuantity > 0) - Number(a.ownedQuantity > 0);
          }

          if (b.ownedQuantity !== a.ownedQuantity) {
            return b.ownedQuantity - a.ownedQuantity;
          }

          return a.name.localeCompare(b.name);
        }),
    [inventoryItems, marketPrices],
  );
  const normalizedMarketSearch = marketSearchQuery.trim().toLowerCase();
  const liveMarketItems = useMemo(
    () =>
      normalizedMarketSearch
        ? marketItems.filter((item) =>
            `${item.id} ${item.name}`
              .toLowerCase()
              .includes(normalizedMarketSearch),
          )
        : marketItems,
    [marketItems, normalizedMarketSearch],
  );
  const missingMarketAssetIds = useMemo(
    () =>
      marketItems
        .filter((item) => item.usesFallbackAsset)
        .map((item) => item.id),
    [marketItems],
  );
  const filteredInventoryList = useMemo(() => {
    const normalizedSaleSearch = saleSearchQuery.trim().toLowerCase();
    if (!normalizedSaleSearch) {
      return inventoryList;
    }

    return inventoryList.filter((item) =>
      `${item.id} ${formatMarketName(item.id)}`
        .toLowerCase()
        .includes(normalizedSaleSearch),
    );
  }, [inventoryList, saleSearchQuery]);
  const buyModalItem = buyModalItemId
    ? liveMarketItems.find((item) => item.id === buyModalItemId) || null
    : null;
  const buyModalMaxQuantity = buyModalItem
    ? Math.max(1, Math.floor(coins / Math.max(1, buyModalItem.buy)))
    : 1;
  const sellModalItem = sellModalItemId
    ? liveMarketItems.find((item) => item.id === sellModalItemId) || null
    : null;

  // Render merchant/cosmetics
  const handlePurchaseCosmetic = (item: any) => {
    if (coins >= item.price) {
      useGameStore.getState().removeCoins(item.price);
      alert(`Purchased ${item.name}!`);
    } else {
      alert("Not enough coins!");
    }
  };

  const submitSale = async () => {
    if (!selectedInventoryId || saleQuantity <= 0) return;

    const requestId = generateRequestId();
    setActiveMarketActionId(`sell:${selectedInventoryId}`);
    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((message) => {
          if (message.type === "SELL_OK") {
            unsubscribe();
            resolve();
            return;
          }

          if (message.type === "ERROR") {
            unsubscribe();
            reject(new Error(message.message || message.code || "SELL_FAILED"));
          }
        });

        websocketManager
          .send(
            "SELL",
            {
              item: selectedInventoryId,
              quantity: saleQuantity,
              requestId,
            },
            false,
          )
          .catch((error) => {
            unsubscribe();
            reject(error);
          });
      });

      setIsCreatingSale(false);
      setSelectedInventoryId(null);
      setSaleQuantity(0);
      setSalePrice(0);
    } catch (error) {
      Alert.alert("Sell failed", error instanceof Error ? error.message : "Unable to sell item.");
    } finally {
      setActiveMarketActionId(null);
    }
  };

  const handleBuyMarketItem = async (itemId: string, quantity: number) => {
    const currentPrices = useMarketStore.getState().prices;
    const priceEntry = currentPrices[itemId];
    const currentCoins = useGameStore.getState().coins;

    const maxAffordableQuantity = priceEntry
      ? Math.max(1, Math.floor(currentCoins / Math.max(1, priceEntry.buy)))
      : 1;
    const safeQuantity = Math.max(1, Math.min(quantity, maxAffordableQuantity));
    const requestId = generateRequestId();
    setActiveMarketActionId(`buy:${itemId}`);

    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((message) => {
          if (message.type === "BUY_OK") {
            unsubscribe();
            resolve();
            return;
          }

          if (message.type === "ERROR") {
            unsubscribe();
            reject(new Error(message.message || message.code || "BUY_FAILED"));
          }
        });

        websocketManager
          .send(
            "BUY",
            {
              item: itemId,
              quantity: safeQuantity,
              requestId,
            },
            false,
          )
          .catch((error) => {
            unsubscribe();
            reject(error);
          });
      });
      await websocketManager.send("GET_GAME_STATE", undefined, false);
    } catch (error) {
      Alert.alert("Buy failed", error instanceof Error ? error.message : "Unable to buy item.");
    } finally {
      setActiveMarketActionId(null);
    }
  };

  const openBuyModal = useCallback((itemId: string) => {
    const currentPrices = useMarketStore.getState().prices;
    const priceEntry = currentPrices[itemId];
    if (!priceEntry) return;

    const currentCoins = useGameStore.getState().coins;
    const maxAffordableQuantity = Math.max(
      0,
      Math.floor(currentCoins / Math.max(1, priceEntry.buy)),
    );

    setBuyModalItemId(itemId);
    setBuyModalQuantity(Math.max(1, maxAffordableQuantity || 1));
  }, []);

  const handleSellMarketItem = async (itemId: string, quantity: number) => {
    const ownedQuantity = useInventoryStore.getState().items[itemId]?.quantity || 0;
    const safeQuantity = Math.max(1, Math.min(quantity, ownedQuantity));
    if (ownedQuantity <= 0) {
      Alert.alert("Nothing to sell", `You do not have any ${formatMarketName(itemId)} to sell.`);
      return;
    }

    const requestId = generateRequestId();
    setActiveMarketActionId(`sell:${itemId}`);

    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((message) => {
          if (message.type === "SELL_OK") {
            unsubscribe();
            resolve();
            return;
          }

          if (message.type === "ERROR") {
            unsubscribe();
            reject(new Error(message.message || message.code || "SELL_FAILED"));
          }
        });

        websocketManager
          .send(
            "SELL",
            {
              item: itemId,
              quantity: safeQuantity,
              requestId,
            },
            false,
          )
          .catch((error) => {
            unsubscribe();
            reject(error);
          });
      });
      await websocketManager.send("GET_GAME_STATE", undefined, false);
    } catch (error) {
      Alert.alert("Sell failed", error instanceof Error ? error.message : "Unable to sell item.");
    } finally {
      setActiveMarketActionId(null);
    }
  };

  const openSellModal = useCallback((itemId: string) => {
    const ownedQuantity =
      useInventoryStore.getState().items[itemId]?.quantity || 0;
    if (ownedQuantity <= 0) {
      Alert.alert(
        "Nothing to sell",
        `You do not have any ${formatMarketName(itemId)} to sell.`,
      );
      return;
    }

    setSellModalItemId(itemId);
    setSellModalQuantity(1);
  }, []);

  const renderMarketItem = useCallback(
    ({ item }: { item: MarketListItem }) => (
      <MarketItemRow
        item={item}
        isBuying={activeMarketActionId === `buy:${item.id}`}
        isSelling={activeMarketActionId === `sell:${item.id}`}
        onBuy={openBuyModal}
        onSell={openSellModal}
      />
    ),
    [activeMarketActionId, openBuyModal, openSellModal],
  );

  const onSelectSaleItem = useCallback((id: string) => {
    setSelectedInventoryId(id);
    setSaleQuantity(1);
    setSalePrice(10);
  }, []);

  const renderSaleInventoryItem = useCallback(
    ({ item }: { item: { id: string; quantity: number } }) => (
      <SaleInventoryCard
        item={item}
        isSelected={selectedInventoryId === item.id}
        onSelect={onSelectSaleItem}
      />
    ),
    [selectedInventoryId, onSelectSaleItem],
  );

  const submitRequest = () => {
    const cost = requestQuantity * requestPrice;
    if (coins < cost) {
      alert("Not enough coins for Escrow.");
      return;
    }
    useGameStore.getState().removeCoins(cost);
    alert(
      `Requested ${requestQuantity} ${requestItemId} for ${cost} total coins!`,
    );
    setIsCreatingRequest(false);
    setRequestItemId(null);
  };

  // ---------------- RENDERING ----------------

  const renderMerchantTab = () => (
    <View style={styles.listContainer}>
      <Pressable style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Image
            source={coinIcon}
            style={styles.bannerIcon}
            contentFit="contain"
          />
          <View>
            <Text style={styles.bannerTitle}>Need more coins?</Text>
            <Text style={styles.bannerSubtitle}>Visit the Shop</Text>
          </View>
        </View>
        <Text style={styles.bannerArrow}>›</Text>
      </Pressable>

      {COSMETICS_DATA.map((item) => {
        const canAfford = coins >= item.price;
        return (
          <View key={item.id} style={styles.merchantCard}>
            <View style={styles.cardLeft}>
              <Image
                source={item.image}
                style={styles.merchantCover}
                contentFit="contain"
              />
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.eyeIcon}>👁️</Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              {item.tag && (
                <View
                  style={[
                    styles.tagContainer,
                    { backgroundColor: item.tag.bgColor },
                  ]}
                >
                  {item.tag.label === "Popular" && (
                    <Text style={styles.tagStar}>⭐</Text>
                  )}
                  <Text style={[styles.tagText, { color: item.tag.color }]}>
                    {item.tag.label}
                  </Text>
                </View>
              )}
              <Pressable
                style={[
                  styles.buyButton,
                  !canAfford && styles.buyButtonDisabled,
                ]}
                onPress={() => handlePurchaseCosmetic(item)}
              >
                <Text style={styles.buyButtonText}>{item.price}</Text>
                <Image
                  source={coinIcon}
                  style={styles.buyButtonIcon}
                  contentFit="contain"
                />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );

  const marketListHeader = useMemo(
    () => (
      <View style={styles.listContainer}>
        <View style={styles.marketSearchBox}>
          <TextInput
            placeholder="Search market items..."
            style={styles.marketSearchInput}
            value={marketSearchQuery}
            onChangeText={setMarketSearchQuery}
          />
        </View>
        <Text style={styles.marketHintText}>
          Owned items are pinned to the top.
        </Text>
      </View>
    ),
    [marketSearchQuery],
  );

  const renderMySalesTab = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4].map((idx) => (
        <Pressable
          key={idx}
          style={styles.createSaleSlot}
          onPress={() => setIsCreatingSale(true)}
        >
          <Text style={styles.createSalePlus}>+</Text>
          <Text style={styles.createSaleDesc}>Create New Sale</Text>
        </Pressable>
      ))}
      <Pressable style={styles.unlockSlotBadge}>
        <Image
          source={diamondIcon}
          style={styles.unlockDiamond}
          contentFit="contain"
        />
        <Text style={styles.unlockSlotText}>Unlock extra slot</Text>
      </Pressable>
    </View>
  );

  const renderRequestsOpenTab = () => (
    <View style={styles.listContainer}>
      {PLAYER_REQUESTS.map((req) => (
        <View key={req.id} style={styles.requestCard}>
          <View style={styles.requestImageBg}>
            <Image
              source={req.image}
              style={styles.requestCover}
              contentFit="contain"
            />
          </View>
          <View style={styles.requestInfoBox}>
            <View style={styles.requestTitleRow}>
              <Text style={styles.requestTitle}>{req.name}</Text>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>{req.reward}</Text>
                <Image
                  source={coinIcon}
                  style={styles.buyButtonIcon}
                  contentFit="contain"
                />
              </View>
            </View>
            <Text style={styles.requesterName}>{req.requester}</Text>
            <View style={styles.requestProgressRow}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(req.progress / req.required) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.requestProgressText}>
                {req.progress}/{req.required}
              </Text>
              <Text style={styles.forwardArrow}>›</Text>
            </View>
            <Text style={styles.requestTimeText}>{req.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderMyRequestsTab = () => (
    <View style={styles.listContainer}>
      <View style={styles.helperRankCard}>
        <View style={styles.helperHeartCircle}>
          <Text style={styles.helperHeartText}>💜</Text>
        </View>
        <View style={styles.helperCardInfo}>
          <Text style={styles.helperRankTitle}>Helper Rank 1</Text>
          <Text style={styles.helperXP}>0 / 60 XP</Text>
          <Text style={styles.helperNext}>
            Next: 💰 <Text style={styles.helperNextBold}>500 Coins</Text>
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.createSaleSlot}
        onPress={() => {
          setIsCreatingRequest(true);
          setRequestItemId(null);
          setRequestPrice(4);
          setRequestQuantity(1);
        }}
      >
        <Text style={styles.createSalePlus}>+</Text>
        <Text style={styles.createSaleDesc}>Create New Request</Text>
      </Pressable>

      <Pressable style={styles.unlockSlotBadge}>
        <Image
          source={diamondIcon}
          style={styles.unlockDiamond}
          contentFit="contain"
        />
        <Text style={styles.unlockSlotText}>Unlock extra slot</Text>
      </Pressable>
    </View>
  );

  // --- FULL SCREEN MODALS OVERLAYS ---

  if (isCreatingSale) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <View style={styles.createSaleHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => setIsCreatingSale(false)}
            >
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
            <View style={styles.createSaleSearch}>
              <TextInput
                placeholder="Search items..."
                style={styles.createSaleSearchInput}
                value={saleSearchQuery}
                onChangeText={setSaleSearchQuery}
              />
            </View>
          </View>

          <View style={styles.createSaleGridScroll}>
            <FlashList
              data={filteredInventoryList}
              renderItem={renderSaleInventoryItem}
              keyExtractor={saleKeyExtractor}
              extraData={selectedInventoryId}
              numColumns={3}
              contentContainerStyle={styles.createSaleGrid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={InventoryListEmpty}
            />
          </View>

          <View
            style={[
              styles.createSaleBottomPanel,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <Text style={styles.panelLabel}>Quantity</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setSaleQuantity(Math.max(0, saleQuantity - 1))}
              >
                <Text style={styles.stepperIcon}>-</Text>
              </Pressable>
              <View style={styles.stepperInputBox}>
                <Text style={styles.stepperValueText}>{saleQuantity}</Text>
              </View>
              <Pressable
                style={styles.stepperBtn}
                onPress={() =>
                  setSaleQuantity(Math.min(maxSaleQuantity, saleQuantity + 1))
                }
              >
                <Text style={styles.stepperIcon}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.panelLabel}>Price per item</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtnOut}
                onPress={() => setSalePrice(Math.max(0, salePrice - 10))}
              >
                <Text style={styles.stepperIconOut}>«</Text>
              </Pressable>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setSalePrice(Math.max(0, salePrice - 1))}
              >
                <Text style={styles.stepperIcon}>-</Text>
              </Pressable>
              <View style={styles.stepperInputBoxLarge}>
                <Text style={styles.stepperValueText}>{salePrice}</Text>
                <Image
                  source={coinIcon}
                  style={styles.buyButtonIcon}
                  contentFit="contain"
                />
                <Text style={styles.stepperPerItem}>/ item</Text>
              </View>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setSalePrice(salePrice + 1)}
              >
                <Text style={styles.stepperIcon}>+</Text>
              </Pressable>
              <Pressable
                style={styles.stepperBtnOut}
                onPress={() => setSalePrice(salePrice + 10)}
              >
                <Text style={styles.stepperIconOut}>»</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.finalPutSaleBtn,
                (saleQuantity <= 0 || salePrice <= 0) &&
                  styles.finalPutSaleBtnDisabled,
                activeMarketActionId === `sell:${selectedInventoryId}` &&
                  styles.finalPutSaleBtnDisabled,
              ]}
              onPress={submitSale}
              disabled={
                saleQuantity <= 0 ||
                activeMarketActionId === `sell:${selectedInventoryId}`
              }
            >
              <Text style={styles.finalPutSaleBtnText}>
                Sell to treasury
              </Text>
              <Image
                source={coinIcon}
                style={styles.buyButtonIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (isCreatingRequest) {
    const allAssetKeys = Object.keys(ASSET_MAP).filter((k) =>
      k.toLowerCase().includes(requestSearchQuery.toLowerCase()),
    );

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View
          style={[styles.createRequestContainer, { paddingTop: Math.max(insets.top, 20) + 8 }]}
        >
          <View style={styles.reqHeader}>
            <View>
              <Text style={styles.reqTitle}>Post Request</Text>
              <Text style={styles.reqSubtitle}>
                Request items from other players
              </Text>
            </View>
            <Pressable
              style={styles.reqCloseBtn}
              onPress={() => setIsCreatingRequest(false)}
            >
              <Image
                source={closeIconSvg}
                style={styles.reqCloseIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>

          {!requestItemId ? (
            <View style={styles.reqBody}>
              <Text style={styles.reqSectionTitle}>1. Select Item</Text>
              <View style={styles.reqSearchBox}>
                <TextInput
                  placeholder="Search items..."
                  style={styles.reqSearchInput}
                  value={requestSearchQuery}
                  onChangeText={setRequestSearchQuery}
                />
              </View>
              <ScrollView contentContainerStyle={styles.reqScrollList}>
                {allAssetKeys.map((key) => (
                  <Pressable
                    key={key}
                    style={styles.reqListItem}
                    onPress={() => setRequestItemId(key)}
                  >
                    <View style={styles.reqListItemLeft}>
                      <Image
                        source={ASSET_MAP[key]}
                        style={styles.reqListImg}
                        contentFit="contain"
                      />
                      <Text style={styles.reqListText}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.reqListArrow}>›</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.reqBody,
                { paddingBottom: insets.bottom + 40 },
              ]}
            >
              <Text style={styles.reqSectionTitle}>1. Select Item</Text>
              <View style={styles.reqSelectedPill}>
                <Image
                  source={ASSET_MAP[requestItemId]}
                  style={styles.reqSelectedImg}
                  contentFit="contain"
                />
                <Text style={styles.reqSelectedText}>
                  {requestItemId.charAt(0).toUpperCase() +
                    requestItemId.slice(1)}
                </Text>
                <Pressable
                  style={styles.reqCancelSel}
                  onPress={() => setRequestItemId(null)}
                >
                  <Text style={styles.reqCancelText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.reqSectionTitle}>
                2. Your offer (per item)
              </Text>
              <Text style={styles.reqSubText}>
                Minimum 4 coins/item. Tap the amount to type an exact value
              </Text>
              <View style={styles.reqStatsRow}>
                <View style={styles.reqStatPill}>
                  <Text style={styles.reqStatText}>Ø / item 10 </Text>
                  <Image source={coinIcon} style={{ width: 12, height: 12 }} />
                </View>
                <View style={styles.reqStatPill}>
                  <Text style={styles.reqStatText}>Lowest / item 6 </Text>
                  <Image source={coinIcon} style={{ width: 12, height: 12 }} />
                </View>
              </View>

              <View style={styles.reqPriceBigBox}>
                <Text style={styles.reqPriceBigText}>{requestPrice}</Text>
                <Image
                  source={coinIcon}
                  style={styles.reqPriceBigIcon}
                  contentFit="contain"
                />
              </View>

              <View style={styles.reqQuickAddRow}>
                {["+10", "+100", "+1k", "MAX"].map((txt) => (
                  <Pressable
                    key={txt}
                    style={styles.reqQuickAddBtn}
                    onPress={() =>
                      setRequestPrice((p) =>
                        txt === "MAX"
                          ? 500
                          : p +
                            parseInt(txt.replace("k", "000").replace("+", "")),
                      )
                    }
                  >
                    <Text style={styles.reqQuickAddText}>{txt}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.reqSectionTitle}>3. Quantity (1-10)</Text>
              <View style={styles.reqQtyRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    setRequestQuantity(Math.max(1, requestQuantity - 1))
                  }
                >
                  <Text style={styles.stepperIcon}>-</Text>
                </Pressable>
                <Text style={styles.reqQtyText}>{requestQuantity}</Text>
                <Pressable
                  style={[styles.stepperBtn, { backgroundColor: "#BAE4BF" }]}
                  onPress={() =>
                    setRequestQuantity(Math.min(10, requestQuantity + 1))
                  }
                >
                  <Text style={[styles.stepperIcon, { color: "#111" }]}>+</Text>
                </Pressable>
              </View>

              <View style={styles.reqSummaryBox}>
                <Text style={styles.reqSummaryTitle}>Summary</Text>
                <View style={styles.reqSumRow}>
                  <Text style={styles.reqSumLabel}>Total Escrow:</Text>
                  <View style={styles.reqSumRight}>
                    <Text style={styles.reqSumBold}>
                      {requestPrice * requestQuantity}
                    </Text>
                    <Image
                      source={coinIcon}
                      style={styles.buyButtonIcon}
                      contentFit="contain"
                    />
                  </View>
                </View>
                <View style={styles.reqSumDivider} />
                <View style={styles.reqSumMiniRow}>
                  <Text style={styles.reqSumSubLabel}>Your Balance:</Text>
                  <View style={styles.reqSumRight}>
                    <Text style={styles.reqSumSubBold}>{coins}</Text>
                    <Image
                      source={coinIcon}
                      style={styles.buyButtonIcon}
                      contentFit="contain"
                    />
                  </View>
                </View>
                <View style={styles.reqSumMiniRow}>
                  <Text style={styles.reqSumSubLabel}>Expires In:</Text>
                  <Text style={styles.reqSumSubBold}>24 hours</Text>
                </View>
              </View>

              <Pressable style={styles.reqSubmitBtn} onPress={submitRequest}>
                <Text style={styles.reqSubmitBtnText}>
                  Post Request · {requestPrice * requestQuantity}
                </Text>
                <Image
                  source={coinIcon}
                  style={styles.buyButtonIcon}
                  contentFit="contain"
                />
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>
    );
  }

  if (buyModalItem && buyModalItemId) {
    const totalBuyPrice = buyModalItem.buy * buyModalQuantity;
    const canAffordBuy = coins >= totalBuyPrice;

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.sellModalOverlay}>
          <View style={styles.sellModalCard}>
            <Image
              source={buyModalItem.image}
              style={styles.sellModalImage}
              contentFit="contain"
            />
            <Text style={styles.sellModalTitle}>{buyModalItem.name}</Text>
            <Text style={styles.sellModalSubtitle}>Buy Item</Text>

            <View style={styles.sellInfoCard}>
              <View style={styles.sellInfoRow}>
                <Text style={styles.sellInfoLabel}>Your gold:</Text>
                <View style={styles.sellInfoPrice}>
                  <Text style={styles.sellInfoValue}>{coins.toLocaleString()}</Text>
                  <Image
                    source={coinIcon}
                    style={styles.sellInfoCoin}
                    contentFit="contain"
                  />
                </View>
              </View>
              <View style={styles.sellInfoRow}>
                <Text style={styles.sellInfoLabel}>Price per item:</Text>
                <View style={styles.sellInfoPrice}>
                  <Text style={styles.sellInfoValue}>
                    {buyModalItem.buy.toLocaleString()}
                  </Text>
                  <Image
                    source={coinIcon}
                    style={styles.sellInfoCoin}
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sellSectionTitle}>Quantity to Buy</Text>
            <View style={styles.sellStepperRow}>
              <Pressable
                style={styles.sellStepperBtn}
                onPress={() => setBuyModalQuantity((value) => Math.max(1, value - 1))}
              >
                <Text style={styles.sellStepperText}>-</Text>
              </Pressable>
              <TextInput
                value={String(buyModalQuantity)}
                onChangeText={(value) => {
                  const digits = value.replace(/[^\d]/g, "");
                  if (!digits) {
                    setBuyModalQuantity(1);
                    return;
                  }

                  const parsed = Number(digits);
                  setBuyModalQuantity(
                    Math.max(1, Math.min(buyModalMaxQuantity, parsed)),
                  );
                }}
                keyboardType="number-pad"
                style={styles.sellQtyInput}
                textAlign="center"
              />
              <Pressable
                style={[styles.sellStepperBtn, styles.sellStepperBtnActive]}
                onPress={() =>
                  setBuyModalQuantity((value) =>
                    Math.min(buyModalMaxQuantity, value + 1),
                  )
                }
              >
                <Text style={[styles.sellStepperText, styles.sellStepperTextActive]}>+</Text>
              </Pressable>
            </View>

            <View style={styles.sellQuickRow}>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() => setBuyModalQuantity((value) => Math.max(1, value - 10))}
              >
                <Text style={styles.sellQuickBtnText}>-10</Text>
              </Pressable>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() => setBuyModalQuantity(buyModalMaxQuantity)}
              >
                <Text style={styles.sellQuickBtnText}>Max</Text>
              </Pressable>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() =>
                  setBuyModalQuantity((value) =>
                    Math.min(buyModalMaxQuantity, value + 10),
                  )
                }
              >
                <Text style={styles.sellQuickBtnText}>+10</Text>
              </Pressable>
            </View>

            <View style={styles.sellTotalCard}>
              <Text style={styles.sellTotalLabel}>Total Price</Text>
              <View style={styles.sellTotalValueRow}>
                <Text style={styles.sellTotalValue}>{totalBuyPrice.toLocaleString()}</Text>
                <Image
                  source={coinIcon}
                  style={styles.sellTotalCoin}
                  contentFit="contain"
                />
              </View>
            </View>

            <View style={styles.sellActionsRow}>
              <Pressable
                style={[styles.sellActionBtn, styles.sellCloseBtn]}
                onPress={() => setBuyModalItemId(null)}
              >
                <Text style={styles.sellCloseText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sellActionBtn,
                  styles.sellConfirmBtn,
                  (!canAffordBuy ||
                    activeMarketActionId === `buy:${buyModalItemId}`) &&
                    styles.finalPutSaleBtnDisabled,
                ]}
                onPress={async () => {
                  await handleBuyMarketItem(buyModalItemId, buyModalQuantity);
                  setBuyModalItemId(null);
                }}
                disabled={
                  !canAffordBuy || activeMarketActionId === `buy:${buyModalItemId}`
                }
              >
                <Text style={styles.sellConfirmText}>Buy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (sellModalItem && sellModalItemId) {
    const totalSellPrice = sellModalItem.sell * sellModalQuantity;

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.sellModalOverlay}>
          <View style={styles.sellModalCard}>
            <Image
              source={sellModalItem.image}
              style={styles.sellModalImage}
              contentFit="contain"
            />
            <Text style={styles.sellModalTitle}>{sellModalItem.name}</Text>
            <Text style={styles.sellModalSubtitle}>Sell Item</Text>

            <View style={styles.sellInfoCard}>
              <View style={styles.sellInfoRow}>
                <Text style={styles.sellInfoLabel}>Available:</Text>
                <Text style={styles.sellInfoValue}>{sellModalAvailableQuantity}</Text>
              </View>
              <View style={styles.sellInfoRow}>
                <Text style={styles.sellInfoLabel}>Price per item:</Text>
                <View style={styles.sellInfoPrice}>
                  <Text style={styles.sellInfoValue}>
                    {sellModalItem.sell.toLocaleString()}
                  </Text>
                  <Image
                    source={coinIcon}
                    style={styles.sellInfoCoin}
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.sellSectionTitle}>Quantity to Sell</Text>
            <View style={styles.sellStepperRow}>
              <Pressable
                style={styles.sellStepperBtn}
                onPress={() => setSellModalQuantity((value) => Math.max(1, value - 1))}
              >
                <Text style={styles.sellStepperText}>-</Text>
              </Pressable>
              <TextInput
                value={String(sellModalQuantity)}
                onChangeText={(value) => {
                  const digits = value.replace(/[^\d]/g, "");
                  if (!digits) {
                    setSellModalQuantity(1);
                    return;
                  }

                  const parsed = Number(digits);
                  setSellModalQuantity(
                    Math.max(1, Math.min(sellModalAvailableQuantity, parsed)),
                  );
                }}
                keyboardType="number-pad"
                style={styles.sellQtyInput}
                textAlign="center"
              />
              <Pressable
                style={[styles.sellStepperBtn, styles.sellStepperBtnActive]}
                onPress={() =>
                  setSellModalQuantity((value) =>
                    Math.min(sellModalAvailableQuantity, value + 1),
                  )
                }
              >
                <Text style={[styles.sellStepperText, styles.sellStepperTextActive]}>+</Text>
              </Pressable>
            </View>

            <View style={styles.sellQuickRow}>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() => setSellModalQuantity((value) => Math.max(1, value - 10))}
              >
                <Text style={styles.sellQuickBtnText}>-10</Text>
              </Pressable>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() => setSellModalQuantity(sellModalAvailableQuantity)}
              >
                <Text style={styles.sellQuickBtnText}>Max</Text>
              </Pressable>
              <Pressable
                style={styles.sellQuickBtn}
                onPress={() =>
                  setSellModalQuantity((value) =>
                    Math.min(sellModalAvailableQuantity, value + 10),
                  )
                }
              >
                <Text style={styles.sellQuickBtnText}>+10</Text>
              </Pressable>
            </View>

            <View style={styles.sellTotalCard}>
              <Text style={styles.sellTotalLabel}>Total Price</Text>
              <View style={styles.sellTotalValueRow}>
                <Text style={styles.sellTotalValue}>{totalSellPrice.toLocaleString()}</Text>
                <Image
                  source={coinIcon}
                  style={styles.sellTotalCoin}
                  contentFit="contain"
                />
              </View>
            </View>

            <View style={styles.sellActionsRow}>
              <Pressable
                style={[styles.sellActionBtn, styles.sellCloseBtn]}
                onPress={() => setSellModalItemId(null)}
              >
                <Text style={styles.sellCloseText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sellActionBtn,
                  styles.sellConfirmBtn,
                  activeMarketActionId === `sell:${sellModalItemId}` &&
                    styles.finalPutSaleBtnDisabled,
                ]}
                onPress={async () => {
                  await handleSellMarketItem(sellModalItemId, sellModalQuantity);
                  setSellModalItemId(null);
                }}
                disabled={activeMarketActionId === `sell:${sellModalItemId}`}
              >
                <Text style={styles.sellConfirmText}>Sell</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // --- MAIN LAYOUT ---
  if (!visible) return null;

  const showFlashList = topTab === "buy_sell" && buySellTab === "all";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
        {/* Top Tier Segment (Buy & Sell / Requests) */}
        <View style={styles.topTabs}>
          <Pressable
            style={[
              styles.topTabButton,
              topTab === "buy_sell" && styles.topTabButtonActive,
            ]}
            onPress={() => setTopTab("buy_sell")}
          >
            <Text
              style={[
                styles.topTabText,
                topTab === "buy_sell" && styles.topTabTextActive,
              ]}
            >
              Buy & Sell
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.topTabButton,
              topTab === "requests" && styles.topTabButtonActive,
            ]}
            onPress={() => setTopTab("requests")}
          >
            <Text
              style={[
                styles.topTabText,
                topTab === "requests" && styles.topTabTextActive,
              ]}
            >
              Requests
            </Text>
          </Pressable>
        </View>

        {/* Second Tier Segment */}
        {topTab === "buy_sell" ? (
          <View style={styles.segmentedControl}>
            {(["all", "my_sales", "merchant"] as const).map((tab) => {
              const labelMap: Record<string, string> = {
                all: "All",
                my_sales: "My Sales",
                merchant: "Merchant",
              };
              return (
                <Pressable
                  key={tab}
                  style={[
                    styles.segment,
                    buySellTab === tab && styles.segmentActive,
                  ]}
                  onPress={() => setBuySellTab(tab)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      buySellTab === tab && styles.segmentTextActive,
                    ]}
                  >
                    {labelMap[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.segmentedControl}>
            {(["open", "my_requests"] as const).map((tab) => {
              const labelMap: Record<string, string> = {
                open: "Open",
                my_requests: "My Requests",
              };
              return (
                <Pressable
                  key={tab}
                  style={[
                    styles.segment,
                    requestsTab === tab && styles.segmentActive,
                  ]}
                  onPress={() => setRequestsTab(tab)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      requestsTab === tab && styles.segmentTextActive,
                    ]}
                  >
                    {labelMap[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* FlashList as primary scrollable for "all" tab (NOT nested in ScrollView) */}
        {showFlashList ? (
          <View style={styles.flashListContainer}>
            <FlashList
              data={liveMarketItems}
              renderItem={renderMarketItem}
              keyExtractor={marketKeyExtractor}
              extraData={activeMarketActionId}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={marketListHeader}
              ListEmptyComponent={MarketListEmpty}
              contentContainerStyle={styles.flashListContent}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {topTab === "buy_sell" &&
              buySellTab === "merchant" &&
              renderMerchantTab()}
            {topTab === "buy_sell" &&
              buySellTab === "my_sales" &&
              renderMySalesTab()}
            {topTab === "requests" &&
              requestsTab === "open" &&
              renderRequestsOpenTab()}
            {topTab === "requests" &&
              requestsTab === "my_requests" &&
              renderMyRequestsTab()}
          </ScrollView>
        )}

        {/* Floating Close Button */}
        <View
          style={[styles.closeContainer, { paddingBottom: insets.bottom + 20 }]}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Image
              source={closeIconSvg}
              style={styles.closeSvg}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 100 },
  flashListContainer: { flex: 1 },
  flashListContent: { paddingBottom: 100 },
  marketSearchBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  marketSearchInput: {
    fontSize: 16,
    color: "#111",
  },
  marketHintText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7A828A",
    marginBottom: 8,
  },
  marketEmptyState: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A828A",
  },
  topTabs: {
    flexDirection: "row",
    backgroundColor: "#EFF1F5",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 6,
    marginBottom: 12,
  },
  topTabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  topTabButtonActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topTabText: { fontSize: 16, fontWeight: "700", color: "#7A828A" },
  topTabTextActive: { color: "#111" },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: "700", color: "#7A828A" },
  segmentTextActive: { color: "#111" },
  listContainer: { paddingHorizontal: 16, gap: 12 },

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EBF5FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center" },
  bannerIcon: { width: 24, height: 24, marginRight: 12 },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  bannerSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  bannerArrow: { fontSize: 24, color: "#555", fontWeight: "300" },

  // Merchant Cards
  merchantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 16,
    padding: 16,
  },
  merchantCover: { width: 48, height: 48, marginRight: 16 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginRight: 6 },
  eyeIcon: { fontSize: 14, opacity: 0.6 },
  cardDesc: { fontSize: 13, color: "#777", marginTop: 4, lineHeight: 18 },
  cardRight: { alignItems: "flex-end", justifyContent: "center" },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagStar: { fontSize: 10, marginRight: 4 },
  tagText: { fontSize: 10, fontWeight: "800" },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buyButtonDisabled: { opacity: 0.5 },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
    marginRight: 6,
  },
  buyButtonIcon: { width: 16, height: 16 },

  // Sales
  playerSaleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  saleItemCover: { width: 40, height: 40, marginRight: 16 },
  saleItemTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  saleItemQty: { color: "#7BC47F" },
  sellerName: { fontSize: 13, color: "#999", marginTop: 4 },
  salePriceBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  marketPriceColumn: {
    gap: 8,
    alignItems: "flex-end",
  },
  salePriceLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7A828A",
    marginRight: 6,
  },
  salePriceText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginRight: 6,
  },
  createSaleSlot: {
    borderWidth: 2,
    borderColor: "#EAEAEA",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  createSalePlus: { fontSize: 24, color: "#BBB", marginRight: 10 },
  createSaleDesc: { fontSize: 15, fontWeight: "700", color: "#999" },
  unlockSlotBadge: {
    borderWidth: 2,
    borderColor: "#F3C546",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#FFFAEE",
  },
  unlockDiamond: { width: 20, height: 20, marginRight: 10 },
  unlockSlotText: { fontSize: 15, fontWeight: "800", color: "#E2A422" },

  // Requests
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 16,
    padding: 16,
  },
  requestImageBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FDF9F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  requestCover: { width: 40, height: 40 },
  requestInfoBox: { flex: 1 },
  requestTitleRow: { flexDirection: "row", alignItems: "center" },
  requestTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginRight: 8,
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4F4E4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2C8C4E",
    marginRight: 4,
  },
  requesterName: { fontSize: 13, color: "#999", marginTop: 4, marginBottom: 8 },
  requestProgressRow: { flexDirection: "row", alignItems: "center" },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#F2F2F2",
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: { height: 6, backgroundColor: "#D3D3D3", borderRadius: 3 },
  requestProgressText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginRight: 12,
  },
  forwardArrow: { fontSize: 18, color: "#999", fontWeight: "300" },
  requestTimeText: { fontSize: 12, color: "#A0A0A0", marginTop: 6 },

  helperRankCard: {
    backgroundColor: "#F9F5FF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFE5FD",
  },
  helperHeartCircle: {
    width: 40,
    height: 40,
    backgroundColor: "#F0E1FF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  helperHeartText: { fontSize: 20 },
  helperCardInfo: { flex: 1 },
  helperRankTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  helperXP: { fontSize: 13, color: "#666", marginVertical: 4 },
  helperNext: { fontSize: 13, color: "#888" },
  helperNextBold: { fontWeight: "700", color: "#7E57C2" },

  // Setup subviews elements shared
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnOut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  stepperIcon: { fontSize: 24, color: "#AAADB0", fontWeight: "300" },
  stepperIconOut: { fontSize: 20, color: "#C0C3C6" },

  // Create Sale View
  createSaleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: { padding: 8, marginRight: 8 },
  backArrow: { fontSize: 32, color: "#333", lineHeight: 32 },
  createSaleSearch: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: "center",
  },
  createSaleSearchInput: { fontSize: 16 },
  createSaleGridScroll: { flex: 1 },
  createSaleGrid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  invItemCard: {
    width: "30%",
    aspectRatio: 0.9,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  invItemCardSelected: {
    borderColor: "#7BC47F",
    backgroundColor: "#F0F9F0",
    borderWidth: 2,
  },
  invItemImage: { width: 44, height: 44, marginBottom: 8 },
  invItemTitle: { fontSize: 13, fontWeight: "800", color: "#333" },
  invItemCount: { fontSize: 12, color: "#888", marginTop: 2 },
  createSaleBottomPanel: {
    borderTopWidth: 1,
    borderTopColor: "#EBEBEB",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  panelLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepperInputBox: {
    borderWidth: 2,
    borderColor: "#7BC47F",
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  stepperInputBoxLarge: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#7BC47F",
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  stepperValueText: { fontSize: 18, fontWeight: "800", color: "#111" },
  stepperPerItem: { fontSize: 14, color: "#777", marginLeft: 6 },
  finalPutSaleBtn: {
    backgroundColor: "#BAE4BF",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  finalPutSaleBtnDisabled: { opacity: 0.5 },
  finalPutSaleBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    marginRight: 8,
  },

  // Create Request View
  createRequestContainer: { flex: 1, backgroundColor: "#F4F7FB" }, // Slight blueish tint as per design
  reqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  reqTitle: { fontSize: 24, fontWeight: "900", color: "#111" },
  reqSubtitle: { fontSize: 14, color: "#777", marginTop: 4 },
  reqCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reqCloseIcon: { width: 16, height: 16, tintColor: "#111" },
  reqBody: { paddingHorizontal: 20 },
  reqSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
    marginTop: 16,
  },
  reqSearchBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EDEDED",
    marginBottom: 12,
  },
  reqSearchInput: { fontSize: 16, color: "#333" },
  reqScrollList: { paddingBottom: 60 },
  reqListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  reqListItemLeft: { flexDirection: "row", alignItems: "center" },
  reqListImg: { width: 40, height: 40, marginRight: 16 },
  reqListText: { fontSize: 16, fontWeight: "700", color: "#333" },
  reqListArrow: { fontSize: 24, color: "#999" },

  reqSelectedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8ED",
    borderWidth: 1,
    borderColor: "#AEDCA8",
    borderRadius: 16,
    padding: 12,
    alignSelf: "flex-start",
  },
  reqSelectedImg: { width: 28, height: 28, marginRight: 12 },
  reqSelectedText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginRight: 24,
  },
  reqCancelSel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  reqCancelText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  reqSubText: { fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 18 },
  reqStatsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  reqStatPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  reqStatText: { fontSize: 12, fontWeight: "600", color: "#555" },
  reqPriceBigBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 16,
  },
  reqPriceBigText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginRight: 8,
  },
  reqPriceBigIcon: { width: 20, height: 20 },
  reqQuickAddRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  reqQuickAddBtn: {
    backgroundColor: "#EBF8ED",
    borderWidth: 1,
    borderColor: "#AEDCA8",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reqQuickAddText: { fontSize: 14, fontWeight: "800", color: "#4EA857" },
  reqQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  reqQtyText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    marginHorizontal: 32,
  },
  reqSummaryBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
    marginTop: 16,
    marginBottom: 24,
  },
  reqSummaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  reqSumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reqSumLabel: { fontSize: 15, fontWeight: "800", color: "#111" },
  reqSumRight: { flexDirection: "row", alignItems: "center" },
  reqSumBold: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111",
    marginRight: 6,
  },
  reqSumDivider: { height: 1, backgroundColor: "#EAEAEA", marginBottom: 12 },
  reqSumMiniRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reqSumSubLabel: { fontSize: 13, color: "#888" },
  reqSumSubBold: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
    marginRight: 4,
  },
  reqSubmitBtn: {
    backgroundColor: "#7EBE82",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reqSubmitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    marginRight: 8,
  },

  closeContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  closeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  closeSvg: { width: 24, height: 24, tintColor: "#FFF" },
  sellModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  sellModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  sellModalImage: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginBottom: 8,
  },
  sellModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E5B26",
    textAlign: "center",
  },
  sellModalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  sellInfoCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sellInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellInfoLabel: {
    fontSize: 14,
    color: "#666",
  },
  sellInfoValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },
  sellInfoPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sellInfoCoin: {
    width: 16,
    height: 16,
  },
  sellSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
    marginTop: 22,
    marginBottom: 14,
  },
  sellStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sellStepperBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F4F4F4",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  sellStepperBtnActive: {
    backgroundColor: "#F3FFF3",
    borderColor: "#8AD08A",
  },
  sellStepperText: {
    fontSize: 28,
    color: "#B6B6B6",
    fontWeight: "300",
    lineHeight: 30,
  },
  sellStepperTextActive: {
    color: "#71B312",
  },
  sellQtyInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8AD08A",
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    backgroundColor: "#FFF",
  },
  sellQuickRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  sellQuickBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F3FFF3",
    borderWidth: 1,
    borderColor: "#CBEBCB",
    alignItems: "center",
    justifyContent: "center",
  },
  sellQuickBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#71B312",
  },
  sellTotalCard: {
    backgroundColor: "#F1FFF1",
    borderRadius: 16,
    marginTop: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  sellTotalLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  sellTotalValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellTotalValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1E5B26",
  },
  sellTotalCoin: {
    width: 24,
    height: 24,
  },
  sellActionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 20,
  },
  sellActionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sellCloseBtn: {
    backgroundColor: "#F3F3F3",
  },
  sellConfirmBtn: {
    backgroundColor: "#7BC47F",
  },
  sellCloseText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#444",
  },
  sellConfirmText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
});
