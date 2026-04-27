import { create } from "zustand";

import { synxedPlayerService } from "@/services/synxed-player-service";

type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface MusicState {
  initialized: boolean;
  connected: boolean;
  status: PlaybackStatus;
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  queueInput: string;
  inputMode: "track" | "playlist";
  setQueueInput: (value: string) => void;
  setInputMode: (mode: "track" | "playlist") => void;
  initialize: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (value: number) => Promise<void>;
}

let removeListener: (() => void) | null = null;

export const useMusicStore = create<MusicState>()((set, get) => ({
  initialized: false,
  connected: false,
  status: "idle",
  currentTrackId: null,
  currentTrackTitle: null,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  error: null,
  queueInput: "",
  inputMode: "track",

  setQueueInput: (value) => set({ queueInput: value }),
  setInputMode: (mode) => set({ inputMode: mode }),

  initialize: async () => {
    if (get().initialized) return;

    removeListener?.();
    removeListener = synxedPlayerService.subscribe((event) => {
      switch (event.type) {
        case "connected":
          set({ connected: true, error: null });
          break;
        case "disconnected":
          set({ connected: false });
          break;
        case "stateChange":
          set({
            status: event.state.status,
            currentTrackId: event.state.currentTrackId ?? get().currentTrackId,
            error: event.state.error ?? null,
          });
          break;
        case "timeUpdate":
          set({ currentTime: event.currentTime, duration: event.duration });
          break;
        case "trackChange":
          set({
            currentTrackId: event.catalogTrackId ?? get().currentTrackId,
            currentTrackTitle: event.title ?? null,
            currentTime: 0,
          });
          break;
        case "error":
          set({ error: event.error, status: "error" });
          break;
      }
    });

    await synxedPlayerService.initialize();
    set({ initialized: true });
  },

  play: async () => {
    const { queueInput, inputMode } = get();
    const value = queueInput.trim();
    if (!value) {
      set({ error: "Enter a track id or playlist code to start playback." });
      return;
    }

    set({ status: "loading", error: null });
    try {
      if (inputMode === "track") {
        await synxedPlayerService.playSong(value);
      } else {
        await synxedPlayerService.playPlaylist(value);
      }
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  pause: async () => {
    await synxedPlayerService.pause();
    set({ status: "paused" });
  },

  resume: async () => {
    await synxedPlayerService.resume();
    set({ status: "playing" });
  },

  stop: async () => {
    await synxedPlayerService.stop();
    set({ status: "idle", currentTime: 0, duration: 0 });
  },

  setVolume: async (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    set({ volume: clamped });
    await synxedPlayerService.setVolume(clamped);
  },
}));
