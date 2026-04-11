import { syndicateWsCall } from "@/services/syndicate-ws-client";
import { useAuthStore } from "@/store/auth-store";
import { useSyndicateStore } from "@/store/syndicate-store";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft, HandCoins, Send } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phoenixIcon = require("@/assets/image/assets_images_icons_sanctuary_phoenix.webp");

function getMyUserId(): string | null {
  return useAuthStore.getState().profile?.id ?? null;
}

type ChatRow =
  | {
      kind: "chat";
      ts: number;
      userId: string;
      text: string;
    }
  | {
      kind: "help_request";
      ts: number;
      requestId: string;
      userId: string;
      goldAmount: number;
      message: string;
      status: string;
      fulfilledBy: string | null;
    }
  | {
      kind: "alert";
      ts: number;
      alertType: string;
      data: Record<string, unknown>;
    };

function shortUser(id: string): string {
  return id.length > 8 ? `${id.slice(0, 6)}…` : id;
}

function formatChatTime(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SyndicateChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { joinedSyndicate, dashboard } = useSyndicateStore();
  const [inputText, setInputText] = useState("");
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const myId = getMyUserId();
  const syndicateId = joinedSyndicate?.id;

  const loadHistory = useCallback(async () => {
    if (!syndicateId) return;
    try {
      const data = await syndicateWsCall<{ messages?: unknown[] }>(
        "SYNDICATE_CHAT_LIST",
        { syndicateId },
        "SYNDICATE_CHAT_LIST_OK",
      );
      const raw = Array.isArray(data.messages) ? data.messages : [];
      const parsed: ChatRow[] = [];
      for (const m of raw) {
        if (!m || typeof m !== "object") continue;
        const o = m as Record<string, unknown>;
        if (o.kind === "chat" && typeof o.userId === "string" && typeof o.text === "string") {
          parsed.push({
            kind: "chat",
            ts: typeof o.ts === "number" ? o.ts : 0,
            userId: o.userId,
            text: o.text,
          });
        } else if (o.kind === "help_request" && typeof o.requestId === "string") {
          parsed.push({
            kind: "help_request",
            ts: typeof o.ts === "number" ? o.ts : 0,
            requestId: o.requestId,
            userId: typeof o.userId === "string" ? o.userId : "",
            goldAmount: typeof o.goldAmount === "number" ? o.goldAmount : 0,
            message: typeof o.message === "string" ? o.message : "",
            status: typeof o.status === "string" ? o.status : "open",
            fulfilledBy:
              o.fulfilledBy === null || typeof o.fulfilledBy === "string"
                ? (o.fulfilledBy as string | null)
                : null,
          });
        } else if (o.kind === "alert" && typeof o.alertType === "string") {
          parsed.push({
            kind: "alert",
            ts: typeof o.ts === "number" ? o.ts : 0,
            alertType: o.alertType,
            data:
              o.data && typeof o.data === "object"
                ? (o.data as Record<string, unknown>)
                : {},
          });
        }
      }
      parsed.sort((a, b) => a.ts - b.ts);
      setRows(parsed);
    } catch (e) {
      console.warn("[syndicate-chat] list failed", e);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [syndicateId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadHistory();
  }, [loadHistory]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !syndicateId || sending) return;
    setSending(true);
    try {
      await syndicateWsCall(
        "SYNDICATE_CHAT_SEND",
        { syndicateId, text },
        "SYNDICATE_CHAT_SEND_OK",
      );
      setInputText("");
      await loadHistory();
    } catch (err) {
      Alert.alert(
        "Chat",
        err instanceof Error ? err.message : "Failed to send",
      );
    } finally {
      setSending(false);
    }
  }, [inputText, syndicateId, sending, loadHistory]);

  const askForGold = useCallback(() => {
    if (!syndicateId) return;

    const submit = (goldStr: string, message: string) => {
      const goldAmount = parseInt(goldStr, 10);
      if (!goldAmount || goldAmount <= 0 || goldAmount > 50_000) {
        Alert.alert("Help", "Gold must be between 1 and 50,000.");
        return;
      }
      void (async () => {
        try {
          await syndicateWsCall(
            "SYNDICATE_HELP_REQUEST",
            {
              syndicateId,
              goldAmount,
              message: message.trim() || "Need gold",
            },
            "SYNDICATE_HELP_REQUEST_OK",
          );
          await loadHistory();
          Alert.alert("Help", "Request posted.");
        } catch (err) {
          Alert.alert(
            "Help",
            err instanceof Error ? err.message : "Request failed",
          );
        }
      })();
    };

    if (Alert.prompt) {
      Alert.prompt(
        "Ask for gold",
        "Amount (max 50,000). Optional note in next step on some clients.",
        (text) => submit(text ?? "", "Need gold"),
        "plain-text",
        "",
      );
    } else {
      submit("1000", "Need gold");
    }
  }, [syndicateId, loadHistory]);

  const fulfill = useCallback(
    (helpRequestId: string) => {
      if (!syndicateId) return;
      void (async () => {
        try {
          await syndicateWsCall(
            "SYNDICATE_HELP_FULFILL",
            { syndicateId, helpRequestId },
            "SYNDICATE_HELP_FULFILL_OK",
          );
          await loadHistory();
        } catch (err) {
          Alert.alert(
            "Fulfill",
            err instanceof Error ? err.message : "Could not fulfill",
          );
        }
      })();
    },
    [syndicateId, loadHistory],
  );

  const listData = useMemo(() => rows, [rows]);

  const topPadding = Math.max(insets.top, 20) + 8;
  const clanName = joinedSyndicate?.name ?? "Syndicate";
  const clanLogo = joinedSyndicate?.logo || phoenixIcon;
  const memberLine = dashboard
    ? `${dashboard.totalMembers} members · ${dashboard.onlineCount} online`
    : "—";

  const renderItem = useCallback(
    ({ item }: { item: ChatRow }) => {
      if (item.kind === "alert") {
        return (
          <View style={styles.block}>
            <Text style={styles.msgTime}>{formatChatTime(item.ts)}</Text>
            <View style={styles.alertBubble}>
              <View style={styles.alertHeader}>
                <View style={[styles.tag, styles.systemTag]}>
                  <Text style={styles.tagText}>{item.alertType}</Text>
                </View>
              </View>
              <Text style={styles.chatText}>
                {JSON.stringify(item.data, null, 0)}
              </Text>
            </View>
          </View>
        );
      }

      if (item.kind === "help_request") {
        const open = item.status === "open";
        const mine = myId != null && item.userId === myId;
        const canFulfill = open && myId != null && !mine;

        return (
          <View style={styles.block}>
            <Text style={styles.msgTime}>{formatChatTime(item.ts)}</Text>
            <View style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <HandCoins size={18} color="#032018" />
                <Text style={styles.helpTitle}>
                  {shortUser(item.userId)} · {item.goldAmount.toLocaleString()}{" "}
                  gold
                </Text>
              </View>
              <Text style={styles.helpBody}>{item.message}</Text>
              <Text style={styles.helpMeta}>
                {open ? "Open" : "Closed"}
                {item.fulfilledBy
                  ? ` · by ${shortUser(item.fulfilledBy)}`
                  : ""}
              </Text>
              {canFulfill && (
                <TouchableOpacity
                  style={styles.fulfillBtn}
                  onPress={() => fulfill(item.requestId)}
                >
                  <Text style={styles.fulfillBtnText}>Fulfill</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }

      const isMe = myId != null && item.userId === myId;
      return (
        <View
          style={[styles.msgContainer, isMe && styles.msgContainerMe]}
        >
          <Text style={[styles.userLabel, isMe && styles.userLabelMe]}>
            {isMe ? "You" : shortUser(item.userId)}
          </Text>
          <View style={[styles.chatBubble, isMe && styles.chatBubbleMe]}>
            <Text style={[styles.chatText, isMe && styles.chatTextMe]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.msgTimeBelow, isMe && styles.msgTimeMe]}>
            {formatChatTime(item.ts)}
          </Text>
        </View>
      );
    },
    [fulfill, myId],
  );

  if (!joinedSyndicate) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <Text style={styles.headerTitle}>Join a syndicate to use chat.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkBack}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#032018" size={24} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.logoBox}>
            <Image source={clanLogo} style={styles.logo} contentFit="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {clanName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {memberLine}
            </Text>
          </View>
          <TouchableOpacity style={styles.askGoldBtn} onPress={askForGold}>
            <HandCoins size={20} color="#032018" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#71B312" />
        </View>
      ) : (
        <FlashList
          style={{ flex: 1 }}
          data={listData}
          renderItem={renderItem}
          estimatedItemSize={88}
          keyExtractor={(item, index) =>
            item.kind === "help_request"
              ? item.requestId
              : `${item.kind}-${item.ts}-${index}`
          }
          contentContainerStyle={styles.chatContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <View
        style={[
          styles.inputRow,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message syndicate..."
            placeholderTextColor="rgba(3, 32, 24, 0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => void handleSend()}
            editable={!sending}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, sending && { opacity: 0.5 }]}
          onPress={() => void handleSend()}
          disabled={sending}
        >
          <Send color="white" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  linkBack: {
    marginTop: 12,
    color: "#0D631B",
    fontFamily: "Space Mono",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#DAF8B7",
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  askGoldBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#DAF8B7",
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.45,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 8,
  },
  block: {
    marginBottom: 16,
  },
  msgContainer: {
    gap: 4,
    marginBottom: 12,
  },
  msgContainerMe: {
    alignItems: "flex-end",
  },
  userLabel: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.45,
    marginLeft: 4,
  },
  userLabelMe: {
    marginRight: 4,
    marginLeft: 0,
  },
  chatBubble: {
    backgroundColor: "#DAF8B7",
    padding: 16,
    borderRadius: 16,
    maxWidth: "85%",
  },
  chatBubbleMe: {
    backgroundColor: "#032018",
  },
  chatText: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
    lineHeight: 20,
  },
  chatTextMe: {
    color: "#DAF8B7",
  },
  msgTimeBelow: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.35,
    marginLeft: 4,
    marginTop: 2,
  },
  msgTimeMe: {
    marginRight: 4,
    marginLeft: 0,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.35,
    marginBottom: 6,
  },
  alertBubble: {
    backgroundColor: "#DAF8B7",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  systemTag: {
    backgroundColor: "#032018",
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "white",
  },
  helpCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.08)",
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  helpTitle: {
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  helpBody: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
    lineHeight: 20,
  },
  helpMeta: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "rgba(3,32,24,0.45)",
  },
  fulfillBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#71B312",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fulfillBtnText: {
    color: "white",
    fontWeight: "700",
    fontFamily: "Space Mono",
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#DAF8B7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    opacity: 0.85,
  },
  input: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#032018",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
