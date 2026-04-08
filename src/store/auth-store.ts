import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import {
  AuthApiError,
  AuthProfile,
  isRefreshSessionTerminalError,
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

let refreshInFlight: Promise<string | null> | null = null;

function debugTokenLog(label: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`[auth] ${label}`);
    return;
  }

  try {
    console.log(`[auth] ${label}`, JSON.stringify(payload, null, 2));
  } catch {
    console.log(`[auth] ${label}`, payload);
  }
}

interface AuthState {
  isAuthenticated: boolean;
  accessExpiresAt: number | null;
  profile: AuthProfile | null;
  setSession: (payload: VerifyResponse) => Promise<void>;
  markSessionAvailable: () => void;
  clearSession: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  refreshSession: () => Promise<string | null>;
  getValidAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

function isValidSessionPayload(payload: VerifyResponse) {
  return (
    typeof payload.accessToken === "string" &&
    typeof payload.refreshToken === "string" &&
    typeof payload.accessExpiresAt === "number"
  );
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessExpiresAt: null,
      profile: null,
      setSession: async (payload) => {
        debugTokenLog("setSession() tokens", {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          accessExpiresAt: payload.accessExpiresAt,
        });

        if (!isValidSessionPayload(payload)) {
          throw new Error("Invalid session payload");
        }

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
      markSessionAvailable: () =>
        set((state) => ({
          isAuthenticated: true,
          accessExpiresAt: state.accessExpiresAt,
          profile: state.profile,
        })),
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
      getAccessToken: async () => {
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        debugTokenLog("getAccessToken()", { accessToken });
        return accessToken;
      },
      getRefreshToken: async () => {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        debugTokenLog("getRefreshToken()", { refreshToken });
        return refreshToken;
      },
      refreshSession: async () => {
        if (refreshInFlight) {
          return refreshInFlight;
        }

        const refreshToken = await get().getRefreshToken();
        if (!refreshToken) {
          debugTokenLog("refreshSession() skipped - no refresh token");
          return null;
        }

        refreshInFlight = (async () => {
          try {
            debugTokenLog("refreshSession() request", { refreshToken });
            const refreshed = await refreshAuthToken(refreshToken);
            debugTokenLog("refreshSession() response", {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              accessExpiresAt: refreshed.accessExpiresAt,
            });
            await get().setSession({
              ...refreshed,
              isNewUser: false,
            });
            return refreshed.accessToken;
          } catch (error) {
            debugTokenLog("refreshSession() failed", {
              refreshToken,
              code: error instanceof AuthApiError ? error.code : undefined,
              status: error instanceof AuthApiError ? error.status : undefined,
              error: error instanceof Error ? error.message : String(error),
            });

            if (isRefreshSessionTerminalError(error)) {
              debugTokenLog(
                `refreshSession() terminal error (${error.code}) - clearing auth session`,
              );
              await get().clearSession();
              return null;
            }

            // Never delete local credentials on transient refresh failure.
            // Only an explicit invalid/expired refresh token should clear auth.
            get().markSessionAvailable();
            return null;
          } finally {
            refreshInFlight = null;
          }
        })();

        return refreshInFlight;
      },
      getValidAccessToken: async () => {
        const accessToken = await get().getAccessToken();
        const refreshToken = await get().getRefreshToken();

        if (!accessToken) {
          if (!refreshToken) return null;
          const refreshedToken = await get().refreshSession();
          return refreshedToken;
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
        if (!refreshToken) {
          get().markSessionAvailable();
          return accessToken;
        }

        const refreshedToken = await get().refreshSession();
        if (refreshedToken) {
          return refreshedToken;
        }

        if (!get().isAuthenticated) {
          return null;
        }

        // Keep the last known access token locally so the user is not
        // forcibly logged out while offline; backend calls may still fail
        // until connectivity or sign-in is restored.
        get().markSessionAvailable();
        return accessToken;
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
