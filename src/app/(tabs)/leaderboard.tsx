import React from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";

export default function LeaderboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Leaderboard</ThemedText>
      <ThemedText themeColor="textSecondary">
        Track top players and seasonal rankings in Ravolo.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
  },
});
