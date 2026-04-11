import { websocketManager } from "@/services/websocket-manager";

export function generateSyndicateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fire-and-forget WS send with a one-shot listener for `okType` or `ERROR`.
 * Matches the pattern used across `syndicate.tsx` (first matching response wins).
 */
export function syndicateWsCall<T extends Record<string, unknown>>(
  type: string,
  payload: Record<string, unknown>,
  okType: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = generateSyndicateRequestId();
    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === okType) {
        unsubscribe();
        resolve((msg.data ?? {}) as T);
      } else if (msg.type === "ERROR") {
        unsubscribe();
        reject(
          new Error(
            msg.message || (msg as { code?: string }).code || "Action failed",
          ),
        );
      }
    });

    void websocketManager
      .send(type, { ...payload, requestId }, false)
      .catch((e) => {
        unsubscribe();
        reject(e instanceof Error ? e : new Error(String(e)));
      });
  });
}
