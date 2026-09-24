import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import { keypairFromStoredSecret } from "@/services/sui-wallet-auth";

const walletStorage = createMMKV({
  id: "wallet-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => walletStorage.set(name, value),
  getItem: (name) => walletStorage.getString(name) ?? null,
  removeItem: (name) => walletStorage.remove(name),
};

type LocalWallet = {
  address: string;
  createdAt: number;
};

interface WalletState {
  localWallet: LocalWallet | null;
  restoreLocalWallet: () => Promise<LocalWallet | null>;
  createLocalWallet: () => Promise<LocalWallet>;
  getLocalKeypair: () => Promise<Ed25519Keypair | null>;
}

const WALLET_SECRET_KEY = "wallet.local.suiSecretKey";

function walletFromKeypair(keypair: Ed25519Keypair): LocalWallet {
  return {
    address: keypair.toSuiAddress(),
    createdAt: Date.now(),
  };
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      localWallet: null,
      restoreLocalWallet: async () => {
        const existingWallet = get().localWallet;
        if (existingWallet) {
          return existingWallet;
        }

        const keypair = await get().getLocalKeypair();
        if (!keypair) {
          return null;
        }

        const wallet = walletFromKeypair(keypair);
        set({ localWallet: wallet });
        return wallet;
      },
      createLocalWallet: async () => {
        const existingWallet = await get().restoreLocalWallet();
        if (existingWallet) {
          return existingWallet;
        }

        const keypair = Ed25519Keypair.generate();
        await SecureStore.setItemAsync(WALLET_SECRET_KEY, keypair.getSecretKey(), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });

        const wallet = walletFromKeypair(keypair);
        set({ localWallet: wallet });
        return wallet;
      },
      getLocalKeypair: async () => {
        const raw = await SecureStore.getItemAsync(WALLET_SECRET_KEY);
        if (!raw) {
          return null;
        }

        return keypairFromStoredSecret(raw);
      },
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
