import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";

const goldTrophy = require("@/assets/image/assets_images_icons_leaderboard_trophy_gold.webp");
const silverTrophy = require("@/assets/image/assets_images_icons_leaderboard_trophy_silver.webp");
const bronzeTrophy = require("@/assets/image/assets_images_icons_leaderboard_trophy_bronze.webp");

interface PodiumItemProps {
  rank: 1 | 2 | 3;
  name: string;
  value: string;
  avatar?: string;
}

export function PodiumItem({ rank, name, value, avatar }: PodiumItemProps) {
  const trophy = rank === 1 ? goldTrophy : rank === 2 ? silverTrophy : bronzeTrophy;
  const isFirst = rank === 1;

  return (
    <View style={[styles.container, isFirst && styles.containerFirst]}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={[styles.avatar, isFirst && styles.avatarFirst]} />
        ) : (
          <View style={[styles.avatarPlaceholder, isFirst && styles.avatarFirst]} />
        )}
        <Image source={trophy} style={styles.trophyIcon} contentFit="contain" />
      </View>
      <View style={styles.info}>
        <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.value}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 100,
    marginTop: 20,
  },
  containerFirst: {
    marginTop: 0,
    width: 120,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DAF8B7",
    borderWidth: 2,
    borderColor: "#DAF8B7",
  },
  avatarFirst: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: "#FFD300",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#032018",
    opacity: 0.1,
  },
  trophyIcon: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 32,
    height: 32,
  },
  info: {
    alignItems: "center",
    gap: 2,
  },
  name: {
    fontSize: 14,
    color: "#032018",
    textAlign: "center",
  },
  value: {
    fontSize: 12,
    opacity: 0.6,
  },
});
