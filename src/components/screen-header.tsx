import { ChevronLeft } from "lucide-react-native";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Fonts } from "@/constants/theme";

interface ScreenHeaderProps {
  title?: string;
  renderRight?: () => React.ReactNode;
  onBackPress?: () => void;
  style?: ViewStyle;
}

const D = "#032018"; // Dark Green

export const ScreenHeader = memo(function ScreenHeader({ 
  title, 
  renderRight, 
  onBackPress,
  style 
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <ChevronLeft size={24} color={D} />
          </TouchableOpacity>
        )}
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <View style={styles.rightContainer}>
        {renderRight?.()}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: D,
    fontFamily: Fonts.mono,
    textTransform: "uppercase",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
