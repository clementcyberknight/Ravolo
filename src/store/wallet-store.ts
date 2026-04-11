import { Keypair } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

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
  /** Monad (EVM) local wallet — separate from Solana. */
  monadLocalWallet: LocalWallet | null;
  isSeekerAuthenticated: boolean;
  setSeekerAuthenticated: (value: boolean) => void;
  restoreLocalWallet: () => Promise<LocalWallet | null>;
  createLocalWallet: () => Promise<LocalWallet>;
  getLocalWalletSecretKey: () => Promise<Uint8Array | null>;
  restoreMonadLocalWallet: () => Promise<LocalWallet | null>;
  createMonadLocalWallet: () => Promise<LocalWallet>;
  getMonadPrivateKey: () => Promise<Hex | null>;
}

const WALLET_SECRET_KEY = "wallet.local.secretKey";
const WALLET_MONAD_PRIVATE_KEY = "wallet.monad.privateKey";

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      localWallet: null,
      monadLocalWallet: null,
      isSeekerAuthenticated: false,
      setSeekerAuthenticated: (value) => set({ isSeekerAuthenticated: value }),
      restoreLocalWallet: async () => {
        const existingWallet = get().localWallet;
        if (existingWallet) {
          console.log("[wallet-store] Utilizing previously loaded wallet from memory:", existingWallet.address);
          return existingWallet;
        }

        const secretKey = await get().getLocalWalletSecretKey();
        if (!secretKey) {
          console.log("[wallet-store] No local wallet found in secure storage.");
          return null;
        }

        try {
          const keypair = Keypair.fromSecretKey(secretKey);
          const wallet = {
            address: keypair.publicKey.toBase58(),
            createdAt: Date.now(),
          };
          console.log("[wallet-store] Restored existing local wallet from secure storage:", wallet.address);
          set({ localWallet: wallet });
          return wallet;
        } catch {
          console.error("[wallet-store] Failed to restore local wallet from secret key.");
          return null;
        }
      },
      createLocalWallet: async () => {
        console.log("[wallet-store] createLocalWallet() called. Checking for existing wallet...");
        const existingWallet = await get().restoreLocalWallet();
        if (existingWallet) {
          console.log("[wallet-store] Utilizing existing wallet instead of creating a new one:", existingWallet.address);
          return existingWallet;
        }

        console.log("[wallet-store] Generating a NEW local wallet...");
        const keypair = Keypair.generate();
        await SecureStore.setItemAsync(
          WALLET_SECRET_KEY,
          JSON.stringify(Array.from(keypair.secretKey)),
          {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          },
        );

        const wallet = {
          address: keypair.publicKey.toBase58(),
          createdAt: Date.now(),
        };

        console.log("[wallet-store] Successfully created and stored new wallet:", wallet.address);
        set({ localWallet: wallet });
        return wallet;
      },
      getLocalWalletSecretKey: async () => {
        const raw = await SecureStore.getItemAsync(WALLET_SECRET_KEY);
        if (!raw) {
          return null;
        }

        try {
          const parsed = JSON.parse(raw) as number[];
          if (!Array.isArray(parsed)) {
            return null;
          }
          return new Uint8Array(parsed);
        } catch {
          return null;
        }
      },
      restoreMonadLocalWallet: async () => {
        const cached = get().monadLocalWallet;
        if (cached) {
          return cached;
        }
        const pk = await get().getMonadPrivateKey();
        if (!pk) {
          return null;
        }
        try {
          const account = privateKeyToAccount(pk);
          const wallet: LocalWallet = {
            address: account.address,
            createdAt: Date.now(),
          };
          set({ monadLocalWallet: wallet });
          return wallet;
        } catch {
          return null;
        }
      },
      createMonadLocalWallet: async () => {
        const existing = await get().restoreMonadLocalWallet();
        if (existing) {
          return existing;
        }
        const pk = generatePrivateKey();
        await SecureStore.setItemAsync(WALLET_MONAD_PRIVATE_KEY, pk, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        const account = privateKeyToAccount(pk);
        const wallet: LocalWallet = {
          address: account.address,
          createdAt: Date.now(),
        };
        set({ monadLocalWallet: wallet });
        return wallet;
      },
      getMonadPrivateKey: async () => {
        const raw = await SecureStore.getItemAsync(WALLET_MONAD_PRIVATE_KEY);
        if (!raw || !raw.startsWith("0x")) {
          return null;
        }
        return raw as Hex;
      },
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
