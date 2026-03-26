import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppStore } from '@/store/app-store';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    badge: 'COLLECTIVE POWER',
    title: { black: 'Grow Your ', green: 'Farm' },
    description: 'Manipulate the economy, trade P2P, and redistribute wealth through farmer protests. No one survives the market alone.',
    image: require('@/assets/onboarding-image/community-farming.png'),
  },
  {
    badge: 'SYNDICATE PULSE',
    title: { black: 'Join a ', green: 'Syndicate.' },
    description: 'Build your cartel, dominate the leaderboards, and wage economic warfare. Power is the only resource that matters.',
    image: require('@/assets/onboarding-image/community-farming.png'),
  },
  {
    badge: 'MARKET CONTROL',
    title: { black: 'Rule The ', green: 'Market' },
    description: 'Set prices, corner the supply, and watch as your competitors crumble. In the market world, greed is good.',
    image: require('@/assets/onboarding-image/community-farming.png'),
  },
  {
    badge: 'FARMER PROTEST',
    title: { black: 'Collective ', green: 'Action' },
    description: 'When the market fails, lead the protest. Secure your territory and protect your syndicate at all costs.',
    image: require('@/assets/onboarding-image/community-farming.png'),
  },
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const insets = useSafeAreaInsets();

  const currentSlide = ONBOARDING_DATA[index];
  const isLast = index === ONBOARDING_DATA.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setIndex(index + 1);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Image Area */}
      <View style={styles.imageWrapper}>
        <Animated.View 
          key={`image-${index}`}
          entering={FadeIn.duration(600)} 
          exiting={FadeOut.duration(400)}
          style={styles.imageContainer}
        >
          <Image
            source={currentSlide.image}
            style={styles.image}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(13, 99, 27, 0)', 'rgba(13, 99, 27, 0.4)']}
            style={styles.imageGradient}
          />
        </Animated.View>
      </View>

      {/* Content Area */}
      <View style={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <Animated.View 
            key={`content-${index}`}
            entering={SlideInDown.duration(600)} 
            exiting={SlideOutDown.duration(400)}
            style={styles.textContainer}
          >
            <View style={styles.badgeContainer}>
               <ThemedText style={styles.badgeText}>{currentSlide.badge}</ThemedText>
            </View>
            
            <ThemedText style={styles.title}>
              <ThemedText style={styles.titleBlack}>{currentSlide.title.black}</ThemedText>
              <ThemedText style={styles.titleGreen}>{currentSlide.title.green}</ThemedText>
            </ThemedText>

            <ThemedText style={styles.description}>
              {currentSlide.description}
            </ThemedText>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {index > 0 ? (
            <Pressable 
              style={styles.backButton} 
              onPress={handleBack}
            >
              <Image 
                source={require('@/assets/onboarding-image/back.png')}
                style={styles.backIconImage}
              />
              <ThemedText style={styles.backText}>BACK</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <View style={styles.pagination}>
            {ONBOARDING_DATA.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  i === index ? styles.activeDot : styles.inactiveDot
                ]} 
              />
            ))}
          </View>

          <Pressable
            style={styles.nextButtonWrapper}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#0D631B', '#2E7D32']}
              locations={[0, 1]}
              style={styles.nextButton}
            >
              <ThemedText style={styles.nextButtonText}>{isLast ? 'START' : 'NEXT'}</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DAF8B7',
  },
  imageWrapper: {
    height: 380,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#DEE5D6',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 32,
    marginTop: -24,
    backgroundColor: '#DAF8B7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  textContainer: {
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#032018',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 24,
  },
  badgeText: {
    color: '#FFEEEA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  titleBlack: {
    fontSize: 48,
    color: '#171D14',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 44,
  },
  titleGreen: {
    fontSize: 48,
    color: '#0D631B',
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 44,
  },
  description: {
    fontSize: 18,
    color: '#77574D',
    lineHeight: 29,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  backButtonPlaceholder: {
    width: 60,
  },
  backIconImage: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  backText: {
    fontSize: 10,
    color: '#77574D',
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 15,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 12,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0D631B',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#DEE5D6',
  },
  nextButtonWrapper: {
    width: 160,
    height: 44,
    borderRadius: 2,
    overflow: 'hidden',
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 15,
  },
});
