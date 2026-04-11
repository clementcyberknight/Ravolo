import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import bs58 from "bs58";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { privateKeyToAccount } from "viem/accounts";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import nacl from "tweetnacl";

import { AuthenticatingModal } from "@/components/authenticating-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MONAD_MAINNET_CHAIN_ID } from "@/constants/auth-chain";
import { getAuthChallenge, verifyWalletSignature } from "@/services/auth-api";
import { websocketManager } from "@/services/websocket-manager";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";

const ONBOARDING_DATA = [
  {
    badge: "COLLECTIVE POWER",
    title: { black: "Grow Your ", green: "Farm" },
    description:
      "Manipulate the economy, trade P2P, and redistribute wealth through farmer protests. No one survives the market alone.",
    image: require("@/assets/onboarding-image/community-farming.png"),
  },
  {
    badge: "SYNDICATE PULSE",
    title: { black: "Join a ", green: "Syndicate." },
    description:
      "Build your cartel, dominate the leaderboards, and wage economic warfare. Power is the only resource that matters.",
    image: require("@/assets/onboarding-image/community-farming.png"),
  },
  {
    badge: "MARKET CONTROL",
    title: { black: "Rule The ", green: "Market" },
    description:
      "Set prices, corner the supply, and watch as your competitors crumble. In the market world, greed is good.",
    image: require("@/assets/onboarding-image/community-farming.png"),
  },
  {
    badge: "FARMER PROTEST",
    title: { black: "Collective ", green: "Action" },
    description:
      "When the market fails, lead the protest. Secure your territory and protect your syndicate at all costs.",
    image: require("@/assets/onboarding-image/community-farming.png"),
  },
];

