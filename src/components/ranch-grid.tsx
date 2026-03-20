import { ASSET_MAP } from "@/components/inventory-modal";
import { useGameStore } from "@/stores/game-store";
import {
  FACILITY_CONFIG,
  FacilityType,
  useRanchStore,
} from "@/stores/ranch-store";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const feedSackIcon = require("@/assets/image/assets_images_icons_crafts_chicken_feed.webp");
const crateIcon = require("@/assets/image/assets_images_icons_misc_delivery_crate.webp");
const lockIcon = require("@/assets/image/assets_images_icons_misc_lock.webp");
const diamondIcon = require("@/assets/image/assets_images_icons_misc_diamonds.webp");
const hourglassIcon = require("@/assets/image/assets_images_icons_misc_hourglass.webp");

const useTick = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return tick;
};

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export const RanchGrid = () => {
  const tick = useTick();
  const userLevel = useGameStore((state) => state.xp / 100);
  const facilitiesState = useRanchStore((state) => state.facilities);
  const feedFacility = useRanchStore((state) => state.feedFacility);
  const collectProduct = useRanchStore((state) => state.collectProduct);

  const facilityKeys = FACILITY_CONFIG
    ? (Object.keys(FACILITY_CONFIG) as FacilityType[])
    : [];

  useEffect(() => {
    const state = useRanchStore.getState();
    let hasUpdates = false;

    facilityKeys.forEach((id) => {
      const fac = state.facilities[id];
      const config = FACILITY_CONFIG[id];

      if (fac.producingSince !== null) {
        const elapsedMs = Date.now() - fac.producingSince;
        const totalMsReq = config.baseProductionTimeSec * 1000;

        if (elapsedMs >= totalMsReq) {
          hasUpdates = true;
          useRanchStore.setState((s) => {
            let newProducingSince = null;
            let newFeedCount = s.facilities[id].feedCount;
            let newReadyCount = s.facilities[id].readyCount + 1;

            if (newFeedCount > 0) {
              newFeedCount -= 1;
              newProducingSince = Date.now();
            }

            return {
              facilities: {
                ...s.facilities,
                [id]: {
                  ...s.facilities[id],
                  producingSince: newProducingSince,
                  feedCount: newFeedCount,
                  readyCount: newReadyCount,
                },
              },
            };
          });
        }
      }
    });
  }, [tick]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.list}>
        {(() => {
          const list: React.ReactNode[] = [];
          if (!facilityKeys || !Array.isArray(facilityKeys)) return null;

          for (const id of facilityKeys) {
            const config = FACILITY_CONFIG?.[id];
            const state = facilitiesState?.[id];
            if (!config || !state) continue;

            const effectiveLevel = Math.max(1, Math.floor(userLevel));
            const isUnlocked = effectiveLevel >= config.unlockLevel;

            if (!isUnlocked) {
              list.push(
                <View key={id} style={[styles.card, styles.cardLocked]}>
                  <View style={styles.cardHeader}>
                    <Image
                      source={config.asset}
                      style={[styles.facilityImage, styles.imgGrayscale]}
                      contentFit="contain"
                    />
                    <View style={styles.cardHeaderInfo}>
                      <Text style={[styles.title, styles.textGrayscale]}>
                        {config.name}
                      </Text>
                      <Text style={styles.subtitle}>{config.description}</Text>
                    </View>
                    <Image
                      source={ASSET_MAP[config.product] || feedSackIcon}
                      style={[styles.smallIcon, styles.imgGrayscale]}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.lockedFooter}>
                    <Image
                      source={lockIcon}
                      style={styles.smallLockIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.lockedText}>
                      Unlocks at Level {config.unlockLevel}
                    </Text>
                  </View>
                </View>,
              );
              continue;
            }

            let timeRemaining = 0;
            if (state.producingSince) {
              const elapsed = (Date.now() - state.producingSince) / 1000;
              timeRemaining = Math.max(
                0,
                config.baseProductionTimeSec - elapsed,
              );
            }

            list.push(
              <Pressable
                key={id}
                style={styles.card}
                onPress={() =>
                  state.readyCount > 0 ? collectProduct(id) : feedFacility(id)
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.imageBox}>
                    <Image
                      source={config.asset}
                      style={styles.facilityImage}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.title}>{config.name}</Text>
                    <View style={styles.producesRow}>
                      <Text style={styles.producesText}>Produces</Text>
                      <Image
                        source={ASSET_MAP[config.product] || feedSackIcon}
                        style={styles.inlineProductIcon}
                        contentFit="contain"
                      />
                    </View>
                  </View>
                  <View style={styles.statsRight}>
                    <View style={styles.statBox}>
                      <Image
                        source={feedSackIcon}
                        style={styles.statIcon}
                        contentFit="contain"
                      />
                      <Text style={styles.statValue}>{state.feedCount}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Image
                        source={crateIcon}
                        style={styles.statIcon}
                        contentFit="contain"
                      />
                      <Text
                        style={[
                          styles.statValue,
                          state.readyCount > 0 && { color: "#4CAF50" },
                        ]}
                      >
                        {state.readyCount}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardFooter}>
                  <Text style={styles.levelText}>Lv.{state.level}</Text>
                  <View style={styles.timeRow}>
                    <Image
                      source={hourglassIcon}
                      style={styles.hourglassIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.timeText}>
                      {state.producingSince
                        ? formatTime(timeRemaining)
                        : formatTime(config.baseProductionTimeSec)}
                    </Text>
                  </View>
                  <View style={styles.speedUpRow}>
                    <Image
                      source={diamondIcon}
                      style={styles.diamondIcon}
                      contentFit="contain"
                    />
                    <Text style={styles.speedUpText}>2</Text>
                  </View>
                </View>
                {state.producingSince && (
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, (1 - timeRemaining / config.baseProductionTimeSec) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                )}
              </Pressable>,
            );
          }
          return list;
        })()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 150,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navGroup: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtnActive: {
    backgroundColor: "#7BC47F",
    borderColor: "#7BC47F",
  },
  navIconTxt: {
    fontSize: 16,
    color: "#444",
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EDEDED",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
    overflow: "hidden",
  },
  cardLocked: {
    backgroundColor: "#F7F8FA",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageBox: {
    width: 64,
    height: 64,
    backgroundColor: "#FFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  facilityImage: {
    width: 48,
    height: 48,
  },
  imgGrayscale: {
    opacity: 0.4,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  producesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  producesText: {
    fontSize: 14,
    color: "#888",
    marginRight: 6,
  },
  inlineProductIcon: {
    width: 16,
    height: 16,
  },
  textGrayscale: {
    color: "#999",
  },
  subtitle: {
    fontSize: 13,
    color: "#AAA",
    marginTop: 4,
  },
  statsRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
    justifyContent: "space-between",
  },
  statIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
  },
  smallIcon: {
    width: 24,
    height: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#555",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hourglassIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  speedUpRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  diamondIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  speedUpText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0088CC",
  },
  lockedFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  smallLockIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: "#C0A040",
  },
  lockedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C0A040",
  },
  progressBarBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#E0E0E0",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#7BC47F",
  },
});
