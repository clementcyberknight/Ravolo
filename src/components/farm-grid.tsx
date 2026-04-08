import { Image } from "expo-image";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CROP_GUIDE, CropType } from "@/constants/crops";
import { useFarmStore } from "@/store/farm-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useServerTimeStore } from "@/store/server-time-store";
import { useGameStore } from "@/store/game-store";
import { websocketManager } from "@/services/websocket-manager";

const soilImage = require("@/assets/image/Gemini_Generated_Image_a8azi1a8azi1a8az.png");
const unlockImage = require("@/assets/image/farm-plot-it.png");

const cropAssets: Record<CropType, any> = {
  cacao: require("@/assets/image/assets_images_icons_crops_cacao.webp"),
  carrot: require("@/assets/image/assets_images_icons_crops_carrot.webp"),
  chili: require("@/assets/image/assets_images_icons_crops_chili.webp"),
  coffee_beans: require("@/assets/image/assets_images_icons_crops_coffee_beans.webp"),
  corn: require("@/assets/image/assets_images_icons_crops_corn.webp"),
  cotton: require("@/assets/image/assets_images_icons_crops_cotton.webp"),
  grapes: require("@/assets/image/assets_images_icons_crops_grapes.webp"),
  lavender: require("@/assets/image/assets_images_icons_crops_lavender.webp"),
  mud_pit: require("@/assets/image/assets_images_icons_crops_mud_pit.webp"),
  oat: require("@/assets/image/assets_images_icons_crops_oat.webp"),
  onion: require("@/assets/image/assets_images_icons_crops_onion.webp"),
  pepper: require("@/assets/image/assets_images_icons_crops_pepper.webp"),
  potato: require("@/assets/image/assets_images_icons_crops_potato.webp"),
  rice: require("@/assets/image/assets_images_icons_crops_rice.webp"),
  saffron: require("@/assets/image/assets_images_icons_crops_saffron.webp"),
  sapling_patch: require("@/assets/image/assets_images_icons_crops_sapling_patch.webp"),
  soybean: require("@/assets/image/assets_images_icons_crops_soybean.webp"),
  strawberry: require("@/assets/image/assets_images_icons_crops_strawberry.webp"),
  sugarcane: require("@/assets/image/assets_images_icons_crops_sugarcane.webp"),
  sunflower: require("@/assets/image/assets_images_icons_crops_sunflower.webp"),
  tea_leaves: require("@/assets/image/assets_images_icons_crops_tea_leaves.webp"),
  tomato: require("@/assets/image/assets_images_icons_crops_tomato.webp"),
  vanilla: require("@/assets/image/assets_images_icons_crops_vanilla.webp"),
  wheat: require("@/assets/image/assets_images_icons_crops_wheat.webp"),
};