type OnboardingChain = "solana" | "monad";

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [selectedChain, setSelectedChain] = useState<OnboardingChain>("solana");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<
    "authenticating" | "creating_wallet"
  >("authenticating");
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const setSeekerAuthenticated = useWalletStore(
    (state) => state.setSeekerAuthenticated,
  );
  const restoreLocalWallet = useWalletStore(
    (state) => state.restoreLocalWallet,
  );
  const createLocalWallet = useWalletStore((state) => state.createLocalWallet);
  const getLocalWalletSecretKey = useWalletStore(
    (state) => state.getLocalWalletSecretKey,
  );
  const restoreMonadLocalWallet = useWalletStore(
    (state) => state.restoreMonadLocalWallet,
  );
  const createMonadLocalWallet = useWalletStore(
    (state) => state.createMonadLocalWallet,
  );
  const getMonadPrivateKey = useWalletStore(
    (state) => state.getMonadPrivateKey,
  );
  const setSession = useAuthStore((state) => state.setSession);
  const { account, connect, signMessage } = useMobileWallet();
  const insets = useSafeAreaInsets();

  const currentSlide = ONBOARDING_DATA[index];
  const isLast = index === ONBOARDING_DATA.length - 1;

  const isSeekerDevice = () => {
    const constants = Platform.constants as Record<string, unknown>;
    const model = constants?.Model ?? constants?.model;
    return model === "Seeker";
  };

  const handleNext = async () => {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }

    if (isAuthenticating) {
      return;
    }

    setIsAuthenticating(true);
    try {
      if (selectedChain === "monad") {
        const challenge = await getAuthChallenge({
          walletFamily: "eip155",
          chainId: MONAD_MAINNET_CHAIN_ID,
        });

        const existingWallet = await restoreMonadLocalWallet();
        setAuthMode(existingWallet ? "authenticating" : "creating_wallet");
        const wallet = existingWallet ?? (await createMonadLocalWallet());
        const privateKey = await getMonadPrivateKey();
        if (!privateKey) {
          throw new Error("Monad wallet private key is missing");
        }

        const account = privateKeyToAccount(privateKey);
        if (account.address !== wallet.address) {
          throw new Error("Monad wallet address mismatch");
        }

        const signature = await account.signMessage({
          message: challenge.message,
        });

        const authResult = await verifyWalletSignature({
          walletFamily: "eip155",
          chainId: MONAD_MAINNET_CHAIN_ID,
          wallet: account.address,
          signature,
          challengeId: challenge.challengeId,
        });

        await setSession(authResult);
        websocketManager.connect(authResult.accessToken);
        setSeekerAuthenticated(false);
        completeOnboarding();
        return;
      }

      const challenge = await getAuthChallenge({ walletFamily: "solana" });
      const challengePayload = new TextEncoder().encode(challenge.message);

      if (isSeekerDevice()) {
        setAuthMode("authenticating");
        const connectedAccount = account ?? (await connect());
        const signatureBytes = await signMessage(challengePayload);
        const authResult = await verifyWalletSignature({
          walletFamily: "solana",
          wallet: connectedAccount.address.toBase58(),
          signature: bs58.encode(signatureBytes),
          challengeId: challenge.challengeId,
        });

        await setSession(authResult);
        websocketManager.connect(authResult.accessToken);
        setSeekerAuthenticated(true);
      } else {
        const existingWallet = await restoreLocalWallet();
        setAuthMode(existingWallet ? "authenticating" : "creating_wallet");
        const wallet = existingWallet ?? (await createLocalWallet());
        const localSecretKey = await getLocalWalletSecretKey();
        if (!localSecretKey) {
          throw new Error("Local wallet private key is missing");
        }

        const signature = nacl.sign.detached(challengePayload, localSecretKey);
        const authResult = await verifyWalletSignature({
          walletFamily: "solana",
          wallet: wallet.address,
          signature: bs58.encode(signature),
          challengeId: challenge.challengeId,
        });

        await setSession(authResult);
        websocketManager.connect(authResult.accessToken);
        setSeekerAuthenticated(false);
      }

      completeOnboarding();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[onboarding] auth failed:", message, error);
    } finally {
      setIsAuthenticating(false);
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
            colors={["rgba(13, 99, 27, 0)", "rgba(13, 99, 27, 0.4)"]}
            style={styles.imageGradient}
          />
        </Animated.View>
      </View>

      {/* Content Area */}
      <View
        style={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
      >
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
              <ThemedText style={styles.badgeText}>
                {currentSlide.badge}
              </ThemedText>
            </View>

            <ThemedText style={styles.title}>
              <ThemedText style={styles.titleBlack}>
                {currentSlide.title.black}
              </ThemedText>
              <ThemedText style={styles.titleGreen}>
                {currentSlide.title.green}
              </ThemedText>
            </ThemedText>

            <ThemedText style={styles.description}>
              {currentSlide.description}
            </ThemedText>

            {isLast ? (
              <View style={styles.chainSection}>
                <ThemedText style={styles.chainSectionTitle}>Network</ThemedText>
                <View style={styles.chainRow}>
                  <Pressable
                    onPress={() => setSelectedChain("solana")}
                    style={[
                      styles.chainOption,
                      selectedChain === "solana" && styles.chainOptionSelected,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chainOptionText,
                        selectedChain === "solana" &&
                          styles.chainOptionTextSelected,
                      ]}
                    >
                      Solana
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedChain("monad")}
                    style={[
                      styles.chainOption,
                      selectedChain === "monad" && styles.chainOptionSelected,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.chainOptionText,
                        selectedChain === "monad" &&
                          styles.chainOptionTextSelected,
                      ]}
                    >
                      Monad
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {index > 0 ? (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Image
                source={require("@/assets/onboarding-image/back.png")}
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
                  i === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          <Pressable
            style={styles.nextButtonWrapper}
            onPress={handleNext}
            disabled={isAuthenticating}
          >
            <LinearGradient
              colors={["#0D631B", "#2E7D32"]}
              locations={[0, 1]}
              style={styles.nextButton}
            >
              <ThemedText style={styles.nextButtonText}>
                {isLast ? "START" : "NEXT"}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
      <AuthenticatingModal
        visible={isAuthenticating}
        mode={authMode}
        chain={selectedChain === "monad" ? "monad" : "solana"}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DAF8B7",
  },
  imageWrapper: {
    height: 380,
    marginHorizontal: 16,
    marginTop: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    backgroundColor: "#DEE5D6",
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 32,
    marginTop: -24,
    backgroundColor: "#DAF8B7",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: "space-between",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  textContainer: {},
  badgeContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#032018",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 24,
  },
  badgeText: {
    color: "#FFEEEA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  titleBlack: {
    fontSize: 48,
    color: "#171D14",
    fontWeight: "700",
    textTransform: "uppercase",
    lineHeight: 44,
  },
  titleGreen: {
    fontSize: 48,
    color: "#0D631B",
    fontWeight: "700",
    textTransform: "uppercase",
    lineHeight: 44,
  },
  description: {
    fontSize: 18,
    color: "#77574D",
    lineHeight: 29,
    fontWeight: "500",
  },
  chainSection: {
    marginTop: 28,
  },
  chainSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#032018",
    marginBottom: 12,
  },
  chainRow: {
    flexDirection: "row",
    gap: 12,
  },
  chainOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DEE5D6",
    alignItems: "center",
  },
  chainOptionSelected: {
    borderColor: "#0D631B",
    backgroundColor: "rgba(13, 99, 27, 0.08)",
  },
  chainOptionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#77574D",
  },
  chainOptionTextSelected: {
    color: "#0D631B",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 40,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
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
    color: "#77574D",
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 15,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 12,
  },
  activeDot: {
    width: 24,
    backgroundColor: "#0D631B",
  },
  inactiveDot: {
    width: 8,
    backgroundColor: "#DEE5D6",
  },
  nextButtonWrapper: {
    width: 160,
    height: 44,
    borderRadius: 2,
    overflow: "hidden",
  },
  nextButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  nextButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 15,
  },
});
