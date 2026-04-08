import { Alert, AppState, type AppStateStatus } from "react-native";

import { useAuthStore } from "@/store/auth-store";
import { useNetworkStore } from "@/store/network-store";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/** Pre-empt expiry by this many seconds to avoid using a stale token. */
const REFRESH_SKEW_SEC = 120;

/** Floor: never schedule a refresh sooner than 10 s from now. */
const MIN_REFRESH_DELAY_MS = 10_000;

/** Ceiling: cap the timer so setTimeout doesn't overflow on huge expiry values. */
const MAX_REFRESH_DELAY_MS = 10 * 60 * 1_000; // 10 min

// ─── SESSION MANAGER ──────────────────────────────────────────────────────────

/**
 * Proactive, network-aware token refresh scheduler.
 *
 * Lifecycle:
 *   1. `start()` after the user authenticates.
 *   2. Internally subscribes to auth-store, network-store, and AppState.
 *   3. Schedules a timer so the access token is refreshed *before* it expires.
 *   4. If the device goes offline, shows an alert once, cancels the timer,
 *      and re-evaluates as soon as connectivity is restored.
 *   5. `stop()` on logout.
 */
class SessionManager {
  // ── internal state ──────────────────────────────────────────────────────

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSub: ReturnType<typeof AppState.addEventListener> | null =
    null;
  private authUnsub: (() => void) | null = null;
  private networkUnsub: (() => void) | null = null;
  private running = false;
  private hasShownOfflineAlert = false;

  // ── public API ──────────────────────────────────────────────────────────

  /**
   * Begin proactive refresh scheduling.
   * Safe to call more than once — subsequent calls are no-ops.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.hasShownOfflineAlert = false;

    // 1. Kick off an immediate schedule evaluation.
    this.scheduleRefresh();

    // 2. Re-evaluate when the auth expiry changes (e.g. after a manual refresh).
    this.authUnsub = useAuthStore.subscribe((state, prev) => {
      if (state.accessExpiresAt !== prev.accessExpiresAt) {
        this.scheduleRefresh();
      }
      // If session was cleared externally, stop.
      if (!state.isAuthenticated && prev.isAuthenticated) {
        this.stop();
      }
    });

    // 3. Re-evaluate when network status changes.
    this.networkUnsub = useNetworkStore.subscribe((state, prev) => {
      if (state.isOnline && !prev.isOnline) {
        // Back online — reset the alert flag and try refreshing.
        this.hasShownOfflineAlert = false;
        this.scheduleRefresh();
      }
    });

    // 4. On app foreground, the timer may have drifted — re-evaluate.
    this.appStateSub = AppState.addEventListener(
      "change",
      this.handleAppState,
    );
  }

  /** Tear down all subscriptions and timers. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.clearTimer();
    this.appStateSub?.remove();
    this.appStateSub = null;
    this.authUnsub?.();
    this.authUnsub = null;
    this.networkUnsub?.();
    this.networkUnsub = null;
  }

  // ── private ─────────────────────────────────────────────────────────────

  private handleAppState = (nextState: AppStateStatus): void => {
    if (nextState === "active") {
      this.scheduleRefresh();
    }
  };

  /**
   * Compute how long until we need to refresh the token and set a timer.
   * If the token is already near-expiry or expired, execute immediately.
   */
  private scheduleRefresh(): void {
    this.clearTimer();
    if (!this.running) return;

    const { accessExpiresAt, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated || typeof accessExpiresAt !== "number") return;

    const nowSec = Math.floor(Date.now() / 1000);
    const refreshAtSec = accessExpiresAt - REFRESH_SKEW_SEC;

    if (refreshAtSec <= nowSec) {
      // Already past the refresh threshold — go now.
      void this.executeRefresh();
      return;
    }

    const delayMs = Math.min(
      Math.max((refreshAtSec - nowSec) * 1000, MIN_REFRESH_DELAY_MS),
      MAX_REFRESH_DELAY_MS,
    );

    this.refreshTimer = setTimeout(() => {
      void this.executeRefresh();
    }, delayMs);
  }

  /**
   * Perform the actual refresh.
   * Checks network first; shows alert if offline.
   */
  private async executeRefresh(): Promise<void> {
    if (!this.running) return;

    // ── Network gate ──────────────────────────────────────────────────
    const { isOnline } = useNetworkStore.getState();
    if (!isOnline) {
      if (!this.hasShownOfflineAlert) {
        this.hasShownOfflineAlert = true;
        Alert.alert(
          "You're offline",
          "Connect to the internet to keep your session active. We'll refresh your session automatically when you're back online.",
        );
      }
      // Don't schedule a retry — the network-change listener will trigger
      // `scheduleRefresh` when connectivity is restored.
      return;
    }

    // ── Refresh ───────────────────────────────────────────────────────
    const { refreshSession, isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    const newToken = await refreshSession();

    // On success the auth-store's `accessExpiresAt` updates, which triggers
    // our subscription → `scheduleRefresh()` is called automatically.
    // On failure `refreshSession` handles cleanup internally.
    if (!newToken && this.running) {
      // Transient failure — retry after a short delay.
      this.refreshTimer = setTimeout(() => {
        void this.executeRefresh();
      }, MIN_REFRESH_DELAY_MS);
    }
  }

  private clearTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export const sessionManager = new SessionManager();
