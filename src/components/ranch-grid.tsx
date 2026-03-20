import { Image } from 'expo-image';
import React, { memo, useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimalProduct, AnimalType, ANIMAL_CONFIG, useRanchStore } from '@/stores/ranch-store';
import { useGameStore } from '@/stores/game-store';

const unlockImage = require('@/assets/image/farm-plot-it.png');

const ANIMAL_SHELTER_ASSETS: Record<AnimalType, any> = {
  bee: require('@/assets/image/assets_images_icons_animals_apiary.webp'),
  chicken: require('@/assets/image/assets_images_icons_animals_chicken_coop.webp'),
  cow: require('@/assets/image/cartoon-holstein-cows-in-wooden-barn.png'),
  goat: require('@/assets/image/assets_images_icons_animals_goat_farm.webp'),
  pig: require('@/assets/image/assets_images_icons_animals_pigsty.webp'),
  sheep: require('@/assets/image/gemini_generated_image_9h4act9h4act9h4a.png'),
  silkworm: require('@/assets/image/assets_images_icons_animals_silkworm_house.webp'),
};

const SINGLE_ANIMAL_ASSETS: Record<AnimalType, any> = {
  bee: require('@/assets/image/assets_images_icons_animals_apiary.webp'), // Fallback
  chicken: require('@/assets/image/single-chick-asset.png'),
  cow: require('@/assets/image/single-cow-asset.png'),
  goat: require('@/assets/image/single-goat-asset.png'),
  pig: require('@/assets/image/single-pig-asset.png'),
  sheep: require('@/assets/image/single-sheep-asset.png'),
  silkworm: require('@/assets/image/single-slikworm-asset.png'),
};

const PRODUCT_ASSETS: Record<AnimalProduct, any> = {
  egg: require('@/assets/image/assets_images_icons_animalproducts_egg.webp'),
  goat_milk: require('@/assets/image/assets_images_icons_animalproducts_goat_milk.webp'),
  honey: require('@/assets/image/assets_images_icons_animalproducts_honey.webp'),
  milk: require('@/assets/image/assets_images_icons_animalproducts_milk.webp'),
  pork: require('@/assets/image/assets_images_icons_animalproducts_pork.webp'),
  silk: require('@/assets/image/assets_images_icons_animalproducts_silk_thread.webp'),
  wool: require('@/assets/image/assets_images_icons_animalproducts_wool.webp'),
};

interface ShopModalProps {
  visible: boolean;
  plotId: string | null;
  onClose: () => void;
}

