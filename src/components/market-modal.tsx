import { Image } from "expo-image";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGameStore } from "@/stores/game-store";
import { useInventoryStore } from "@/stores/inventory-store";
import { ASSET_MAP } from "@/components/inventory-modal";

const coinIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");
const diamondIcon = require("@/assets/image/assets_images_icons_misc_diamonds.webp");
const closeIconSvg = require("@/assets/icons/x-close.svg");

// ------------------------ MOCK DATA ------------------------
const PLAYER_SALES = [
  { id: "s1", item: "corn", name: "Corn", quantity: 10, price: 90, seller: "Dukat", image: require("@/assets/image/assets_images_icons_crops_corn.webp") },
  { id: "s2", item: "carrot", name: "Carrot", quantity: 10, price: 60, seller: "Dukat", image: require("@/assets/image/assets_images_icons_crops_carrot.webp") },
  { id: "s3", item: "cornbread", name: "Cornbread", quantity: 10, price: 2100, seller: "Demash", image: require("@/assets/image/assets_images_icons_crafts_cornbread.webp") },
  { id: "s4", item: "rope", name: "Rope", quantity: 1, price: 4400, seller: "Danny", image: require("@/assets/image/assets_images_icons_rare_rope.webp") },
  { id: "s5", item: "leather_strap", name: "Leather Strap", quantity: 10, price: 18000, seller: "Getout", image: require("@/assets/image/assets_images_icons_rare_leather_strap.webp") },
  { id: "s6", item: "plank", name: "Plank", quantity: 10, price: 33000, seller: "Getout", image: require("@/assets/image/assets_images_icons_rare_plank.webp") },
];

const PLAYER_REQUESTS = [
  { id: "r1", item: "nails", name: "Nails", reward: 700, requester: "Mumblemonster", progress: 0, required: 10, time: "Ends in 23h 59m", image: require("@/assets/image/assets_images_icons_rare_nails.webp") },
  { id: "r2", item: "iron_bar", name: "Iron Bar", reward: 910, requester: "Farmer#53015", progress: 0, required: 10, time: "Ends in 23h 56m", image: require("@/assets/image/assets_images_icons_rare_iron_bar.webp") },
];

