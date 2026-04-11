import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface AuthenticatingModalProps {
  visible: boolean;
  mode: "authenticating" | "creating_wallet";
  /** Which chain onboarding is using (copy only). */
  chain: "solana" | "monad";
}

export const AuthenticatingModal = ({
  visible,
  mode,
  chain,
}: AuthenticatingModalProps) => {
  const title =
    mode === "creating_wallet" ? "Creating wallet" : "Authenticating";
  const chainLabel = chain === "monad" ? "Monad" : "Solana";
  const subtitle =
    mode === "creating_wallet"
      ? `Setting up your secure ${chainLabel} wallet...`
      : "Checking your device status...";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.dismissArea} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#0D631B" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
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
});
