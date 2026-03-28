import { ScreenHeader } from "@/components/screen-header";
import { SubTabs } from "@/components/sub-tabs";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset } from "@/constants/theme";
import { FlashList } from "@shopify/flash-list";
import React, { memo, useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// --- THEME & COLORS ---
const COLORS = {
  D: "#032018", // Dark Green
  L: "#DAF8B7", // Light Green
  W: "#FFFFFF", // White
  G: "#71B312", // Ravolo Green
  R: "#FF383C", // Ravolo Red
};

const FONTS = {
  monoBold: "System",
  monoRegular: "System",
};

// --- TYPES ---
type Tab = "player" | "clan";
type Period = "Daily" | "Monthly" | "All time";

const LEADERBOARD_TABS = [
  { id: "player", label: "PLAYER" },
  { id: "clan", label: "CLAN" },
];

interface BaseLeaderboardItem {
  rank: number;
  name: string;
  points: number;
  avatar: string;
  isYou?: boolean;
}

interface Player extends BaseLeaderboardItem {
  clan?: string;
}

interface Clan extends BaseLeaderboardItem {
  members: number;
}

// --- DUMMY DATA ---
const playerData: Player[] = [
  {
    rank: 1,
    name: "DirtKing",
    points: 18200,
    avatar:
      "https://images.unsplash.com/photo-1595956481935-a9e254951d49?w=200&q=80",
    clan: "Iron Roots",
  },
  {
    rank: 2,
    name: "BlossomFae",
    points: 15400,
    avatar:
      "https://images.unsplash.com/photo-1614025000673-edf238aaf5d4?w=200&q=80",
    clan: "Petal Guard",
  },
  {
    rank: 3,
    name: "RootWalker",
    points: 13800,
    avatar:
      "https://images.unsplash.com/photo-1771865415533-af3eed82ef8a?w=200&q=80",
    clan: "Phoenix Order",
  },
  {
    rank: 4,
    name: "StormPlow",
    points: 11200,
    avatar:
      "https://images.unsplash.com/photo-1724118135606-b4ff6b631cd3?w=200&q=80",
    clan: "Lone Wolf",
  },
  {
    rank: 5,
    name: "MoonReaper",
    points: 9800,
    avatar:
      "https://images.unsplash.com/photo-1701281482213-b4b02e57a7e2?w=200&q=80",
    clan: "Phoenix Order",
  },
  {
    rank: 6,
    name: "CropLord",
    points: 8500,
    avatar:
      "https://images.unsplash.com/photo-1770471464243-b45fc9de384b?w=200&q=80",
    clan: "Phoenix Order",
  },
  {
    rank: 7,
    name: "SunChaser",
    points: 7200,
    avatar:
      "https://images.unsplash.com/photo-1764452067834-098f63fe46e4?w=200&q=80",
    clan: "Phoenix Order",
  },
  {
    rank: 8,
    name: "You",
    points: 6400,
    avatar:
      "https://images.unsplash.com/photo-1760552070063-b1c5213b5a6f?w=200&q=80",
    clan: "Phoenix Order",
    isYou: true,
  },
];

const clanData: Clan[] = [
  {
    rank: 1,
    name: "Phoenix Order",
    points: 82400,
    avatar:
      "https://images.unsplash.com/photo-1658074418484-5629550741f5?w=200&q=80",
    members: 24,
  },
  {
    rank: 2,
    name: "Iron Roots",
    points: 71200,
    avatar:
      "https://images.unsplash.com/photo-1658074418484-5629550741f5?w=200&q=80",
    members: 18,
  },
  {
    rank: 3,
    name: "Petal Guard",
    points: 64800,
    avatar:
      "https://images.unsplash.com/photo-1685564551828-5724076c8458?w=200&q=80",
    members: 15,
  },
  {
    rank: 4,
    name: "Lone Wolf",
    points: 43200,
    avatar:
      "https://images.unsplash.com/photo-1666102937819-c12ae5e5f230?w=200&q=80",
    members: 12,
  },
  {
    rank: 5,
    name: "Harvest Moon",
    points: 38600,
    avatar:
      "https://images.unsplash.com/photo-1769420246413-cf1531018fb4?w=200&q=80",
    members: 20,
  },
];

// --- ICONS ---
const TrophyIcon = ({
  size = 14,
  color = COLORS.D,
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 5h-2V3a1 1 0 00-1-1H8a1 1 0 00-1 1v2H5C3.34 5 2 6.34 2 8c0 1.53 1.15 2.8 2.62 2.97A5.996 5.996 0 009 16.24V19H7a1 1 0 000 2h10a1 1 0 000-2h-2v-2.76a5.996 5.996 0 004.38-5.27C20.85 10.8 22 9.53 22 8c0-1.66-1.34-3-3-3z"
      fill={color}
    />
  </Svg>
);

const CrownIcon = () => (
  <Svg width="24" height="18" viewBox="0 0 24 18" fill="none">
    <Path
      d="M2 16L4 6L8 10L12 2L16 10L20 6L22 16H2Z"
      fill={COLORS.G}
      stroke={COLORS.D}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </Svg>
);

// --- SHARED COMPONENTS ---
const Avatar = memo(
  ({ src, size, ring }: { src: string; size: number; ring?: string }) => (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderColor: ring || COLORS.W,
          borderWidth: ring ? 3 : 2,
        },
      ]}
    >
      <Image source={{ uri: src }} style={styles.avatarImage} />
    </View>
  ),
);

