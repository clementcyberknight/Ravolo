import { Image } from "expo-image";
import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CropType, useFarmStore } from "@/stores/farm-store";
import { useGameStore } from "@/stores/game-store";

const soilImage = require("@/assets/image/Gemini_Generated_Image_a8azi1a8azi1a8az.png");
const growImage = require("@/assets/image/assets_images_icons_misc_grow.webp");
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

const formatCropName = (id: string) => {
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
};

const FarmTile = memo(function FarmTile({ id }: { id: string }) {
  const plot = useFarmStore((state) => state.plots[id]);
  const plantCrop = useFarmStore((state) => state.plantCrop);
  const growCrop = useFarmStore((state) => state.growCrop);
  const harvestCrop = useFarmStore((state) => state.harvestCrop);

  const addCoins = useGameStore((state) => state.addCoins);
  const addXp = useGameStore((state) => state.addXp);

  const handlePress = useCallback(() => {
    if (!plot) return;

    if (plot.status === "empty") {
      plantCrop(plot.id);
    } else if (plot.status === "planted") {
      growCrop(plot.id);
    } else if (plot.status === "ready") {
      harvestCrop(plot.id);
      addCoins(10);
      addXp(5);
    }
  }, [plot, plantCrop, growCrop, harvestCrop, addCoins, addXp]);

  if (!plot) return null;

  return (
    <Pressable style={styles.tileWrapper} onPress={handlePress}>
      <View
        style={[
          styles.tileContainer,
          plot.status === "empty" ? styles.emptyPlotContainer : null,
          plot.status === "ready" ? styles.readyPlotContainer : null,
        ]}
      >
        {plot.status === "empty" && (
          <Image
            source={soilImage}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}

        {plot.status === "planted" && plot.cropId && (
          <View style={styles.readyContent}>
            <Image
              source={growImage}
              style={styles.cropImageReady}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text
              style={styles.readyCropName}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCropName(plot.cropId)}
            </Text>
          </View>
        )}

        {plot.status === "ready" && plot.cropId && (
          <View style={styles.readyContent}>
            <Image
              source={cropAssets[plot.cropId]}
              style={styles.cropImageReady}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text
              style={styles.readyCropName}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCropName(plot.cropId)}
            </Text>
            <Text style={styles.readyLabel}>Ready!</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const BuyPlotTile = memo(function BuyPlotTile() {
  const buyPlot = useFarmStore((state) => state.buyPlot);

  return (
    <Pressable style={styles.tileWrapper} onPress={buyPlot}>
      <View style={[styles.tileContainer, styles.buyPlotContainer]}>
        <Image
          source={unlockImage}
          style={styles.cropImageFull}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    </Pressable>
  );
});

export const FarmGrid = memo(function FarmGrid() {
  const plotIds = useFarmStore((state) => state.plotIds);

  return (
    <View style={styles.gridContainer}>
      {Array.isArray(plotIds) && plotIds.map((id) => (
        <FarmTile key={id} id={id} />
      ))}
      {plotIds.length < 32 && <BuyPlotTile />}
    </View>
  );
});

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    justifyContent: "flex-start",
    gap: 8,
  },
  tileWrapper: {
    width: "22%", // 4 columns with gap
    aspectRatio: 1, // Keep it square
  },
  tileContainer: {
    flex: 1,
    backgroundColor: "#E6D7C3",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#C3A482",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    overflow: "hidden",
  },
  emptyPlotContainer: {
    backgroundColor: "transparent",
    padding: 0,
  },
  readyPlotContainer: {
    backgroundColor: "#E8F5E9",
    borderColor: "#81C784",
    borderStyle: "solid",
    padding: 4,
  },
  buyPlotContainer: {
    backgroundColor: "#FAF5EE",
    opacity: 0.8,
  },
  readyContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  cropImageFull: {
    width: "100%",
    height: "100%",
  },
  cropImageReady: {
    width: "60%",
    height: "50%",
  },
  readyCropName: {
    fontSize: 10,
    fontWeight: "800",
    color: "#333",
    marginTop: 2,
  },
  readyLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4CAF50",
  },
});
