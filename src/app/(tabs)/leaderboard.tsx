import { FlashList } from "@shopify/flash-list";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PodiumItem } from "../../components/leaderboard/podium-item";
import { RankItem } from "../../components/leaderboard/rank-item";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import { BottomTabInset, Spacing } from "../../constants/theme";

interface RankingData {
  id: string;
  rank: number;
  name: string;
  value: string;
  level: number;
  avatar?: string;
}

const GLOBAL_RANKINGS: RankingData[] = [
  {
    id: "1",
    rank: 1,
    name: "HarvestMaster",
    value: "$4.2M",
    level: 145,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  },
  {
    id: "2",
    rank: 2,
    name: "FarmQueen",
    value: "$3.8M",
    level: 132,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
  },
  {
    id: "3",
    rank: 3,
    name: "SiloSnake",
    value: "$3.5M",
    level: 128,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  },
  { id: "4", rank: 4, name: "GrainGuru", value: "$2.9M", level: 110 },
  { id: "5", rank: 5, name: "TractorTom", value: "$2.7M", level: 105 },
  { id: "6", rank: 6, name: "PlowPro", value: "$2.4M", level: 98 },
  { id: "7", rank: 7, name: "CropCaptain", value: "$2.2M", level: 92 },
  { id: "8", rank: 8, name: "SeedSage", value: "$2.1M", level: 88 },
  { id: "9", rank: 9, name: "WaterWatcher", value: "$1.9M", level: 85 },
  { id: "10", rank: 10, name: "SoilSorcerer", value: "$1.8M", level: 82 },
];

const SYNDICATE_RANKINGS: RankingData[] = [
  { id: "s1", rank: 1, name: "Phoenix Order", value: "$18.5M", level: 45 },
  { id: "s2", rank: 2, name: "Green Cartel", value: "$16.2M", level: 42 },
  { id: "s3", rank: 3, name: "Crops R Us", value: "$14.8M", level: 38 },
  { id: "s4", rank: 4, name: "The Silo Syndicate", value: "$12.9M", level: 35 },
  { id: "s5", rank: 5, name: "Farm Mafia", value: "$11.4M", level: 32 },
];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<"GLOBAL" | "SYNDICATE">("GLOBAL");
  const insets = useSafeAreaInsets();

  const currentData =
    activeTab === "GLOBAL" ? GLOBAL_RANKINGS : SYNDICATE_RANKINGS;
  const podium = currentData.slice(0, 3);
  const remaining = currentData.slice(3);

  const renderRankingItem = ({ item }: { item: RankingData }) => (
    <RankItem
      rank={item.rank}
      name={item.name}
      value={item.value}
      level={item.level}
      avatar={item.avatar}
      isMe={item.name === "SoilSorcerer"}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Spacing.six) },
        ]}
      >
        <ThemedText type="subtitle" style={styles.title}>
          Hall of Fame
        </ThemedText>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "GLOBAL" && styles.tabActive]}
            onPress={() => setActiveTab("GLOBAL")}
          >
            <ThemedText
              type="smallBold"
              style={[
                styles.tabText,
                activeTab === "GLOBAL" && styles.tabTextActive,
              ]}
            >
              GLOBAL
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "SYNDICATE" && styles.tabActive]}
            onPress={() => setActiveTab("SYNDICATE")}
          >
            <ThemedText
              type="smallBold"
              style={[
                styles.tabText,
                activeTab === "SYNDICATE" && styles.tabTextActive,
              ]}
            >
              SYNDICATE
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <FlashList
        data={remaining}
        renderItem={renderRankingItem}
        //@ts-ignore
        estimatedItemSize={64}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: BottomTabInset + Spacing.six,
        }}
        ListHeaderComponent={
          <View style={styles.podiumContainer}>
            <View style={styles.podiumRow}>
              {podium[1] && (
                <PodiumItem
                  rank={2}
                  name={podium[1].name}
                  value={podium[1].value}
                  avatar={podium[1].avatar}
                />
              )}
              {podium[0] && (
                <PodiumItem
                  rank={1}
                  name={podium[0].name}
                  value={podium[0].value}
                  avatar={podium[0].avatar}
                />
              )}
              {podium[2] && (
                <PodiumItem
                  rank={3}
                  name={podium[2].name}
                  value={podium[2].value}
                  avatar={podium[2].avatar}
                />
              )}
            </View>
            <View style={styles.divider} />
          </View>
        }
      />

      <View
        style={[styles.stickyFooter, { bottom: BottomTabInset + Spacing.two }]}
      >
        <RankItem rank={124} name="You" value="$1.2M" level={75} isMe={true} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 16,
  },
  title: {
    fontSize: 24,
    color: "#032018",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: "#032018",
    opacity: 0.4,
  },
  tabTextActive: {
    opacity: 1,
  },
  podiumContainer: {
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: "white",
    marginBottom: 10,
  },
  podiumRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginTop: 30,
    marginHorizontal: 20,
  },
  stickyFooter: {
    position: "absolute",
    left: 16,
    right: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
});