const RankBadge = memo(({ rank }: { rank: number }) => {
  const bg = rank === 1 ? COLORS.G : rank === 2 ? COLORS.D : COLORS.L;
  const color = rank <= 2 ? COLORS.W : COLORS.D;
  return (
    <View style={[styles.rankBadge, { backgroundColor: bg }]}>
      <Text style={[styles.rankBadgeText, { color }]}>{rank}</Text>
    </View>
  );
});

// --- LIST ITEM (Memoized for FlashList Performance) ---
const LeaderboardItem = memo(
  ({ item, isPlayer }: { item: Player | Clan; isPlayer: boolean }) => {
    const isYou = item.isYou;
    const bgColor = isYou ? COLORS.D : COLORS.L;
    const rankColor = isYou ? COLORS.G : COLORS.D;
    const textColor = isYou ? COLORS.W : COLORS.D;
    const subTextColor = isYou ? COLORS.L : COLORS.D;

    return (
      <View style={[styles.listItem, { backgroundColor: bgColor }]}>
        <Text style={[styles.listItemRank, { color: rankColor }]}>
          {item.rank}
        </Text>

        <Avatar
          src={item.avatar}
          size={34}
          ring={isYou ? COLORS.G : "transparent"}
        />

        <View style={styles.listItemInfo}>
          <Text
            style={[styles.listItemName, { color: textColor }]}
            numberOfLines={1}
          >
            {item.name}
            {isYou && <Text style={styles.listItemYou}> (YOU)</Text>}
          </Text>

          {isPlayer ? (
            <Text
              style={[styles.listItemSub, { color: subTextColor }]}
              numberOfLines={1}
            >
              {(item as Player).clan || "No Clan"}
            </Text>
          ) : (
            <Text style={[styles.listItemSub, { color: subTextColor }]}>
              {(item as Clan).members} members
            </Text>
          )}
        </View>

        <View style={styles.listItemPoints}>
          <TrophyIcon size={10} color={isYou ? COLORS.G : COLORS.D} />
          <Text
            style={[
              styles.listItemPointsText,
              { color: isYou ? COLORS.G : COLORS.D },
            ]}
          >
            {item.points.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  },
);

// --- MAIN SCREEN ---
export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("player");
  const [period, setPeriod] = useState<Period>("Monthly");

  const periods: Period[] = ["Daily", "Monthly", "All time"];
  const isPlayer = tab === "player";

  const currentData = isPlayer ? playerData : clanData;
  const topItems = currentData.slice(0, 3);
  const restItems = currentData.slice(3);

  // FlashList requires stable renderItem reference
  const renderItem = useCallback(
    ({ item }: { item: Player | Clan }) => (
      <LeaderboardItem item={item} isPlayer={isPlayer} />
    ),
    [isPlayer],
  );

  const keyExtractor = useCallback(
    (item: Player | Clan) => `rank-${item.rank}`,
    [],
  );

  const renderHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* PODIUM */}
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        {topItems[1] && (
          <View style={[styles.podiumItem, { width: 90 }]}>
            <RankBadge rank={2} />
            <View style={{ marginTop: 4 }}>
              <Avatar src={topItems[1].avatar} size={60} ring={COLORS.D} />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topItems[1].name}
            </Text>
            <View style={styles.podiumPoints}>
              <TrophyIcon size={10} color={COLORS.D} />
              <Text style={styles.podiumPointsText}>
                {topItems[1].points.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.podiumBar,
                { height: 50, backgroundColor: COLORS.L },
              ]}
            />
          </View>
        )}

        {/* 1st Place */}
        {topItems[0] && (
          <View style={[styles.podiumItem, { width: 100 }]}>
            <CrownIcon />
            <View style={{ marginTop: 4 }}>
              <Avatar src={topItems[0].avatar} size={72} ring={COLORS.G} />
            </View>
            <Text style={[styles.podiumName, { fontSize: 11 }]}>
              {topItems[0].name}
            </Text>
            <View style={styles.podiumPoints}>
              <TrophyIcon size={10} color={COLORS.G} />
              <Text style={[styles.podiumPointsText, { color: COLORS.G }]}>
                {topItems[0].points.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.podiumBar,
                { height: 70, backgroundColor: COLORS.G },
              ]}
            />
          </View>
        )}

        {/* 3rd Place */}
        {topItems[2] && (
          <View style={[styles.podiumItem, { width: 90 }]}>
            <RankBadge rank={3} />
            <View style={{ marginTop: 4 }}>
              <Avatar src={topItems[2].avatar} size={56} ring={COLORS.L} />
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>
              {topItems[2].name}
            </Text>
            <View style={styles.podiumPoints}>
              <TrophyIcon size={10} color={COLORS.D} />
              <Text style={styles.podiumPointsText}>
                {topItems[2].points.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.podiumBar,
                { height: 36, backgroundColor: COLORS.L },
              ]}
            />
          </View>
        )}
      </View>

      {/* COLUMN HEADERS */}
      <View style={styles.columnHeaders}>
        <Text style={[styles.columnHeaderText, { width: 40 }]}>Rank</Text>
        <Text style={[styles.columnHeaderText, { flex: 1 }]}>
          {isPlayer ? "Player" : "Clan"}
        </Text>
        <Text style={[styles.columnHeaderText]}>Points</Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        {/* STATIC HEADER */}
        <ScreenHeader title="LEADERBOARD" />

        {/* TABS (Player / Clan) */}
        <SubTabs
          tabs={LEADERBOARD_TABS}
          activeTabId={tab}
          onTabPress={(id) => setTab(id as Tab)}
        />

        {/* PERIOD PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodScroll}
          contentContainerStyle={styles.periodContainer}
        >
          {periods.map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodPill,
                  isActive
                    ? { backgroundColor: COLORS.D, borderColor: COLORS.D }
                    : { backgroundColor: "transparent", borderColor: COLORS.L },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: isActive ? COLORS.W : COLORS.D },
                  ]}
                  numberOfLines={1}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FLASH LIST (Performant Virtualized Rendering) */}
        <View style={styles.listContainer}>
          <FlashList
            data={restItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            //@ts-ignore
            estimatedItemSize={60}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: BottomTabInset + 20 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    fontWeight: "700",
  },
  periodScroll: {
    maxHeight: 60,
    marginBottom: 20,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  periodPill: {
    minWidth: 80,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  periodText: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    fontWeight: "700",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeaderContainer: {
    paddingBottom: 8,
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  podiumItem: {
    alignItems: "center",
  },
  podiumName: {
    marginTop: 6,
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.D,
    textAlign: "center",
    width: "100%",
  },
  podiumPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    marginBottom: 8,
  },
  podiumPointsText: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.D,
  },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  columnHeaderText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.D,
    opacity: 0.4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  listItemRank: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  listItemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  listItemName: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    fontWeight: "700",
  },
  listItemYou: {
    fontWeight: "400",
    opacity: 0.6,
  },
  listItemSub: {
    fontFamily: FONTS.monoRegular,
    fontSize: 9,
    opacity: 0.5,
    marginTop: 2,
  },
  listItemPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listItemPointsText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    fontWeight: "700",
  },
  avatarContainer: {
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.L, // fallback bg
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  rankBadgeText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    fontWeight: "700",
  },
});
