import { Image } from "expo-image";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, Dimensions, Platform, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Fonts } from "@/constants/theme";
import { useGameStore } from "@/store/game-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useAuthStore } from "@/store/auth-store";
import { websocketManager } from "@/services/websocket-manager";
import { useAppStore } from "@/store/app-store";

const FONT = "Space Mono";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Assets
const avatarImg = require("@/assets/image/assets_images_icons_misc_farmer_portrait.webp");
const explorerBadge = require("@/assets/inapp-icons/Check-Badge--Streamline-Ultimate.png");
const strongBadge = require("@/assets/inapp-icons/Check-Badge--Streamline-Ultimate.png"); // Reusing for mock
const phoenixImg = require("@/assets/inapp-icons/home-tab-icons/Stat-2--Streamline-Rounded-Streamline-Material.png");

const cropAssets: Record<string, any> = {
  corn: require("@/assets/image/assets_images_icons_crops_corn.webp"),
  carrot: require("@/assets/image/assets_images_icons_crops_carrot.webp"),
  wheat: require("@/assets/image/assets_images_icons_crops_wheat.webp"),
};

// --- Sub-components ---

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.iconCircle}>
      {children}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <IconCircle>{icon}</IconCircle>
      <View>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
        <ThemedText style={styles.statValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

// Icons (Mocking with small Images since we don't have the original SVGs as separate components)
const trophyIcon = require("@/assets/inapp-icons/Check-Badge--Streamline-Ultimate.png");
const hourglassIcon = require("@/assets/inapp-icons/home-tab-icons/Making-Slime-1--Streamline-Ultimate.png");
const carrotIcon = require("@/assets/image/assets_images_icons_crops_carrot.webp");
const esportsIcon = require("@/assets/inapp-icons/Fantasy-Medieval-Roleplay-Game-Party-Leader--Streamline-Ultimate.png");

export default function ProfileScreen() {
  const level = useGameStore((state) => state.level);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeItems = useInventoryStore((state) => state.items);
  const logout = useAuthStore((state) => state.logout);
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);

  // Memoize playerData to prevent unnecessary downstream re-renders
  const playerData = useMemo(() => ({
    name: "clement-mars",
    handle: "@clement___10",
    level: level,
    dailyTime: "1h 23m",
    totalAsset: 50,
    worldRank: 1050,
    achievements: [
      { id: "1", name: "Explorer", img: explorerBadge },
      { id: "2", name: "Strong Arm", img: explorerBadge },
    ],
    clan: {
      name: "Phoenix Order",
      emblem: phoenixImg,
      members: 42,
      rank: 15,
    },
  }), [level]);

  // Memoize inventory transformation to avoid infinite loop (unstable selector)
  const inventory = useMemo(() => 
    Object.entries(storeItems)
      .map(([id, item]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        qty: item.quantity,
        img: cropAssets[id] || cropAssets.wheat,
      }))
      .filter(item => item.qty > 0),
    [storeItems]
  );

  const handleLogout = async () => {
    websocketManager.disconnect();
    await logout();
    resetOnboarding();
    router.replace("/"); // RootLayout will show onboarding again after logout.
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Wave - Approximated with Views */}
        <View style={styles.headerContainer}>
           <View style={styles.darkHeader} />
           <View style={styles.waveLayer1} />
           <View style={styles.waveLayer2} />
           
           {/* Back Button */}
           <Pressable 
             onPress={() => router.back()} 
             style={[styles.backButton, { top: Math.max(insets.top, 20) }]}
           >
             <ThemedText style={styles.backButtonText}>✕</ThemedText>
           </Pressable>

           {/* Logout Button */}
           <Pressable
             onPress={handleLogout}
             style={[
               styles.logoutButton,
               { top: Math.max(insets.top, 20) },
             ]}
           >
             <ThemedText style={styles.logoutButtonText}>LOG OUT</ThemedText>
           </Pressable>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={avatarImg} 
              style={styles.avatar} 
              contentFit="cover"
            />
          </View>
          <ThemedText style={styles.playerName}>{playerData.name}</ThemedText>
          <ThemedText style={styles.playerHandle}>{playerData.handle}</ThemedText>
        </View>

        {/* Content */}
        <View style={styles.contentPadding}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard 
              icon={<Image source={trophyIcon} style={{width: 18, height: 18}} contentFit="contain" />} 
              label="Level" 
              value={String(playerData.level)} 
            />
            <StatCard 
              icon={<Image source={hourglassIcon} style={{width: 18, height: 18}} contentFit="contain" />} 
              label="Daily Time" 
              value={playerData.dailyTime} 
            />
            <StatCard 
              icon={<Image source={carrotIcon} style={{width: 18, height: 18}} contentFit="contain" />} 
              label="Total Asset" 
              value={String(playerData.totalAsset)} 
            />
            <StatCard 
              icon={<Image source={esportsIcon} style={{width: 18, height: 18}} contentFit="contain" />} 
              label="World Rank" 
              value={String(playerData.worldRank)} 
            />
          </View>

          {/* Clan */}
          <View style={styles.sectionMargin}>
            <SectionTitle title="Clan" />
            <View style={styles.card}>
              <View style={styles.clanEmblemWrapper}>
                <Image source={playerData.clan.emblem} style={styles.clanEmblem} contentFit="contain" />
              </View>
              <View style={styles.clanInfo}>
                <ThemedText style={styles.clanName}>{playerData.clan.name}</ThemedText>
                <View style={styles.clanMeta}>
                  <ThemedText style={styles.clanMetaText}>{playerData.clan.members} members</ThemedText>
                  <ThemedText style={styles.clanMetaText}>Rank #{playerData.clan.rank}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.sectionMargin}>
            <SectionTitle title="Achievements" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {playerData.achievements.map((a) => (
                <View key={a.id} style={styles.achievementCard}>
                  <Image source={a.img} style={styles.achievementImg} contentFit="contain" />
                  <ThemedText style={styles.achievementName}>{a.name}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Inventory */}
          <View style={styles.sectionMargin}>
            <SectionTitle title="Inventory" />
            <View style={styles.inventoryList}>
              {inventory.map((item) => (
                <View key={item.id} style={[styles.card, styles.inventoryItem]}>
                  <Image source={item.img} style={styles.itemImg} contentFit="contain" />
                  <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.itemQty}>x{item.qty}</ThemedText>
                </View>
              ))}
            </View>
          </View>
          
          {/* Spacer for bottom tab bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DAF8B7",
  },
  scrollContent: {
    paddingTop: 0,
  },
  headerContainer: {
    height: 200,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  darkHeader: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#032018",
  },
  waveLayer1: {
    position: "absolute",
    bottom: -40,
    left: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 1.5,
    height: 120,
    borderRadius: SCREEN_WIDTH * 0.75,
    backgroundColor: "#DAF8B7",
    transform: [{ scaleX: 1.2 }],
  },
  waveLayer2: {
    position: "absolute",
    bottom: -60,
    left: -SCREEN_WIDTH * 0.5,
    width: SCREEN_WIDTH * 2,
    height: 140,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: "#DAF8B7",
    opacity: 0.8,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -100,
    zIndex: 10,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "#DAF8B7",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  playerName: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
  },
  playerHandle: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 14,
    opacity: 0.6,
  },
  contentPadding: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: (SCREEN_WIDTH - 40 - 12) / 2, // 2 columns
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DAF8B7",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontFamily: FONT,
    color: "#032018",
    opacity: 0.6,
    fontSize: 11,
  },
  statValue: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionMargin: {
    marginTop: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clanEmblemWrapper: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#DAF8B7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  clanEmblem: {
    width: 48,
    height: 48,
  },
  clanInfo: {
    flex: 1,
  },
  clanName: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 16,
    fontWeight: "700",
  },
  clanMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  clanMetaText: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 12,
    opacity: 0.6,
  },
  hScroll: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    width: 100,
    alignItems: "center",
  },
  achievementImg: {
    width: 56,
    height: 56,
  },
  achievementName: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
  },
  inventoryList: {
    gap: 8,
  },
  inventoryItem: {
    paddingVertical: 12,
  },
  itemImg: {
    width: 40,
    height: 40,
  },
  itemName: {
    flex: 1,
    fontFamily: FONT,
    color: "#032018",
    fontSize: 14,
  },
  itemQty: {
    fontFamily: FONT,
    color: "#032018",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  logoutButton: {
    position: "absolute",
    right: 20,
    width: 92,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#032018",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
