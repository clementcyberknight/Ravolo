import { websocketManager } from "@/services/websocket-manager";

export function connectGameSocket(accessToken: string) {
  websocketManager.connect(accessToken);
  return null;
}

export function getGameSocket(): WebSocket | null {
  return null;
}

export function disconnectGameSocket() {
  websocketManager.disconnect();
}

export function sendGameSocketMessage(payload: unknown) {
  const typedPayload =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const type =
    typeof typedPayload.type === "string" ? typedPayload.type : "PING";
  const actionPayload =
    typedPayload.payload && typeof typedPayload.payload === "object"
      ? (typedPayload.payload as Record<string, unknown>)
      : undefined;
  websocketManager.send(type, actionPayload, false).catch(() => undefined);
}