const AnimalShopModal = ({ visible, plotId, onClose }: ShopModalProps) => {
  const buyAnimal = useRanchStore((state) => state.buyAnimal);
  const coins = useGameStore((state) => state.coins);
  const removeCoins = useGameStore((state) => state.removeCoins);

  const handleBuy = (type: AnimalType) => {
    if (!plotId) return;
    const config = ANIMAL_CONFIG[type];
    
    if (coins >= config.cost) {
      removeCoins(config.cost);
      buyAnimal(plotId, type);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Animal Shop</Text>
          <ScrollView contentContainerStyle={styles.shopGrid}>
            {(Object.keys(ANIMAL_CONFIG) as AnimalType[]).map((type) => {
              const config = ANIMAL_CONFIG[type];
              const canAfford = coins >= config.cost;

              return (
                <Pressable
                  key={type}
                  style={[styles.shopItem, !canAfford && styles.shopItemDisabled]}
                  onPress={() => handleBuy(type)}
                  disabled={!canAfford}
                >
                  <Image
                    source={SINGLE_ANIMAL_ASSETS[type]}
                    style={styles.shopImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                  <Text style={styles.shopItemName}>{config.name}</Text>
                  <Text style={styles.shopItemCost}>Cost: {config.cost} C</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const RanchTile = memo(function RanchTile({ id, onOpenShop }: { id: string, onOpenShop: (id: string) => void }) {
  const plot = useRanchStore((state) => state.plots[id]);
  const feedAnimal = useRanchStore((state) => state.feedAnimal);
  const growAnimal = useRanchStore((state) => state.growAnimal);
  const collectProduct = useRanchStore((state) => state.collectProduct);

  const addXp = useGameStore((state) => state.addXp);

  const handlePress = useCallback(() => {
    if (!plot) return;
    
    if (plot.status === 'empty') {
      onOpenShop(plot.id);
    } else if (plot.status === 'hungry') {
      const fed = feedAnimal(plot.id);
      if (fed) {
        // Fast mock growth for testing - instantly grow after 2 seconds
        setTimeout(() => growAnimal(plot.id), 2000);
      }
    } else if (plot.status === 'ready') {
      collectProduct(plot.id);
      addXp(15);
    }
  }, [plot, onOpenShop, feedAnimal, growAnimal, collectProduct, addXp]);

  if (!plot) return null;

  return (
    <Pressable style={styles.tileWrapper} onPress={handlePress}>
      <View style={[
        styles.tileContainer,
        plot.status === 'empty' ? styles.emptyPlotContainer : null,
        plot.status === 'ready' ? styles.readyPlotContainer : null,
      ]}>
        
        {plot.status === 'empty' && (
          <View style={styles.emptyHitbox}>
            <Text style={{ fontSize: 24, opacity: 0.2 }}>📦</Text>
          </View>
        )}
        
        {plot.animalType && plot.status !== 'empty' && (
           <View style={styles.contentFlex}>
             <Image
              source={ANIMAL_SHELTER_ASSETS[plot.animalType]}
              style={styles.shelterImage}
              contentFit="contain"
              cachePolicy="memory-disk"
             />
             
             {plot.status === 'hungry' && (
                <View style={styles.overlayPill}>
                  <Text style={styles.pillText}>Needs Food!</Text>
                </View>
             )}
             
             {plot.status === 'producing' && (
                <View style={styles.overlayPillBlue}>
                  <Text style={styles.pillText}>Producing...</Text>
                </View>
             )}
           </View>
        )}
        
        {plot.status === 'ready' && plot.animalType && (
          <View style={styles.overlayProductIcon}>
            <Image
              source={PRODUCT_ASSETS[ANIMAL_CONFIG[plot.animalType].product]}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        )}
      </View>
    </Pressable>
  );
});

const BuyRanchTile = memo(function BuyRanchTile() {
  const buyRanchPlot = useRanchStore((state) => state.buyRanchPlot);

  return (
    <Pressable style={styles.tileWrapper} onPress={buyRanchPlot}>
      <View style={[styles.tileContainer, styles.buyPlotContainer]}>
        <Image
          source={unlockImage}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    </Pressable>
  );
});

export const RanchGrid = memo(function RanchGrid() {
  const plotIds = useRanchStore((state) => state.plotIds);
  const [shopVisible, setShopVisible] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  const openShop = useCallback((plotId: string) => {
    setSelectedPlot(plotId);
    setShopVisible(true);
  }, []);

  return (
    <View style={styles.gridContainer}>
      {plotIds.map((id) => (
        <RanchTile key={id} id={id} onOpenShop={openShop} />
      ))}
      {plotIds.length < 16 && <BuyRanchTile />}
      <AnimalShopModal
        visible={shopVisible}
        plotId={selectedPlot}
        onClose={() => setShopVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'flex-start',
    gap: 8,
  },
  tileWrapper: {
    width: '46%', // 2 columns for ranch so they are bigger
    aspectRatio: 1,
  },
  tileContainer: {
    flex: 1,
    backgroundColor: '#D7E5C3', // Pastoral grassy green base
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9EBB7E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyPlotContainer: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#9EBB7E',
  },
  emptyHitbox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  readyPlotContainer: {
    backgroundColor: '#E8F5E9',
    borderColor: '#FFD700', // Gold rim
    borderWidth: 3,
  },
  buyPlotContainer: {
    backgroundColor: '#FAF5EE',
    opacity: 0.8,
    borderStyle: 'dashed',
  },
  contentFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  shelterImage: {
    width: '100%',
    height: '100%',
  },
  overlayProductIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  overlayPill: {
    position: 'absolute',
    top: 4,
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overlayPillBlue: {
    position: 'absolute',
    top: 4,
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  shopItem: {
    width: '46%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  shopItemDisabled: {
    opacity: 0.5,
  },
  shopImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  shopItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  shopItemCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
