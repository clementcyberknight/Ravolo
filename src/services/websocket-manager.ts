import { Packr, Unpackr } from "msgpackr";

import { BACKEND_WS_URL } from "@/config/backend";
import { applyServerSync } from "@/services/state-sync";
import { useAuthStore } from "@/store/auth-store";

type WsMessage = {
  type: string;
  data?: unknown;
  payload?: unknown;
  code?: string;
  message?: string;
};

type RequestPayload = Record<string, unknown> | undefined;
type PendingRequest = {
  resolve: (message: WsMessage) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const packr = new Packr({ useRecords: false });
const unpackr = new Unpackr({ useRecords: false });

const PING_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RECONNECT_ATTEMPTS = 5;

function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function debugLog(label: string, payload?: unknown) {
  // Keep logs centralized so we can disable quickly later.
  if (payload === undefined) {
    console.log(`[ws] ${label}`);
    return;
  }

  try {
    console.log(`[ws] ${label}`, JSON.stringify(payload, null, 2));
  } catch {
    console.log(`[ws] ${label}`, payload);
  }

  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  const data =
    record?.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;

  if (Array.isArray(data?.plots)) {
    try {
      console.log("[ws] incoming plots", JSON.stringify(data.plots, null, 2));
    } catch {
      console.log("[ws] incoming plots", data.plots);
    }
  }
}

class WebsocketManager {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Set<(msg: WsMessage) => void>();
  private lastCloseWasUnauthorized = false;

  connect(accessToken: string) {
    debugLog("connect() called");
    this.token = accessToken;
    this.disconnect(false);

    const ws = new WebSocket(`${BACKEND_WS_URL}/ws?token=${accessToken}`);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      debugLog("connected");
      this.reconnectAttempts = 0;
      this.startPingLoop();
    };

    ws.onmessage = (event) => {
      const message = this.decode(event.data);
      if (!message || !message.type) return;
      debugLog("incoming", message);
      this.handleIncomingMessage(message);
    };

    ws.onerror = (event) => {
      debugLog("error", event);
    };

    ws.onclose = (event) => {
      this.stopPingLoop();
      this.lastCloseWasUnauthorized =
        event.code === 1006 && event.reason.includes("401 Unauthorized");
      debugLog("disconnected", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      if (this.socket === ws) this.socket = null;
      this.retryConnect();
    };

    this.socket = ws;
  }

  disconnect(clearToken = true) {
    debugLog("disconnect() called", { clearToken });
    this.stopPingLoop();
    this.pending.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error("Socket disconnected"));
    });
    this.pending.clear();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (clearToken) this.token = null;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  onMessage(listener: (msg: WsMessage) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(
    type: string,
    payload?: RequestPayload,
    expectResponse = true,
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<WsMessage> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Socket is not connected"));
    }

    const providedRequestId = getStringValue(payload?.requestId);
    const requestId = providedRequestId ?? generateRequestId();
    const finalPayload: Record<string, unknown> = {
      ...(payload ?? {}),
      requestId,
    };

    const envelope = { type, payload: finalPayload };
    debugLog("outgoing", envelope);
    this.socket.send(packr.pack(envelope));

    if (!expectResponse) {
      return Promise.resolve({ type: `${type}_SENT` });
    }

    return new Promise<WsMessage>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`${type} timed out`));
      }, timeoutMs);

      this.pending.set(requestId, {
        resolve,
        reject,
        timeoutId,
      });
    });
  }

  private decode(raw: unknown): WsMessage | null {
    try {
      if (typeof raw === "string") {
        return JSON.parse(raw) as WsMessage;
      }
      if (raw instanceof ArrayBuffer) {
        return unpackr.unpack(new Uint8Array(raw)) as WsMessage;
      }
      if (ArrayBuffer.isView(raw)) {
        return unpackr.unpack(new Uint8Array(raw.buffer)) as WsMessage;
      }
      return null;
    } catch {
      return null;
    }
  }

  private handleIncomingMessage(message: WsMessage) {
    applyServerSync(message);

    if (message.type === "ERROR") {
      const payload = message.payload as Record<string, unknown> | undefined;
      const requestId =
        getStringValue(payload?.requestId) ??
        getStringValue(payload?.requestEcho);
      if (requestId && this.pending.has(requestId)) {
        const pending = this.pending.get(requestId)!;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        pending.reject(
          new Error(message.message || message.code || "WS_ERROR"),
        );
      }
    } else {
      const payload = message.payload as Record<string, unknown> | undefined;
      const data = message.data as Record<string, unknown> | undefined;
      const requestId =
        getStringValue(payload?.requestId) ?? getStringValue(data?.requestId);

      if (requestId && this.pending.has(requestId)) {
        const pending = this.pending.get(requestId)!;
        clearTimeout(pending.timeoutId);
        this.pending.delete(requestId);
        pending.resolve(message);
      }
    }

    this.listeners.forEach((listener) => listener(message));
  }

  private retryConnect() {
    if (!this.token) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    this.reconnectAttempts += 1;
    const backoffMs = Math.min(12_000, 500 * 2 ** this.reconnectAttempts);
    debugLog("retry scheduled", {
      attempt: this.reconnectAttempts,
      backoffMs,
    });
    setTimeout(() => {
      if (!this.token) return;

      const authState = useAuthStore.getState();
      const getNextToken = this.lastCloseWasUnauthorized
        ? authState.refreshSession()
        : authState.getValidAccessToken();

      void getNextToken
        .then((nextToken) => {
          if (!nextToken) {
            debugLog("retry cancelled - no usable access token");
            return;
          }

          debugLog(
            this.lastCloseWasUnauthorized
              ? "retry connecting with refreshed access token"
              : "retry connecting with refreshed/valid token",
          );
          this.lastCloseWasUnauthorized = false;
          this.connect(nextToken);
        })
        .catch(() => undefined);
    }, backoffMs);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      this.send("PING", undefined, false).catch(() => undefined);
    }, PING_INTERVAL_MS);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const websocketManager = new WebsocketManager();
