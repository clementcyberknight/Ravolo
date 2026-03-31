import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import {
  AuthProfile,
  logoutAuth,
  refreshAuthToken,
  VerifyResponse,
} from "@/services/auth-api";

const authStorage = createMMKV({
  id: "auth-storage",
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => authStorage.set(name, value),
  getItem: (name) => authStorage.getString(name) ?? null,
  removeItem: (name) => authStorage.remove(name),
};

const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";

interface AuthState {
  isAuthenticated: boolean;
  accessExpiresAt: number | null;
  profile: AuthProfile | null;
  setSession: (payload: VerifyResponse) => Promise<void>;
  clearSession: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  refreshSession: () => Promise<string | null>;
  getValidAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessExpiresAt: null,
      profile: null,
      setSession: async (payload) => {
        await Promise.all([
          SecureStore.setItemAsync(ACCESS_TOKEN_KEY, payload.accessToken, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, payload.refreshToken, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        ]);

        set({
          isAuthenticated: true,
          accessExpiresAt: payload.accessExpiresAt,
          profile: payload.profile,
        });
      },
      clearSession: async () => {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        ]);
        set({
          isAuthenticated: false,
          accessExpiresAt: null,
          profile: null,
        });
      },
      getAccessToken: async () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      getRefreshToken: async () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      refreshSession: async () => {
        const refreshToken = await get().getRefreshToken();
        if (!refreshToken) {
          return null;
        }

        try {
          const refreshed = await refreshAuthToken(refreshToken);
          await get().setSession({
            ...refreshed,
            isNewUser: false,
          });
          return refreshed.accessToken;
        } catch {
          await get().clearSession();
          return null;
        }
      },
      getValidAccessToken: async () => {
        const accessToken = await get().getAccessToken();
        const refreshToken = await get().getRefreshToken();

        if (!accessToken) {
          if (!refreshToken) return null;
          return get().refreshSession();
        }

        const accessExpiresAt = get().accessExpiresAt;
        if (typeof accessExpiresAt !== "number") {
          // If we don't know expiry, treat the current token as usable.
          return accessToken;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const skewSec = 120; // refresh when <= 2 min remaining
        const secondsLeft = accessExpiresAt - nowSec;

        if (secondsLeft > skewSec) {
          return accessToken;
        }

        // Token is close to expiry; refresh first.
        if (!refreshToken) return null;
        return get().refreshSession();
      },
      logout: async () => {
        const refreshToken = await get().getRefreshToken();
        if (refreshToken) {
          try {
            await logoutAuth(refreshToken);
          } catch {
            // Even if server logout fails, still clear local session.
          }
        }

        await get().clearSession();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessExpiresAt: state.accessExpiresAt,
        profile: state.profile,
      }),
    },
  ),
);