const seedlingAssets: Record<CropType, any> = {
  cacao: require("@/assets/seedlings/cacao_seedling.png"),
  carrot: require("@/assets/seedlings/carrot_seedling.png"),
  chili: require("@/assets/seedlings/chile_seedling.png"),
  coffee_beans: require("@/assets/seedlings/coffee_beans.png"),
  corn: require("@/assets/seedlings/corn_seedling.png"),
  cotton: require("@/assets/seedlings/cotton_seedling.png"),
  grapes: require("@/assets/seedlings/grape_seedling.png"),
  lavender: require("@/assets/seedlings/lavender_seedling.png"),
  mud_pit: require("@/assets/seedlings/mud_pit.png"),
  oat: require("@/assets/seedlings/oat_seedling.png"),
  onion: require("@/assets/seedlings/onion_seedling.png"),
  pepper: require("@/assets/seedlings/pepper_seedling.png"),
  potato: require("@/assets/seedlings/potato_seedling.png"),
  rice: require("@/assets/seedlings/rice_seedling.png"),
  saffron: require("@/assets/seedlings/saffron_seedling.png"),
  sapling_patch: require("@/assets/seedlings/sapling_patch.png"),
  soybean: require("@/assets/seedlings/soyabeans_seedling.png"),
  strawberry: require("@/assets/seedlings/strawberry_seedling.png"),
  sugarcane: require("@/assets/seedlings/sugarcane_seedling.png"),
  sunflower: require("@/assets/seedlings/sunflower_seedling.png"),
  tea_leaves: require("@/assets/seedlings/tea_leaves.png"),
  tomato: require("@/assets/seedlings/tomatoes_seedling.png"),
  vanilla: require("@/assets/seedlings/vanilla_seedling.png"),
  wheat: require("@/assets/seedlings/wheat_seedling.png"),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCropName = (id: string) =>
  id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toLocalCropId(cropId: string): CropType {
  switch (cropId) {
    case "coffee":
      return "coffee_beans";
    case "tea":
      return "tea_leaves";
    case "sapling":
      return "sapling_patch";
    default:
      return cropId as CropType;
  }
}

function toBackendSeedInventoryKey(cropId: CropType): string {
  switch (cropId) {
    case "coffee_beans":
      return "seed:coffee";
    case "tea_leaves":
      return "seed:tea";
    case "sapling_patch":
      return "seed:sapling";
    default:
      return `seed:${cropId}`;
  }
}

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return "Ready!";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// ── Timer Hook ───────────────────────────────────────────────────────────────
// Ticks every second. When countdown hits 0 it calls onComplete exactly once.
// This is what triggers the planted → ready transition automatically.

function useTimer(
  plot: any,
  onComplete: () => void,
): { remaining: number; progress: number } {
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const getEstimatedServerNowMs = useServerTimeStore(
    (state) => state.getEstimatedServerNowMs,
  );

  // Use a ref so onComplete never goes stale inside the interval closure
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Separate ref to ensure onComplete fires only once per planting
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false; // reset every time plot changes

    if (plot?.status !== "planted" || !plot.plantedAt || !plot.cropId) {
      setRemaining(0);
      setProgress(0);
      return;
    }

    const cropDef = CROP_GUIDE[plot.cropId as CropType];
    if (!cropDef) return;

    const totalMs = cropDef.growthTime * 1000;
    const targetTime = plot.readyAt ?? plot.plantedAt + totalMs;

    const tick = () => {
      const now = getEstimatedServerNowMs();
      const diffMs = targetTime - now;
      const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
      const prog = Math.min(1, Math.max(0, (now - plot.plantedAt) / totalMs));

      setRemaining(diffSec);
      setProgress(prog);

      // ← THE CORE FIX: auto-transition to ready when time is up
      if (diffSec <= 0 && !firedRef.current) {
        firedRef.current = true;
        onCompleteRef.current();
      }
    };

    tick(); // run immediately — no blank first second
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [getEstimatedServerNowMs, plot?.status, plot?.plantedAt, plot?.readyAt, plot?.cropId]);

  return { remaining, progress };
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const pct = `${Math.min(100, Math.max(0, Math.round(progress * 100)))}%` as const;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: pct }]} />
    </View>
  );
}

// ── Farm Tile ─────────────────────────────────────────────────────────────────

