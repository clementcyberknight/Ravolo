import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useMusicStore } from "@/store/music-store";

function prettyMs(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SynxedMiniPlayer() {
  const {
    initialize,
    connected,
    status,
    error,
    queueInput,
    inputMode,
    currentTrackId,
    currentTrackTitle,
    currentTime,
    duration,
    setQueueInput,
    setInputMode,
    play,
    pause,
    resume,
    stop,
  } = useMusicStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const isPlaying = status === "playing";
  const canResume = status === "paused";

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Licensed Music</Text>
        <Text style={[styles.badge, connected ? styles.online : styles.offline]}>
          {connected ? "CONNECTED" : "OFFLINE"}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setInputMode("track")}
          style={[styles.modeBtn, inputMode === "track" && styles.modeActive]}
        >
          <Text
            style={[styles.modeText, inputMode === "track" && styles.modeTextActive]}
          >
            Track
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setInputMode("playlist")}
          style={[styles.modeBtn, inputMode === "playlist" && styles.modeActive]}
        >
          <Text
            style={[
              styles.modeText,
              inputMode === "playlist" && styles.modeTextActive,
            ]}
          >
            Playlist
          </Text>
        </Pressable>
      </View>

      <TextInput
        value={queueInput}
        onChangeText={setQueueInput}
        placeholder={inputMode === "track" ? "catalogTrackId" : "playlistCode"}
        placeholderTextColor="#6B7280"
        style={styles.input}
      />

      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={() => void play()}>
          <Text style={styles.controlText}>Play</Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, !isPlaying && styles.disabledBtn]}
          disabled={!isPlaying}
          onPress={() => void pause()}
        >
          <Text style={styles.controlText}>Pause</Text>
        </Pressable>
        <Pressable
          style={[styles.controlBtn, !canResume && styles.disabledBtn]}
          disabled={!canResume}
          onPress={() => void resume()}
        >
          <Text style={styles.controlText}>Resume</Text>
        </Pressable>
        <Pressable style={styles.stopBtn} onPress={() => void stop()}>
          <Text style={styles.controlText}>Stop</Text>
        </Pressable>
      </View>

      <Text style={styles.nowPlaying} numberOfLines={1}>
        {currentTrackTitle ||
          currentTrackId ||
          "No track selected"}
      </Text>
      <Text style={styles.time}>
        {prettyMs(currentTime)} / {prettyMs(duration)} · {status}
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.08)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#032018",
    fontFamily: "Space Mono",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Space Mono",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  online: {
    color: "#0D631B",
    backgroundColor: "rgba(13,99,27,0.12)",
  },
  offline: {
    color: "#77574D",
    backgroundColor: "rgba(119,87,77,0.12)",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.2)",
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modeActive: {
    backgroundColor: "#032018",
    borderColor: "#032018",
  },
  modeText: {
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 12,
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    marginBottom: 10,
  },
  controls: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  controlBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#71B312",
    alignItems: "center",
    paddingVertical: 9,
  },
  stopBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#FF383C",
    alignItems: "center",
    paddingVertical: 9,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  controlText: {
    color: "#fff",
    fontFamily: "Space Mono",
    fontSize: 11,
    fontWeight: "700",
  },
  nowPlaying: {
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  time: {
    color: "#77574D",
    fontFamily: "Space Mono",
    fontSize: 11,
  },
  errorText: {
    marginTop: 6,
    color: "#FF383C",
    fontFamily: "Space Mono",
    fontSize: 11,
  },
});
