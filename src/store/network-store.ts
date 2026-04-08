import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { create } from "zustand";

interface NetworkState {
  /** Whether the device has internet connectivity. Optimistic default: true. */
  isOnline: boolean;
}

/**
 * Reactive network status powered by NetInfo.
 *
 * Call `startNetworkMonitoring()` once at app boot (e.g. in the root layout).
 * The store updates automatically whenever connectivity changes.
 */
export const useNetworkStore = create<NetworkState>()(() => ({
  isOnline: true,
}));

let unsubscribe: (() => void) | null = null;

/**
 * Begin listening for network state changes.
 * Safe to call multiple times — subsequent calls are no-ops.
 * Returns a teardown function.
 */
export function startNetworkMonitoring(): () => void {
  if (unsubscribe) return unsubscribe;

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    // `isInternetReachable` can be null during initial probing; treat as online.
    const online = !!(
      state.isConnected && state.isInternetReachable !== false
    );
    useNetworkStore.setState({ isOnline: online });
  });

  return unsubscribe;
}

/**
 * Stop monitoring. Idempotent.
 */
export function stopNetworkMonitoring(): void {
  unsubscribe?.();
  unsubscribe = null;
}
