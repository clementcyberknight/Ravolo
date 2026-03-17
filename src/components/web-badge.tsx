import React from "react";
import { Platform, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export function WebBadge() {
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <ThemedView type="backgroundElement" style={styles.badge}>
      <ThemedText type="small">Web preview</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    alignSelf: "center",
  },
});
