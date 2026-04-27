declare module "synxed-sdk" {
  export type SynxedStateStatus =
    | "idle"
    | "loading"
    | "playing"
    | "paused"
    | "error";

  export interface SynxedPlayerState {
    status: SynxedStateStatus;
    volume?: number;
    currentTrackId?: string | null;
    error?: string;
  }

  export interface SynxedPlayerConfig {
    apiKey: string;
    serverUrl: string;
    autoConnect?: boolean;
  }

  export interface SynxedPlayerEventMap {
    stateChange: (state: SynxedPlayerState) => void;
    timeUpdate: (data: { currentTime: number; duration: number }) => void;
    trackChange: (track: { catalogTrackId?: string; title?: string }) => void;
    connected: () => void;
    disconnected: () => void;
    error: (error: unknown) => void;
  }

  export class SynxedPlayer {
    constructor(config: SynxedPlayerConfig);
    playSong(options: { catalogTrackId: string }): Promise<void> | void;
    playPlaylist(options: { playlistCode: string }): Promise<void> | void;
    pause(): Promise<void> | void;
    resume(): Promise<void> | void;
    stop(): Promise<void> | void;
    skip(): Promise<void> | void;
    seek(ms: number): Promise<void> | void;
    setVolume(value: number): Promise<void> | void;
    destroy(): Promise<void> | void;
    on<K extends keyof SynxedPlayerEventMap>(
      event: K,
      callback: SynxedPlayerEventMap[K],
    ): void;
  }
}
