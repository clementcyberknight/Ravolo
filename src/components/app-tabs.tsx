import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

const TAB_CONFIG = [
  {
    name: "index",
    label: "Home",
    icon: require("@/assets/icons/Farm-Light--Streamline-Phosphor.png"),
  },
  {
    name: "coop",
    label: "Coop",
    icon: require("@/assets/icons/Team-Share-Idea--Streamline-Ultimate.png"),
  },
  {
    name: "leaderboard",
    label: "Leaderboard",
    icon: require("@/assets/icons/Fantasy-Medieval-Roleplay-Game-Party-Leader--Streamline-Ultimate.png"),
  },
  {
    name: "shop",
    label: "Shop",
    icon: require("@/assets/icons/Shop-Star-Rating--Streamline-Ultimate.png"),
  },
] as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      {TAB_CONFIG.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon src={tab.icon} renderingMode="original" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
