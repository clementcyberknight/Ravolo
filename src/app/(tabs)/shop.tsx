import { ScreenHeader } from "@/components/screen-header";
import {
  ItemPrice,
  SectionHeader,
  ShopBadge,
} from "@/components/shop/shop-components";
import { SubTabs } from "@/components/sub-tabs";
import { ThemedView } from "@/components/themed-view";
import {
  BUNDLES,
  coinIcon,
  DAILY_DEALS,
  FLASH_SALE_ITEMS,
  hourglassIcon,
  SEED_PACKS,
  ShopItem,
  TOKEN_PACKS,
  TokenPack,
} from "@/constants/shop-data";
import { Fonts } from "@/constants/theme";
import { useCountdown } from "@/hooks/use-countdown";
import { useDebounce } from "@/hooks/use-debounce";
import { useGameStore } from "@/store/game-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useMarketStore } from "@/store/market-store";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Search } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// --- THEME COLORS ---
const D = "#032018"; // Dark Green
const L = "#DAF8B7"; // Light Green
const W = "#FFFFFF"; // White
const R = "#FF383C"; // Ravolo Red
const G = "#71B312"; // Ravolo Green

type TabType = "featured" | "seeds" | "tokens";

const SHOP_TABS = [
  { id: "featured", label: "FEATURED" },
  { id: "seeds", label: "SEEDS" },
  { id: "tokens", label: "TOKENS" },
];

