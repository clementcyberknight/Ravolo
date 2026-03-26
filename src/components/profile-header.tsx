import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameStore } from "@/store/game-store";

// Asset paths
const profileImage = require("@/assets/image/assets_images_icons_misc_farmer_portrait.webp");
const coinIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");
const diamondIcon = require("@/assets/image/assets_images_icons_misc_diamonds.webp");

// ---------- XP Ring ----------
const RING_SIZE = 56;
const RING_STROKE = 4;
const INNER_SIZE = RING_SIZE - RING_STROKE * 2;
const HALF = RING_SIZE / 2;

interface XpRingProps {
  progress: number; // 0..1
}

function XpRing({ progress }: XpRingProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const degrees = clamped * 360;

  const trackColor = "#E0E0E0";
  const fillColor = "#4CAF50";

  // Right half: sweep 0°→180° of visible arc
  const rightRotation = 45 - Math.min(degrees, 180);
  // Left half: sweep 0°→180° of visible arc (starts at degrees > 180)
  const leftDegrees = Math.max(degrees - 180, 0);
  const leftRotation = 45 - leftDegrees;

  return (
    <View style={ringStyles.container}>
      {/* Gray track (always visible) */}
      <View style={[ringStyles.circle, { borderColor: trackColor }]} />

      {/* Right-half clip mask (shows x ≥ center) */}
      <View style={ringStyles.rightMask}>
        <View
          style={[
            ringStyles.arcCircle,
            {
              left: -HALF,
              borderLeftColor: fillColor,
              borderBottomColor: fillColor,
              borderTopColor: "transparent",
              borderRightColor: "transparent",
              transform: [{ rotateZ: `${rightRotation}deg` }],
            },
          ]}
        />
      </View>

      {/* Left-half clip mask (shows x ≤ center) */}
      <View style={ringStyles.leftMask}>
        <View
          style={[
            ringStyles.arcCircle,
            {
              left: 0,
              borderTopColor: fillColor,
              borderRightColor: fillColor,
              borderBottomColor: "transparent",
              borderLeftColor: "transparent",
              transform: [{ rotateZ: `${leftRotation}deg` }],
            },
          ]}
        />
      </View>

      {/* Inner profile image */}
      <View style={ringStyles.innerContainer}>
        <Image
          source={profileImage}
          style={ringStyles.profileImage}
          contentFit="cover"
        />
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: "relative",
  },
  circle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: HALF,
    borderWidth: RING_STROKE,
  },
  rightMask: {
    position: "absolute",
    top: 0,
    left: HALF,
    width: HALF,
    height: RING_SIZE,
    overflow: "hidden",
  },
  leftMask: {
    position: "absolute",
    top: 0,
    left: 0,
    width: HALF,
    height: RING_SIZE,
    overflow: "hidden",
  },
  arcCircle: {
    position: "absolute",
    top: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: HALF,
    borderWidth: RING_STROKE,
  },
  innerContainer: {
    position: "absolute",
    top: RING_STROKE,
    left: RING_STROKE,
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  profileImage: {
    width: INNER_SIZE,
    height: INNER_SIZE,
  },
});

// ---------- Currency Pill ----------

interface CurrencyPillProps {
  icon: number;
  value: number;
}

function CurrencyPill({ icon, value }: CurrencyPillProps) {
  return (
    <View style={pillStyles.container}>
      <Image source={icon} style={pillStyles.icon} contentFit="contain" />
      <Text style={pillStyles.value}>{value.toLocaleString()}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F2EB",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  icon: {
    width: 20,
    height: 20,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
});

// ---------- Profile Header ----------

export const ProfileHeader = memo(function ProfileHeader() {
  const level = useGameStore((state) => state.level);
  const xp = useGameStore((state) => state.xp);
  const xpToNextLevel = useGameStore((state) => state.xpToNextLevel);
  const coins = useGameStore((state) => state.coins);
  const diamonds = useGameStore((state) => state.diamonds);
  
  const insets = useSafeAreaInsets();

  const xpProgress = xpToNextLevel > 0 ? xp / xpToNextLevel : 0;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 4 }]}>
      {/* Left: avatar + level */}
      <View style={styles.leftSection}>
        <XpRing progress={xpProgress} />
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>Level</Text>
          <Text style={styles.levelValue}>{level}</Text>
        </View>
      </View>

      {/* Right: currency pills stacked */}
      <View style={styles.rightSection}>
        <CurrencyPill icon={coinIcon} value={coins} />
        <CurrencyPill icon={diamondIcon} value={diamonds} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelContainer: {
    justifyContent: "center",
  },
  levelLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  levelValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 4,
  },
});