const COSMETICS_DATA = [
  { id: "border_golden", name: "Golden Harvest Border", description: "A shimmering golden frame", price: 500, image: require("@/assets/image/assets_images_icons_avatarborder_border_golden_harvest.webp"), tag: { label: "Popular", color: "#B8860B", bgColor: "#FFF8DC" } },
  { id: "border_emerald", name: "Emerald Vine Border", description: "Lush green vines wrap your profile", price: 350, image: require("@/assets/image/assets_images_icons_avatarborder_border_emerald_vine.webp") },
  { id: "border_rustic", name: "Rustic Barn Border", description: "Weathered wood planks from the old barn", price: 250, image: require("@/assets/image/assets_images_icons_avatarborder_border_rustic_barn.webp") },
  { id: "bg_golden_meadow", name: "Golden Meadow", description: "Warm sunset hues over rolling fields", price: 500, image: require("@/assets/image/assets_images_farmmap_backgrounds_goldenmeadowbg.webp"), tag: { label: "New", color: "#0066CC", bgColor: "#E6F0FA" } },
  { id: "bg_misty", name: "Misty Morning", description: "Peaceful fog drifts across your farm at dawn", price: 450, image: require("@/assets/image/assets_images_farmmap_backgrounds_mistymorningbg.webp") },
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
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(0);
  const [salePrice, setSalePrice] = useState(0);

  // Create Request State
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [requestItemId, setRequestItemId] = useState<string | null>(null);
  const [requestPrice, setRequestPrice] = useState(4);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  const coins = useGameStore((state) => state.coins);
  const removeCoins = useGameStore((state) => state.removeCoins);
  const addCoins = useGameStore((state) => state.addCoins);
  
  const inventoryItems = useInventoryStore((state) => state.items);
  const inventoryList = Object.values(inventoryItems).filter(item => item.quantity > 0);
  const maxSaleQuantity = selectedInventoryId ? inventoryItems[selectedInventoryId]?.quantity || 0 : 0;

  // Render merchant/cosmetics
  const handlePurchaseCosmetic = (item: any) => {
    if (coins >= item.price) {
      removeCoins(item.price);
      alert(`Purchased ${item.name}!`);
    } else {
      alert("Not enough coins!");
    }
  };

  const submitSale = () => {
    if (!selectedInventoryId || saleQuantity <= 0 || salePrice <= 0) return;
    useInventoryStore.getState().removeResource(selectedInventoryId, saleQuantity);
    alert(`Listed ${saleQuantity} ${selectedInventoryId} for ${saleQuantity * salePrice} coins!`);
    setIsCreatingSale(false);
  };

  const submitRequest = () => {
    const cost = requestQuantity * requestPrice;
    if (coins < cost) {
      alert("Not enough coins for Escrow.");
      return;
    }
    removeCoins(cost);
    alert(`Requested ${requestQuantity} ${requestItemId} for ${cost} total coins!`);
    setIsCreatingRequest(false);
    setRequestItemId(null);
  };

  // ---------------- RENDERING ----------------

  const renderMerchantTab = () => (
    <View style={styles.listContainer}>
      <Pressable style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Image source={coinIcon} style={styles.bannerIcon} contentFit="contain" />
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
              <Image source={item.image} style={styles.merchantCover} contentFit="contain" />
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.eyeIcon}>👁️</Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              {item.tag && (
                <View style={[styles.tagContainer, { backgroundColor: item.tag.bgColor }]}>
                  {item.tag.label === "Popular" && <Text style={styles.tagStar}>⭐</Text>}
                  <Text style={[styles.tagText, { color: item.tag.color }]}>{item.tag.label}</Text>
                </View>
              )}
              <Pressable 
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]} 
                onPress={() => handlePurchaseCosmetic(item)}
              >
                <Text style={styles.buyButtonText}>{item.price}</Text>
                <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderAllSalesTab = () => (
    <View style={styles.listContainer}>
      {PLAYER_SALES.map(sale => (
        <View key={sale.id} style={styles.playerSaleCard}>
          <View style={styles.cardLeft}>
            <Image source={sale.image} style={styles.saleItemCover} contentFit="contain" />
            <View style={styles.cardInfo}>
              <Text style={styles.saleItemTitle}>
                {sale.name} <Text style={styles.saleItemQty}>x{sale.quantity}</Text>
              </Text>
              <Text style={styles.sellerName}>{sale.seller}</Text>
            </View>
          </View>
          <View style={styles.salePriceBox}>
            <Text style={styles.salePriceText}>{sale.price.toLocaleString()}</Text>
            <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
          </View>
        </View>
      ))}
    </View>
  );

  const renderMySalesTab = () => (
    <View style={styles.listContainer}>
      {[1, 2, 3, 4].map(idx => (
        <Pressable key={idx} style={styles.createSaleSlot} onPress={() => setIsCreatingSale(true)}>
          <Text style={styles.createSalePlus}>+</Text>
          <Text style={styles.createSaleDesc}>Create New Sale</Text>
        </Pressable>
      ))}
      <Pressable style={styles.unlockSlotBadge}>
        <Image source={diamondIcon} style={styles.unlockDiamond} contentFit="contain" />
        <Text style={styles.unlockSlotText}>Unlock extra slot</Text>
      </Pressable>
    </View>
  );

  const renderRequestsOpenTab = () => (
    <View style={styles.listContainer}>
      {PLAYER_REQUESTS.map(req => (
        <View key={req.id} style={styles.requestCard}>
          <View style={styles.requestImageBg}>
            <Image source={req.image} style={styles.requestCover} contentFit="contain" />
          </View>
          <View style={styles.requestInfoBox}>
            <View style={styles.requestTitleRow}>
              <Text style={styles.requestTitle}>{req.name}</Text>
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>{req.reward}</Text>
                <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
              </View>
            </View>
            <Text style={styles.requesterName}>{req.requester}</Text>
            <View style={styles.requestProgressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(req.progress / req.required) * 100}%` }]} />
              </View>
              <Text style={styles.requestProgressText}>{req.progress}/{req.required}</Text>
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
          <Text style={styles.helperNext}>Next: 💰 <Text style={styles.helperNextBold}>500 Coins</Text></Text>
        </View>
      </View>

      <Pressable style={styles.createSaleSlot} onPress={() => {
        setIsCreatingRequest(true);
        setRequestItemId(null);
        setRequestPrice(4);
        setRequestQuantity(1);
      }}>
        <Text style={styles.createSalePlus}>+</Text>
        <Text style={styles.createSaleDesc}>Create New Request</Text>
      </Pressable>

      <Pressable style={styles.unlockSlotBadge}>
        <Image source={diamondIcon} style={styles.unlockDiamond} contentFit="contain" />
        <Text style={styles.unlockSlotText}>Unlock extra slot</Text>
      </Pressable>
    </View>
  );

  // --- FULL SCREEN MODALS OVERLAYS ---
  
  if (isCreatingSale) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.createSaleHeader}>
            <Pressable style={styles.backButton} onPress={() => setIsCreatingSale(false)}>
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
            <View style={styles.createSaleSearch}>
              <TextInput placeholder="Search items..." style={styles.createSaleSearchInput} />
            </View>
          </View>

          <ScrollView style={styles.createSaleGridScroll}>
            <View style={styles.createSaleGrid}>
              {inventoryList.map(item => {
                 const isSelected = selectedInventoryId === item.id;
                 const asset = ASSET_MAP[item.id] || coinIcon;
                 return (
                   <Pressable 
                     key={item.id} 
                     style={[styles.invItemCard, isSelected && styles.invItemCardSelected]}
                     onPress={() => {
                        setSelectedInventoryId(item.id);
                        setSaleQuantity(1);
                        setSalePrice(10); 
                     }}
                   >
                     <Image source={asset} style={styles.invItemImage} contentFit="contain" />
                     <Text style={styles.invItemTitle}>{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</Text>
                     <Text style={styles.invItemCount}>x{item.quantity}</Text>
                   </Pressable>
                 )
              })}
            </View>
          </ScrollView>

          <View style={[styles.createSaleBottomPanel, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.panelLabel}>Quantity</Text>
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepperBtn} onPress={() => setSaleQuantity(Math.max(0, saleQuantity - 1))}>
                <Text style={styles.stepperIcon}>-</Text>
              </Pressable>
              <View style={styles.stepperInputBox}>
                <Text style={styles.stepperValueText}>{saleQuantity}</Text>
              </View>
              <Pressable style={styles.stepperBtn} onPress={() => setSaleQuantity(Math.min(maxSaleQuantity, saleQuantity + 1))}>
                <Text style={styles.stepperIcon}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.panelLabel}>Price per item</Text>
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepperBtnOut} onPress={() => setSalePrice(Math.max(0, salePrice - 10))}>
                <Text style={styles.stepperIconOut}>«</Text>
              </Pressable>
              <Pressable style={styles.stepperBtn} onPress={() => setSalePrice(Math.max(0, salePrice - 1))}>
                <Text style={styles.stepperIcon}>-</Text>
              </Pressable>
              <View style={styles.stepperInputBoxLarge}>
                <Text style={styles.stepperValueText}>{salePrice}</Text>
                <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
                <Text style={styles.stepperPerItem}>/ item</Text>
              </View>
              <Pressable style={styles.stepperBtn} onPress={() => setSalePrice(salePrice + 1)}>
                <Text style={styles.stepperIcon}>+</Text>
              </Pressable>
              <Pressable style={styles.stepperBtnOut} onPress={() => setSalePrice(salePrice + 10)}>
                <Text style={styles.stepperIconOut}>»</Text>
              </Pressable>
            </View>

            <Pressable 
              style={[styles.finalPutSaleBtn, (saleQuantity <= 0 || salePrice <= 0) && styles.finalPutSaleBtnDisabled]}
              onPress={submitSale}
            >
              <Text style={styles.finalPutSaleBtnText}>Put on sale for {saleQuantity * salePrice}</Text>
              <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (isCreatingRequest) {
    const allAssetKeys = Object.keys(ASSET_MAP).filter(k => k.toLowerCase().includes(requestSearchQuery.toLowerCase()));

    return (
      <Modal visible={visible} transparent animationType="slide">
         <View style={[styles.createRequestContainer, { paddingTop: insets.top }]}>
           <View style={styles.reqHeader}>
             <View>
               <Text style={styles.reqTitle}>Post Request</Text>
               <Text style={styles.reqSubtitle}>Request items from other players</Text>
             </View>
             <Pressable style={styles.reqCloseBtn} onPress={() => setIsCreatingRequest(false)}>
               <Image source={closeIconSvg} style={styles.reqCloseIcon} contentFit="contain" />
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
                  {allAssetKeys.map(key => (
                    <Pressable key={key} style={styles.reqListItem} onPress={() => setRequestItemId(key)}>
                      <View style={styles.reqListItemLeft}>
                        <Image source={ASSET_MAP[key]} style={styles.reqListImg} contentFit="contain" />
                        <Text style={styles.reqListText}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                      </View>
                      <Text style={styles.reqListArrow}>›</Text>
                    </Pressable>
                  ))}
                </ScrollView>
             </View>
           ) : (
             <ScrollView contentContainerStyle={[styles.reqBody, { paddingBottom: insets.bottom + 40 }]}>
                <Text style={styles.reqSectionTitle}>1. Select Item</Text>
                <View style={styles.reqSelectedPill}>
                  <Image source={ASSET_MAP[requestItemId]} style={styles.reqSelectedImg} contentFit="contain" />
                  <Text style={styles.reqSelectedText}>{requestItemId.charAt(0).toUpperCase() + requestItemId.slice(1)}</Text>
                  <Pressable style={styles.reqCancelSel} onPress={() => setRequestItemId(null)}>
                    <Text style={styles.reqCancelText}>×</Text>
                  </Pressable>
                </View>

                <Text style={styles.reqSectionTitle}>2. Your offer (per item)</Text>
                <Text style={styles.reqSubText}>Minimum 4 coins/item. Tap the amount to type an exact value</Text>
                <View style={styles.reqStatsRow}>
                  <View style={styles.reqStatPill}><Text style={styles.reqStatText}>Ø / item 10 </Text><Image source={coinIcon} style={{ width: 12, height: 12 }} /></View>
                  <View style={styles.reqStatPill}><Text style={styles.reqStatText}>Lowest / item 6 </Text><Image source={coinIcon} style={{ width: 12, height: 12 }} /></View>
                </View>

                <View style={styles.reqPriceBigBox}>
                  <Text style={styles.reqPriceBigText}>{requestPrice}</Text>
                  <Image source={coinIcon} style={styles.reqPriceBigIcon} contentFit="contain" />
                </View>

                <View style={styles.reqQuickAddRow}>
                  {["+10", "+100", "+1k", "MAX"].map(txt => (
                    <Pressable key={txt} style={styles.reqQuickAddBtn} onPress={() => setRequestPrice(p => txt === "MAX" ? 500 : p + parseInt(txt.replace('k', '000').replace('+', '')))}>
                      <Text style={styles.reqQuickAddText}>{txt}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.reqSectionTitle}>3. Quantity (1-10)</Text>
                <View style={styles.reqQtyRow}>
                  <Pressable style={styles.stepperBtn} onPress={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}><Text style={styles.stepperIcon}>-</Text></Pressable>
                  <Text style={styles.reqQtyText}>{requestQuantity}</Text>
                  <Pressable style={[styles.stepperBtn, { backgroundColor: "#BAE4BF" }]} onPress={() => setRequestQuantity(Math.min(10, requestQuantity + 1))}><Text style={[styles.stepperIcon, { color: "#111" }]}>+</Text></Pressable>
                </View>

                <View style={styles.reqSummaryBox}>
                  <Text style={styles.reqSummaryTitle}>Summary</Text>
                  <View style={styles.reqSumRow}>
                    <Text style={styles.reqSumLabel}>Total Escrow:</Text>
                    <View style={styles.reqSumRight}>
                      <Text style={styles.reqSumBold}>{requestPrice * requestQuantity}</Text>
                      <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
                    </View>
                  </View>
                  <View style={styles.reqSumDivider} />
                  <View style={styles.reqSumMiniRow}>
                    <Text style={styles.reqSumSubLabel}>Your Balance:</Text>
                    <View style={styles.reqSumRight}>
                      <Text style={styles.reqSumSubBold}>{coins}</Text>
                      <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
                    </View>
                  </View>
                  <View style={styles.reqSumMiniRow}>
                    <Text style={styles.reqSumSubLabel}>Expires In:</Text>
                    <Text style={styles.reqSumSubBold}>24 hours</Text>
                  </View>
                </View>

                <Pressable style={styles.reqSubmitBtn} onPress={submitRequest}>
                  <Text style={styles.reqSubmitBtnText}>Post Request · {requestPrice * requestQuantity}</Text>
                  <Image source={coinIcon} style={styles.buyButtonIcon} contentFit="contain" />
                </Pressable>
             </ScrollView>
           )}
         </View>
      </Modal>
    );
  }

  // --- MAIN LAYOUT ---
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* Top Tier Segment (Buy & Sell / Requests) */}
        <View style={styles.topTabs}>
          <Pressable 
            style={[styles.topTabButton, topTab === "buy_sell" && styles.topTabButtonActive]}
            onPress={() => setTopTab("buy_sell")}
          >
            <Text style={[styles.topTabText, topTab === "buy_sell" && styles.topTabTextActive]}>Buy & Sell</Text>
          </Pressable>
          <Pressable 
            style={[styles.topTabButton, topTab === "requests" && styles.topTabButtonActive]}
            onPress={() => setTopTab("requests")}
          >
            <Text style={[styles.topTabText, topTab === "requests" && styles.topTabTextActive]}>Requests</Text>
          </Pressable>
        </View>

        {/* Second Tier Segment */}
        {topTab === "buy_sell" ? (
          <View style={styles.segmentedControl}>
            {(["all", "my_sales", "merchant"] as const).map((tab) => {
              const labelMap: Record<string, string> = { all: "All", my_sales: "My Sales", merchant: "Merchant" };
              return (
                <Pressable
                  key={tab}
                  style={[styles.segment, buySellTab === tab && styles.segmentActive]}
                  onPress={() => setBuySellTab(tab)}
                >
                  <Text style={[styles.segmentText, buySellTab === tab && styles.segmentTextActive]}>
                    {labelMap[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.segmentedControl}>
            {(["open", "my_requests"] as const).map((tab) => {
              const labelMap: Record<string, string> = { open: "Open", my_requests: "My Requests" };
              return (
                <Pressable
                  key={tab}
                  style={[styles.segment, requestsTab === tab && styles.segmentActive]}
                  onPress={() => setRequestsTab(tab)}
                >
                  <Text style={[styles.segmentText, requestsTab === tab && styles.segmentTextActive]}>
                    {labelMap[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* List Areas */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {topTab === "buy_sell" && buySellTab === "merchant" && renderMerchantTab()}
          {topTab === "buy_sell" && buySellTab === "all" && renderAllSalesTab()}
          {topTab === "buy_sell" && buySellTab === "my_sales" && renderMySalesTab()}
          {topTab === "requests" && requestsTab === "open" && renderRequestsOpenTab()}
          {topTab === "requests" && requestsTab === "my_requests" && renderMyRequestsTab()}
        </ScrollView>

        {/* Floating Close Button */}
        <View style={[styles.closeContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Image source={closeIconSvg} style={styles.closeSvg} contentFit="contain" />
          </Pressable>
        </View>

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 100 },
  topTabs: { flexDirection: "row", backgroundColor: "#EFF1F5", marginHorizontal: 16, borderRadius: 16, padding: 6, marginBottom: 12 },
  topTabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  topTabButtonActive: { backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  topTabText: { fontSize: 16, fontWeight: "700", color: "#7A828A" },
  topTabTextActive: { color: "#111" },
  segmentedControl: { flexDirection: "row", backgroundColor: "#F8F9FA", marginHorizontal: 16, borderRadius: 12, padding: 4, marginBottom: 20 },
  segment: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#FFF", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "700", color: "#7A828A" },
  segmentTextActive: { color: "#111" },
  listContainer: { paddingHorizontal: 16, gap: 12 },
  
  // Banner
  banner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EBF5FF", borderRadius: 16, padding: 16, marginBottom: 8 },
  bannerLeft: { flexDirection: "row", alignItems: "center" },
  bannerIcon: { width: 24, height: 24, marginRight: 12 },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  bannerSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  bannerArrow: { fontSize: 24, color: "#555", fontWeight: "300" },
  
  // Merchant Cards
  merchantCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EBEBEB", borderRadius: 16, padding: 16 },
  merchantCover: { width: 48, height: 48, marginRight: 16 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardInfo: { flex: 1, paddingRight: 8 },
  cardTitleRow: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginRight: 6 },
  eyeIcon: { fontSize: 14, opacity: 0.6 },
  cardDesc: { fontSize: 13, color: "#777", marginTop: 4, lineHeight: 18 },
  cardRight: { alignItems: "flex-end", justifyContent: "center" },
  tagContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  tagStar: { fontSize: 10, marginRight: 4 },
  tagText: { fontSize: 10, fontWeight: "800" },
  buyButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  buyButtonDisabled: { opacity: 0.5 },
  buyButtonText: { fontSize: 14, fontWeight: "900", color: "#111", marginRight: 6 },
  buyButtonIcon: { width: 16, height: 16 },
  
  // Sales
  playerSaleCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EBEBEB", borderRadius: 16, padding: 16 },
  saleItemCover: { width: 40, height: 40, marginRight: 16 },
  saleItemTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  saleItemQty: { color: "#7BC47F" },
  sellerName: { fontSize: 13, color: "#999", marginTop: 4 },
  salePriceBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  salePriceText: { fontSize: 16, fontWeight: "900", color: "#111", marginRight: 6 },
  createSaleSlot: { borderWidth: 2, borderColor: "#EAEAEA", borderStyle: "dashed", borderRadius: 16, padding: 20, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  createSalePlus: { fontSize: 24, color: "#BBB", marginRight: 10 },
  createSaleDesc: { fontSize: 15, fontWeight: "700", color: "#999" },
  unlockSlotBadge: { borderWidth: 2, borderColor: "#F3C546", borderRadius: 16, padding: 20, alignItems: "center", justifyContent: "center", flexDirection: "row", backgroundColor: "#FFFAEE" },
  unlockDiamond: { width: 20, height: 20, marginRight: 10 },
  unlockSlotText: { fontSize: 15, fontWeight: "800", color: "#E2A422" },

  // Requests
  requestCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EBEBEB", borderRadius: 16, padding: 16 },
  requestImageBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FDF9F0", alignItems: "center", justifyContent: "center", marginRight: 16 },
  requestCover: { width: 40, height: 40 },
  requestInfoBox: { flex: 1 },
  requestTitleRow: { flexDirection: "row", alignItems: "center" },
  requestTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginRight: 8 },
  rewardPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#E4F4E4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rewardText: { fontSize: 12, fontWeight: "800", color: "#2C8C4E", marginRight: 4 },
  requesterName: { fontSize: 13, color: "#999", marginTop: 4, marginBottom: 8 },
  requestProgressRow: { flexDirection: "row", alignItems: "center" },
  progressBar: { flex: 1, height: 6, backgroundColor: "#F2F2F2", borderRadius: 3, marginRight: 12 },
  progressFill: { height: 6, backgroundColor: "#D3D3D3", borderRadius: 3 },
  requestProgressText: { fontSize: 12, fontWeight: "700", color: "#555", marginRight: 12 },
  forwardArrow: { fontSize: 18, color: "#999", fontWeight: "300" },
  requestTimeText: { fontSize: 12, color: "#A0A0A0", marginTop: 6 },
  
  helperRankCard: { backgroundColor: "#F9F5FF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#EFE5FD" },
  helperHeartCircle: { width: 40, height: 40, backgroundColor: "#F0E1FF", borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 16 },
  helperHeartText: { fontSize: 20 },
  helperCardInfo: { flex: 1 },
  helperRankTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  helperXP: { fontSize: 13, color: "#666", marginVertical: 4 },
  helperNext: { fontSize: 13, color: "#888" },
  helperNextBold: { fontWeight: "700", color: "#7E57C2" },

  // Setup subviews elements shared
  stepperBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center" },
  stepperBtnOut: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  stepperIcon: { fontSize: 24, color: "#AAADB0", fontWeight: "300" },
  stepperIconOut: { fontSize: 20, color: "#C0C3C6" },

  // Create Sale View
  createSaleHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16 },
  backButton: { padding: 8, marginRight: 8 },
  backArrow: { fontSize: 32, color: "#333", lineHeight: 32 },
  createSaleSearch: { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 16, height: 48, justifyContent: "center" },
  createSaleSearchInput: { fontSize: 16 },
  createSaleGridScroll: { flex: 1 },
  createSaleGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 16 },
  invItemCard: { width: "30%", aspectRatio: 0.9, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EBEBEB", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  invItemCardSelected: { borderColor: "#7BC47F", backgroundColor: "#F0F9F0", borderWidth: 2 },
  invItemImage: { width: 44, height: 44, marginBottom: 8 },
  invItemTitle: { fontSize: 13, fontWeight: "800", color: "#333" },
  invItemCount: { fontSize: 12, color: "#888", marginTop: 2 },
  createSaleBottomPanel: { borderTopWidth: 1, borderTopColor: "#EBEBEB", paddingHorizontal: 20, paddingTop: 20 },
  panelLabel: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12 },
  stepperRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stepperInputBox: { borderWidth: 2, borderColor: "#7BC47F", borderRadius: 8, height: 48, paddingHorizontal: 24, marginHorizontal: 12, alignItems: "center", justifyContent: "center", minWidth: 80 },
  stepperInputBoxLarge: { flexDirection: "row", borderWidth: 2, borderColor: "#7BC47F", borderRadius: 8, height: 48, paddingHorizontal: 16, marginHorizontal: 12, alignItems: "center", justifyContent: "center", flex: 1 },
  stepperValueText: { fontSize: 18, fontWeight: "800", color: "#111" },
  stepperPerItem: { fontSize: 14, color: "#777", marginLeft: 6 },
  finalPutSaleBtn: { backgroundColor: "#BAE4BF", paddingVertical: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  finalPutSaleBtnDisabled: { opacity: 0.5 },
  finalPutSaleBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF", marginRight: 8 },

  // Create Request View
  createRequestContainer: { flex: 1, backgroundColor: "#F4F7FB" }, // Slight blueish tint as per design
  reqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  reqTitle: { fontSize: 24, fontWeight: "900", color: "#111" },
  reqSubtitle: { fontSize: 14, color: "#777", marginTop: 4 },
  reqCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  reqCloseIcon: { width: 16, height: 16, tintColor: "#111" },
  reqBody: { paddingHorizontal: 20 },
  reqSectionTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12, marginTop: 16 },
  reqSearchBox: { backgroundColor: "#FFF", borderRadius: 12, height: 48, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: "#EDEDED", marginBottom: 12 },
  reqSearchInput: { fontSize: 16, color: "#333" },
  reqScrollList: { paddingBottom: 60 },
  reqListItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#EDEDED" },
  reqListItemLeft: { flexDirection: "row", alignItems: "center" },
  reqListImg: { width: 40, height: 40, marginRight: 16 },
  reqListText: { fontSize: 16, fontWeight: "700", color: "#333" },
  reqListArrow: { fontSize: 24, color: "#999" },
  
  reqSelectedPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#EBF8ED", borderWidth: 1, borderColor: "#AEDCA8", borderRadius: 16, padding: 12, alignSelf: "flex-start" },
  reqSelectedImg: { width: 28, height: 28, marginRight: 12 },
  reqSelectedText: { fontSize: 16, fontWeight: "800", color: "#111", marginRight: 24 },
  reqCancelSel: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#666", alignItems: "center", justifyContent: "center" },
  reqCancelText: { color: "#FFF", fontSize: 14, fontWeight: "900", lineHeight: 18 },
  reqSubText: { fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 18 },
  reqStatsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  reqStatPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#EEE" },
  reqStatText: { fontSize: 12, fontWeight: "600", color: "#555" },
  reqPriceBigBox: { backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", borderWidth: 1, borderColor: "#EEE", marginBottom: 16 },
  reqPriceBigText: { fontSize: 24, fontWeight: "900", color: "#111", marginRight: 8 },
  reqPriceBigIcon: { width: 20, height: 20 },
  reqQuickAddRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  reqQuickAddBtn: { backgroundColor: "#EBF8ED", borderWidth: 1, borderColor: "#AEDCA8", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  reqQuickAddText: { fontSize: 14, fontWeight: "800", color: "#4EA857" },
  reqQtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 12 },
  reqQtyText: { fontSize: 24, fontWeight: "900", color: "#111", marginHorizontal: 32 },
  reqSummaryBox: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1, marginTop: 16, marginBottom: 24 },
  reqSummaryTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 16 },
  reqSumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reqSumLabel: { fontSize: 15, fontWeight: "800", color: "#111" },
  reqSumRight: { flexDirection: "row", alignItems: "center" },
  reqSumBold: { fontSize: 15, fontWeight: "900", color: "#111", marginRight: 6 },
  reqSumDivider: { height: 1, backgroundColor: "#EAEAEA", marginBottom: 12 },
  reqSumMiniRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reqSumSubLabel: { fontSize: 13, color: "#888" },
  reqSumSubBold: { fontSize: 13, fontWeight: "700", color: "#111", marginRight: 4 },
  reqSubmitBtn: { backgroundColor: "#7EBE82", borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  reqSubmitBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF", marginRight: 8 },

  closeContainer: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  closeButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#111", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  closeSvg: { width: 24, height: 24, tintColor: "#FFF" },
});