export default function ShopScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("featured");
  const { coins, removeCoins, addCoins } = useGameStore();
  const { addResource } = useInventoryStore();
  const prices = useMarketStore((state) => state.prices);

  const flashSaleTimer = useCountdown(3600 * 2 + 15 * 60); // 2h 15m
  const dailyDealsTimer = useCountdown(3600 * 18 + 45 * 60); // 18h 45m

  const handleBuy = useDebounce((item: ShopItem) => {
    if (coins < item.price) {
      // In a real app we'd show a toast here
      console.log("Not enough coins!");
      return;
    }
    removeCoins(item.price);
    addResource(item.resourceId, item.resourceType, item.qty);
    console.log(`Purchased ${item.qty} ${item.name}`);
  }, 300);

  const handleClaimFree = useDebounce(() => {
    addCoins(10);
    console.log("Claimed free daily reward!");
  }, 300);

  const resolveServerPrice = useCallback(
    (item: ShopItem, mode: "seed" | "goods") => {
      const serverKey =
        mode === "seed" ? `seed:${item.resourceId}` : item.resourceId;
      return prices[serverKey] ?? item.price;
    },
    [prices],
  );

  const renderFeaturedItem = useCallback(
    ({ item }: { item: ShopItem }) => (
      <Pressable style={styles.featuredCard} onPress={() => handleBuy(item)}>
        <View style={styles.cardHeader}>
          {item.pct && <ShopBadge text={`-${item.pct}%`} />}
          <Text style={styles.itemQty}>{item.qty}x</Text>
        </View>
        <Image source={item.img} style={styles.itemImg} resizeMode="contain" />
        <Text style={styles.itemNameText}>{item.name}</Text>
        <ItemPrice
          price={resolveServerPrice(item, "goods")}
          oldPrice={item.oldPrice}
        />
      </Pressable>
    ),
    [handleBuy, resolveServerPrice],
  );

  const renderSeedItem = useCallback(
    ({ item }: { item: ShopItem }) => (
      <Pressable style={styles.seedCard} onPress={() => handleBuy(item)}>
        {item.tag && (
          <View style={styles.seedBadgePos}>
            <ShopBadge text={item.tag} color={D} />
          </View>
        )}
        <View style={styles.seedCardContent}>
          <Image
            source={item.img}
            style={styles.seedImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.seedQtyText}>{item.qty}x</Text>
            <Text style={styles.seedNameText}>{item.name} Seeds</Text>
            <ItemPrice
              price={resolveServerPrice(item, "seed")}
              oldPrice={item.oldPrice}
            />
          </View>
        </View>
      </Pressable>
    ),
    [handleBuy, resolveServerPrice],
  );

  const renderTokenPack = useCallback(
    ({ item }: { item: TokenPack }) => (
      <Pressable style={styles.tokenCard}>
        <View style={styles.tokenCardLeft}>
          <Image
            source={coinIcon}
            style={styles.tokenPackIcon}
            resizeMode="contain"
          />
          <View>
            <View style={styles.tokenAmountRow}>
              <Text style={styles.tokenAmountText}>{item.amount}</Text>
              {item.tag && (
                <ShopBadge
                  text={item.tag}
                  color={item.tag === "BEST" ? G : R}
                />
              )}
            </View>
            <Text style={styles.tokenDescText}>Ravolo Tokens</Text>
          </View>
        </View>
        <ItemPrice price={item.price} oldPrice={item.oldPrice} isToken />
      </Pressable>
    ),
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        {/* HEADER */}
        <ScreenHeader
          title="SHOP"
          renderRight={() => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.searchBtn}>
                <Search size={18} color={D} />
              </TouchableOpacity>
            </View>
          )}
        />

        {/* TABS */}
        <SubTabs
          tabs={SHOP_TABS}
          activeTabId={activeTab}
          onTabPress={(id) => setActiveTab(id as TabType)}
        />

        {activeTab === "featured" && (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* FLASH SALE */}
            <SectionHeader
              title="FLASH SALE"
              subtitle={`ENDS IN ${flashSaleTimer.format}`}
              icon={hourglassIcon}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContainer}
            >
              {FLASH_SALE_ITEMS.map((item) => (
                <React.Fragment key={item.id}>
                  {renderFeaturedItem({ item })}
                </React.Fragment>
              ))}
            </ScrollView>

            {/* DAILY DEALS */}
            <View style={{ marginTop: 24 }}>
              <SectionHeader
                title="DAILY DEALS"
                subtitle={`RESET IN ${dailyDealsTimer.format}`}
                icon={hourglassIcon}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContainer}
              >
                {DAILY_DEALS.map((item) => (
                  <React.Fragment key={item.id}>
                    {renderFeaturedItem({ item })}
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>

            {/* BONUS & BUNDLES */}
            <View style={styles.bundlesContainer}>
              {/* FREE DAILY */}
              <Pressable style={styles.bonusCard} onPress={handleClaimFree}>
                <View>
                  <Text style={styles.bonusTitle}>FREE DAILY REWARD</Text>
                  <Text style={styles.bonusDesc}>Claim your daily tokens</Text>
                  <View
                    style={[
                      styles.pricePill,
                      {
                        backgroundColor: G,
                        marginTop: 12,
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text style={styles.priceText}>FREE</Text>
                  </View>
                </View>
                <Image source={coinIcon} style={styles.bonusImg} />
              </Pressable>

              <SectionHeader title="EXCLUSIVE BUNDLES" />
              {BUNDLES.map((bundle) => (
                <Pressable key={bundle.id} style={styles.bundleCard}>
                  <View style={styles.bundleHeader}>
                    <View style={styles.bundleInfo}>
                      <Text style={styles.bundleName}>{bundle.name}</Text>
                      <ShopBadge text={`SAVE ${bundle.pct}%`} color={D} />
                    </View>
                    <ItemPrice
                      price={bundle.price}
                      oldPrice={bundle.oldPrice}
                    />
                  </View>
                  <View style={styles.bundleItemsRow}>
                    {bundle.items.map((it, idx) => (
                      <View key={idx} style={styles.bundleItem}>
                        <Image source={it.img} style={styles.miniItemImg} />
                        <Text style={styles.miniItemLabel}>{it.label}</Text>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.viewBundleBtn}>
                      <ChevronRight size={16} color={D} />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {activeTab === "seeds" && (
          <View style={styles.listContainer}>
            <FlashList
              data={SEED_PACKS}
              renderItem={renderSeedItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              //@ts-ignore
              estimatedItemSize={100}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
          </View>
        )}

        {activeTab === "tokens" && (
          <View style={styles.listContainer}>
            <FlashList
              data={TOKEN_PACKS}
              renderItem={renderTokenPack}
              keyExtractor={(item) => item.id}
              //@ts-ignore
              estimatedItemSize={80}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(3, 32, 24, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 6,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  balanceText: {
    color: W,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.mono,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: "rgba(3, 32, 24, 0.05)",
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  horizontalScrollContainer: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 20, // ensure last item isn't flush with edge
  },
  featuredCard: {
    width: (width - 64) / 3,
    backgroundColor: W,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    minHeight: 16,
  },
  itemQty: {
    fontSize: 8,
    fontWeight: "700",
    color: D,
    opacity: 0.4,
    fontFamily: Fonts.mono,
  },
  itemImg: {
    width: 48,
    height: 48,
    marginVertical: 8,
  },
  itemNameText: {
    fontSize: 10,
    fontWeight: "700",
    color: D,
    marginBottom: 4,
    fontFamily: Fonts.mono,
  },
  listContainer: {
    flex: 1,
  },
  seedCard: {
    flex: 1,
    margin: 6,
    backgroundColor: W,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  seedCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seedBadgePos: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  seedImg: {
    width: 40,
    height: 40,
  },
  seedQtyText: {
    fontSize: 8,
    fontWeight: "700",
    color: D,
    opacity: 0.4,
    fontFamily: Fonts.mono,
  },
  seedNameText: {
    fontSize: 11,
    fontWeight: "700",
    color: D,
    marginBottom: 2,
    fontFamily: Fonts.mono,
  },
  tokenCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: W,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  tokenCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tokenPackIcon: {
    width: 32,
    height: 32,
  },
  tokenAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tokenAmountText: {
    fontSize: 16,
    fontWeight: "800",
    color: D,
    fontFamily: Fonts.mono,
  },
  tokenDescText: {
    fontSize: 10,
    color: D,
    opacity: 0.4,
    fontFamily: Fonts.mono,
  },
  bundlesContainer: {
    marginTop: 32,
    gap: 16,
  },
  bonusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: D,
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
  },
  bonusTitle: {
    color: G,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: Fonts.mono,
  },
  bonusDesc: {
    color: W,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
    fontFamily: Fonts.mono,
  },
  bonusImg: {
    width: 64,
    height: 64,
  },
  bundleCard: {
    backgroundColor: W,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  bundleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bundleInfo: {
    gap: 4,
  },
  bundleName: {
    fontSize: 14,
    fontWeight: "700",
    color: D,
    fontFamily: Fonts.mono,
  },
  bundleItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bundleItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: L,
    alignItems: "center",
    justifyContent: "center",
  },
  miniItemImg: {
    width: 24,
    height: 24,
  },
  miniItemLabel: {
    position: "absolute",
    bottom: 2,
    right: 4,
    fontSize: 6,
    fontWeight: "800",
    color: D,
    fontFamily: Fonts.mono,
  },
  viewBundleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: L,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  pricePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  priceText: {
    color: W,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: Fonts.mono,
  },
});
