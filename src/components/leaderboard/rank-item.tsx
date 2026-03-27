import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";

interface RankItemProps {
  rank: number;
  name: string;
  value: string;
  level: number;
  avatar?: string;
  isMe?: boolean;
}

export function RankItem({ rank, name, value, level, avatar, isMe }: RankItemProps) {
  return (
    <View style={[styles.container, isMe && styles.containerMe]}>
      <View style={styles.leftSection}>
        <ThemedText type="smallBold" style={styles.rank}>
          {rank}
        </ThemedText>
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
        <View style={styles.userInfo}>
          <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
            {name} {isMe && "(You)"}
          </ThemedText>
          <View style={styles.levelBadge}>
            <ThemedText themeColor="textSecondary" style={styles.levelText}>
              LVL {level}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.rightSection}>
        <ThemedText type="smallBold" style={styles.value}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 8,
  },
  containerMe: {
    backgroundColor: "#DAF8B7",
    borderColor: "#DAF8B7",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rank: {
    width: 24,
    fontSize: 14,
    opacity: 0.4,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#032018",
    opacity: 0.1,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    color: "#032018",
  },
  levelBadge: {
    backgroundColor: "rgba(3, 32, 24, 0.05)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  levelText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 14,
    color: "#032018",
  },
});