const FarmTile = memo(function FarmTile({ id }: { id: string }) {
  const plot = useFarmStore((state) => state.plots[id]);
  const markReady = useFarmStore((state) => state.markReady);
  const applyPlantResult = useFarmStore((state) => state.applyPlantResult);
  const applyHarvestResult = useFarmStore((state) => state.applyHarvestResult);
  const selectedCropId = useFarmStore((state) => state.selectedCropId);
  const applyInventoryDelta = useInventoryStore((state) => state.applyInventoryDelta);
  const setEconomyFromServer = useGameStore((state) => state.setEconomyFromServer);
  const [isPlanting, setIsPlanting] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  // Called automatically by the timer when growthTime elapses
  const handleTimerComplete = useCallback(() => {
    markReady(id);
  }, [id, markReady]);

  const { remaining, progress } = useTimer(plot, handleTimerComplete);

  const toBackendCropId = (cropId: CropType): string => {
    switch (cropId) {
      case "coffee_beans":
        return "coffee";
      case "tea_leaves":
        return "tea";
      case "sapling_patch":
        return "sapling";
      default:
        return cropId;
    }
  };

  const handlePress = useCallback(async () => {
    if (!plot) return;
    const plotIndex = Number(plot.id.replace("plot-", ""));
    if (!Number.isFinite(plotIndex)) {
      return;
    }

    if (plot.status === "empty" && !isPlanting) {
      setIsPlanting(true);
      const requestId = generateRequestId();
      try {
        await new Promise<void>((resolve, reject) => {
          const unsubscribe = websocketManager.onMessage((message) => {
            if (message.type === "PLANT_OK") {
              const data =
                message.data && typeof message.data === "object"
                  ? (message.data as Record<string, unknown>)
                  : null;

              if (
                data &&
                typeof data.cropId === "string" &&
                typeof data.plantedAtMs === "number"
              ) {
                applyPlantResult({
                  plotId: plotIndex,
                  cropId: toLocalCropId(data.cropId),
                  plantedAtMs: data.plantedAtMs,
                  readyAtMs:
                    typeof data.readyAtMs === "number" ? data.readyAtMs : undefined,
                });
                applyInventoryDelta(
                  toBackendSeedInventoryKey(selectedCropId),
                  -1,
                  "seed",
                );

                if (typeof data.goldBalance === "number") {
                  setEconomyFromServer({ coins: data.goldBalance });
                }
              }

              unsubscribe();
              resolve();
              return;
            }

            if (message.type === "ERROR") {
              unsubscribe();
              reject(new Error(message.message || message.code || "PLANT_FAILED"));
            }
          });

          websocketManager
            .send(
              "PLANT",
              {
                plotId: plotIndex,
                cropId: toBackendCropId(selectedCropId),
                requestId,
              },
              false,
            )
            .catch((error) => {
              unsubscribe();
              reject(error);
            });
        });
      } catch (error) {
        console.log("[farm] plant failed", error);
      } finally {
        setIsPlanting(false);
      }
      return;
    }

    if (plot.status === "ready" && !isHarvesting) {
      setIsHarvesting(true);
      const requestId = generateRequestId();
      try {
        await new Promise<void>((resolve, reject) => {
          const unsubscribe = websocketManager.onMessage((message) => {
            if (message.type === "HARVEST_OK") {
              const data =
                message.data && typeof message.data === "object"
                  ? (message.data as Record<string, unknown>)
                  : null;

              if (
                data &&
                typeof data.itemId === "string" &&
                typeof data.quantity === "number"
              ) {
                applyHarvestResult(plotIndex);
                applyInventoryDelta(data.itemId, Math.max(0, data.quantity));
              }

              unsubscribe();
              resolve();
              return;
            }

            if (message.type === "ERROR") {
              unsubscribe();
              reject(new Error(message.message || message.code || "HARVEST_FAILED"));
            }
          });

          websocketManager
            .send(
              "HARVEST",
              {
                plotId: plotIndex,
                requestId,
              },
              false,
            )
            .catch((error) => {
              unsubscribe();
              reject(error);
            });
        });
      } catch (error) {
        console.log("[farm] harvest failed", error);
      } finally {
        setIsHarvesting(false);
      }
    }
    // "planted" tiles: no tap action — timer drives the transition
  }, [
    applyInventoryDelta,
    applyHarvestResult,
    applyPlantResult,
    isHarvesting,
    isPlanting,
    plot,
    selectedCropId,
    setEconomyFromServer,
  ]);

  if (!plot) return null;

  // ── EMPTY ────────────────────────────────────────────────────────────────
  if (plot.status === "empty") {
    return (
      <Pressable style={styles.tileWrapper} onPress={handlePress}>
        {({ pressed }) => (
          <View
            style={[
              styles.tile,
              styles.tileEmpty,
              pressed && !isPlanting && styles.tilePressed,
              isPlanting && styles.tileDisabled,
            ]}
          >
            <Image
              source={soilImage}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyIcon}>＋</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  // ── PLANTED ───────────────────────────────────────────────────────────────
  if (plot.status === "planted" && plot.cropId) {
    const cropId = plot.cropId;
    const isAlmostReady = remaining <= 30 && remaining > 0;
    return (
      <Pressable style={styles.tileWrapper} onPress={undefined}>
        <View
          style={[
            styles.tile,
            styles.tilePlanted,
            isAlmostReady && styles.tileAlmostReady,
          ]}
        >
          <Image
            source={seedlingAssets[cropId] ?? cropAssets[cropId]}
            style={styles.cropImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.cropName} numberOfLines={1} adjustsFontSizeToFit>
            {formatCropName(cropId)}
          </Text>
          <ProgressBar progress={progress} />
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
        </View>
      </Pressable>
    );
  }

  // ── READY ─────────────────────────────────────────────────────────────────
  if (plot.status === "ready" && plot.cropId) {
    const cropId = plot.cropId;
    return (
      <Pressable style={styles.tileWrapper} onPress={handlePress}>
        {({ pressed }) => (
          <View
            style={[
              styles.tile,
              styles.tileReady,
              pressed && !isHarvesting && styles.tilePressed,
              isHarvesting && styles.tileDisabled,
            ]}
          >
            <View style={styles.readyGlow} />
            <Image
              source={cropAssets[cropId]}
              style={styles.cropImageReady}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text
              style={styles.cropName}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCropName(cropId)}
            </Text>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>HARVEST</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  }

  return null;
});

// ── Buy Plot Tile ─────────────────────────────────────────────────────────────

const BuyPlotTile = memo(function BuyPlotTile() {
  const [isBuyingPlot, setIsBuyingPlot] = useState(false);

  const handleBuyPlot = useCallback(async () => {
    if (isBuyingPlot) {
      return;
    }

    setIsBuyingPlot(true);
    const requestId = generateRequestId();

    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((message) => {
          if (message.type === "BUY_PLOT_OK") {
            unsubscribe();
            resolve();
            return;
          }

          if (message.type === "ERROR") {
            unsubscribe();
            reject(new Error(message.message || message.code || "BUY_PLOT_FAILED"));
          }
        });

        websocketManager
          .send(
            "BUY_PLOT",
            {
              requestId,
            },
            false,
          )
          .catch((error) => {
            unsubscribe();
            reject(error);
          });
      });
    } catch (error) {
      console.log("[farm] buy plot failed", error);
    } finally {
      setIsBuyingPlot(false);
    }
  }, [isBuyingPlot]);

  return (
    <Pressable style={styles.tileWrapper} onPress={handleBuyPlot}>
      {({ pressed }) => (
        <View
          style={[
            styles.tile,
            styles.tileBuy,
            pressed && !isBuyingPlot && styles.tilePressed,
            isBuyingPlot && styles.tileDisabled,
          ]}
        >
          <Image
            source={unlockImage}
            style={styles.buyImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.buyText}>Unlock</Text>
        </View>
      )}
    </Pressable>
  );
});

// ── Farm Grid ─────────────────────────────────────────────────────────────────

export const FarmGrid = memo(function FarmGrid() {
  const plotIds = useFarmStore((state) => state.plotIds);

  return (
    <View style={styles.grid}>
      {Array.isArray(plotIds) &&
        plotIds.map((id) => <FarmTile key={id} id={id} />)}
      {plotIds.length < 32 && <BuyPlotTile />}
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
    justifyContent: "flex-start",
  },
  tileWrapper: {
    width: "22.5%",
    aspectRatio: 1,
  },
  tile: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    overflow: "hidden",
    borderWidth: 1.5,
  },
  tilePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  tileDisabled: {
    opacity: 0.55,
  },

  // Empty
  tileEmpty: {
    backgroundColor: "transparent",
    borderColor: "rgba(180,140,90,0.5)",
    borderStyle: "dashed",
    padding: 0,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  emptyIcon: {
    fontSize: 22,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    lineHeight: 26,
  },

  // Planted
  tilePlanted: {
    backgroundColor: "#FFFBF0",
    borderColor: "rgba(255,176,56,0.35)",
    borderStyle: "solid",
    gap: 3,
  },
  tileAlmostReady: {
    backgroundColor: "#F0FBE8",
    borderColor: "rgba(113,179,18,0.45)",
  },
  cropImage: {
    width: "62%",
    height: "42%",
    opacity: 0.72,
  },

  // Ready
  tileReady: {
    backgroundColor: "#F0FBE8",
    borderColor: "#71B312",
    borderStyle: "solid",
    borderWidth: 2,
    gap: 3,
  },
  readyGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 13,
    backgroundColor: "rgba(113,179,18,0.08)",
  },
  cropImageReady: {
    width: "65%",
    height: "44%",
  },
  readyBadge: {
    backgroundColor: "#71B312",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  readyBadgeText: {
    fontSize: 7,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.4,
  },

  // Buy / Unlock
  tileBuy: {
    backgroundColor: "#FAF7F2",
    borderColor: "rgba(3,32,24,0.12)",
    borderStyle: "dashed",
    gap: 3,
  },
  buyImage: {
    width: "55%",
    height: "45%",
    opacity: 0.5,
  },
  buyText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "rgba(3,32,24,0.35)",
    letterSpacing: 0.3,
  },

  // Shared text
  cropName: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
    width: "100%",
    textAlign: "center",
  },
  timerText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    color: "rgba(3,32,24,0.50)",
    textAlign: "center",
  },

  // Progress bar
  progressTrack: {
    width: "85%",
    height: 4,
    backgroundColor: "rgba(3,32,24,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#71B312",
    borderRadius: 3,
  },
});
