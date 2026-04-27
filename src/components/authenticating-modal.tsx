import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AuthenticatingModalProps {
  visible: boolean;
  mode: "selecting_network" | "authenticating" | "creating_wallet";
  /** Which chain onboarding is using (copy only). */
  chain: "solana" | "monad";
  onSelectChain?: (chain: "solana" | "monad") => void;
  onContinue?: () => void;
  onClose?: () => void;
}

export const AuthenticatingModal = ({
  visible,
  mode,
  chain,
  onSelectChain,
  onContinue,
  onClose,
}: AuthenticatingModalProps) => {
  const isSelecting = mode === "selecting_network";
  const title =
    mode === "creating_wallet" ? "Creating wallet" 
    : mode === "authenticating" ? "Authenticating" 
    : "Select Network";
  const chainLabel = chain === "monad" ? "Monad" : "Solana";
  const subtitle =
    mode === "creating_wallet"
      ? `Setting up your secure ${chainLabel} wallet...`
      : mode === "authenticating"
      ? "Checking your device status..."
      : "Choose your preferred blockchain.";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={() => { if (isSelecting && onClose) onClose(); }} />
        <View style={styles.content}>
          {!isSelecting && <ActivityIndicator size="large" color="#0D631B" />}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {isSelecting && (
            <View style={styles.chainSection}>
              <View style={styles.chainRow}>
                <Pressable
                  onPress={() => onSelectChain?.("solana")}
                  style={[
                    styles.chainOption,
                    chain === "solana" && styles.chainOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chainOptionText,
                      chain === "solana" && styles.chainOptionTextSelected,
                    ]}
                  >
                    Solana
                  </Text>
                </Pressable>
                {/* TODO: Roll out Monad in upcoming features
                <Pressable
                  onPress={() => onSelectChain?.("monad")}
                  style={[
                    styles.chainOption,
                    chain === "monad" && styles.chainOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chainOptionText,
                      chain === "monad" && styles.chainOptionTextSelected,
                    ]}
                  >
                    Monad
                  </Text>
                </Pressable>
                */}
              </View>

              <Pressable
                style={styles.continueButtonWrapper}
                onPress={onContinue}
              >
                <LinearGradient
                  colors={["#0D631B", "#2E7D32"]}
                  locations={[0, 1]}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueButtonText}>START</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    minHeight: 250,
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: "900",
    color: "#032018",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#6C6C6C",
    textAlign: "center",
  },
  chainSection: {
    marginTop: 32,
    width: "100%",
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
  continueButtonWrapper: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 24,
  },
  continueButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 18,
  },
});
