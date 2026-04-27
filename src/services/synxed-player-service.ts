import { SYNXED_API_KEY, SYNXED_SERVER_URL } from "@/config/synxed";

import type { SynxedPlayer, SynxedPlayerState } from "synxed-sdk";

type PlayerEvent =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "stateChange"; state: SynxedPlayerState }
  | { type: "timeUpdate"; currentTime: number; duration: number }
  | { type: "trackChange"; catalogTrackId?: string; title?: string }
  | { type: "error"; error: string };

type Listener = (event: PlayerEvent) => void;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

class SynxedPlayerService {
  private player: SynxedPlayer | null = null;
  private listeners = new Set<Listener>();
  private initialized = false;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: PlayerEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!SYNXED_API_KEY) {
      this.emit({
        type: "error",
        error:
          "Synxed API key missing. Set EXPO_PUBLIC_SYNXED_API_KEY to enable licensed music.",
      });
      return;
    }

    try {
      const sdk = await import("synxed-sdk");
      this.player = new sdk.SynxedPlayer({
        apiKey: SYNXED_API_KEY,
        serverUrl: SYNXED_SERVER_URL,
        autoConnect: true,
      });

      this.player.on("connected", () => this.emit({ type: "connected" }));
      this.player.on("disconnected", () => this.emit({ type: "disconnected" }));
      this.player.on("stateChange", (state) =>
        this.emit({ type: "stateChange", state }),
      );
      this.player.on("timeUpdate", ({ currentTime, duration }) =>
        this.emit({ type: "timeUpdate", currentTime, duration }),
      );
      this.player.on("trackChange", (track) =>
        this.emit({
          type: "trackChange",
          catalogTrackId: track?.catalogTrackId,
          title: track?.title,
        }),
      );
      this.player.on("error", (error) =>
        this.emit({ type: "error", error: toErrorMessage(error) }),
      );
    } catch (error) {
      this.player = null;
      this.emit({
        type: "error",
        error:
          `Unable to load synxed-sdk. If using local development build, run npm link synxed-sdk. ` +
          `Details: ${toErrorMessage(error)}`,
      });
    }
  }

  async playSong(catalogTrackId: string): Promise<void> {
    if (!this.player) throw new Error("Synxed player is not initialized");
    await this.player.playSong({ catalogTrackId });
  }

  async playPlaylist(playlistCode: string): Promise<void> {
    if (!this.player) throw new Error("Synxed player is not initialized");
    await this.player.playPlaylist({ playlistCode });
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    await this.player.pause();
  }

  async resume(): Promise<void> {
    if (!this.player) return;
    await this.player.resume();
  }

  async stop(): Promise<void> {
    if (!this.player) return;
    await this.player.stop();
  }

  async setVolume(value: number): Promise<void> {
    if (!this.player) return;
    await this.player.setVolume(value);
  }

  async destroy(): Promise<void> {
    if (!this.player) return;
    await this.player.destroy();
    this.player = null;
    this.initialized = false;
  }
}

export const synxedPlayerService = new SynxedPlayerService();
