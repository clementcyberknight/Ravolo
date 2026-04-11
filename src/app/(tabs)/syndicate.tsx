import { ASSET_MAP } from "@/components/inventory-modal";
import { ScreenHeader } from "@/components/screen-header";
import { SubTabs } from "@/components/sub-tabs";
import { ThemedView } from "@/components/themed-view";
import { useDebounce } from "@/hooks/use-debounce";
import { applyDepositBankSuccess } from "@/services/state-sync";
import { syndicateWsCall } from "@/services/syndicate-ws-client";
import { websocketManager } from "@/services/websocket-manager";
import { useGameStore } from "@/store/game-store";
import { useInventoryStore } from "@/store/inventory-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  MessageSquare,
  Plus,
  Search,
  Shield,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DashboardCommodity,
  DashboardMember,
  JoinRequest,
  SyndicateDashboard,
  useSyndicateStore,
} from "../../store/syndicate-store";

import { Syndicate } from "../../constants/syndicate-mock";
import { BottomTabInset } from "../../constants/theme";

const MICRO_PER_GOLD = 1000;

function formatGold(micro: number): string {
  const gold = micro / MICRO_PER_GOLD;
  if (gold >= 1_000_000) return `${(gold / 1_000_000).toFixed(1)}M`;
  if (gold >= 1_000) return `${(gold / 1_000).toFixed(1)}k`;
  return gold.toLocaleString();
}

function formatItemName(id: string) {
  return id
    .replace(/^seed:/, "")
    .replace(/^animal:/, "")
    .replace(/^tool:/, "")
    .replace(/^craft:/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function roleLabel(role: string): string {
  if (role === "owner") return "Grandmaster";
  if (role === "officer") return "Enforcer";
  return "Member";
}

function parseVisibility(raw: unknown): "public" | "private" {
  if (typeof raw === "string" && raw.toLowerCase() === "private") {
    return "private";
  }
  return "public";
}

function visibilityStatusLabel(visibility: "public" | "private" | undefined) {
  return visibility === "private" ? "Private" : "Public";
}

function joinActionState(
  syndicateId: string,
  memberCount: number,
  maxMembers: number,
  pendingJoinSyndicateId: string | null,
  joinInFlight: boolean,
) {
  const isFull = memberCount >= maxMembers;
  if (isFull) {
    return { label: "Full" as const, disabled: true };
  }
  if (pendingJoinSyndicateId === syndicateId) {
    return { label: "Requested" as const, disabled: true };
  }
  if (pendingJoinSyndicateId != null) {
    return { label: "Join" as const, disabled: true };
  }
  if (joinInFlight) {
    return { label: "Join" as const, disabled: true };
  }
  return { label: "Join" as const, disabled: false };
}

function generateRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getMyUserId(): string | null {
  try {
    const authStore = require("@/store/auth-store").useAuthStore;
    return authStore.getState().profile?.id ?? null;
  } catch {
    return null;
  }
}

function sendSyndicateAction(
  type: string,
  payload: Record<string, unknown>,
  okType: string,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === okType) {
        unsubscribe();
        resolve((msg.data ?? {}) as Record<string, unknown>);
      } else if (msg.type === "ERROR") {
        unsubscribe();
        reject(new Error(msg.message || (msg as any).code || "Action failed"));
      }
    });

    void websocketManager
      .send(type, { requestId: generateRequestId(), ...payload }, false)
      .catch((e) => {
        unsubscribe();
        reject(e);
      });
  });
}

const reindeerIcon = require("@/assets/image/assets_images_icons_sanctuary_reindeer.webp");
const phoenixIcon = require("@/assets/image/assets_images_icons_sanctuary_phoenix.webp");
const peacockIcon = require("@/assets/image/assets_images_icons_sanctuary_peacock.webp");
const pandaIcon = require("@/assets/image/assets_images_icons_sanctuary_panda.webp");
const flamingoIcon = require("@/assets/image/assets_images_icons_sanctuary_flamingo.webp");
const alpacaIcon = require("@/assets/image/assets_images_icons_sanctuary_alpaca.webp");

export const EMBLEM_MAP: Record<string, any> = {
  "emblem:reindeer": reindeerIcon,
  "emblem:phoenix": phoenixIcon,
  "emblem:peacock": peacockIcon,
  "emblem:panda": pandaIcon,
  "emblem:flamingo": flamingoIcon,
  "emblem:alpaca": alpacaIcon,
};

const CLAN_LOGO_KEYS = Object.keys(EMBLEM_MAP);

const crownIcon = require("@/assets/image/assets_images_icons_misc_crown.webp");
const coinsIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");

type Tab = "dashboard" | "bank" | "war" | "idol" | "roster";

const SYNDICATE_TABS = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "bank", label: "BANK" },
  { id: "war", label: "WAR" },
  { id: "idol", label: "IDOL" },
  { id: "roster", label: "ROSTER" },
];

export default function SyndicateScreen() {
  const {
    joinedSyndicate,
    joinSyndicate,
    syndicates,
    setSyndicates,
    pendingJoinSyndicateId,
    setPendingJoinSyndicateId,
    _hasHydrated,
  } = useSyndicateStore();
  const router = useRouter();

  const [selectedSyndicate, setSelectedSyndicate] = useState<Syndicate | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedMessage, setJoinedMessage] = useState<string | null>(null);
  const [joinInFlight, setJoinInFlight] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(CLAN_LOGO_KEYS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [minLevel, setMinLevel] = useState("1");
  const [minGold, setMinGold] = useState("0");

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchSyndicates = useCallback(async () => {
    setIsRefreshing(true);
    const requestId = `list-${Date.now()}`;

    try {
      await websocketManager.send(
        "LIST_SYNDICATE",
        {
          requestId,
          includePrivate: true,
        },
        false,
      );
    } catch (err) {
      console.error("Failed to fetch syndicates:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated) {
      fetchSyndicates();
    }
  }, [_hasHydrated, fetchSyndicates]);

  useEffect(() => {
    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === "LIST_SYNDICATE_OK") {
        const data = msg.data;
        const rawList: unknown[] = Array.isArray(data)
          ? data
          : data &&
              typeof data === "object" &&
              Array.isArray((data as { syndicates?: unknown }).syndicates)
            ? ((data as { syndicates: unknown[] }).syndicates ?? [])
            : [];
        // Map backend response to current UI model
        const mappedList: Syndicate[] = rawList.map((s: any) => ({
          id: s.id,
          name: s.name,
          rank: s.rank || 99,
          description: s.description || "",
          minLevel: s.levelPreferenceMin || 1,
          minAsset: s.goldPreferenceMin || 0,
          memberCount: s.members || 0,
          maxMembers: 50, // Default for now
          status: s.members >= 50 ? "Full" : "Open",
          visibility: parseVisibility(s.visibility),
          members: [], // Not provided in list view
        }));
        setSyndicates(mappedList);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [setSyndicates]);

  // Fetch full details when a syndicate is selected
  useEffect(() => {
    if (selectedSyndicate && selectedSyndicate.members.length === 0) {
      setIsLoadingDetails(true);
      const requestId = `view-${selectedSyndicate.id}`;
      void websocketManager.send(
        "VIEW_SYNDICATE",
        {
          requestId,
          syndicateId: selectedSyndicate.id,
        },
        false,
      );
    }
  }, [selectedSyndicate]);

  useEffect(() => {
    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === "VIEW_SYNDICATE_OK") {
        setIsLoadingDetails(false);
        const data = msg.data || {};
        const membersList = (data as any).membersList || [];

        setSelectedSyndicate((prev) => {
          if (!prev || prev.id !== (data as any).id) return prev;
          const d = data as Record<string, unknown>;
          return {
            ...prev,
            visibility: parseVisibility(d.visibility),
            members: membersList.map((m: any) => ({
              id: m.userId,
              name: m.name || `User ${m.userId.slice(0, 4)}`,
              role:
                m.role === "owner"
                  ? "Leader"
                  : m.role === "officer"
                    ? "Elder"
                    : "Member",
              level: m.level || 1,
              initial: (m.name || "M")[0].toUpperCase(),
            })),
          };
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleJoinRequest = async (syndicate: Syndicate) => {
    if (joinInFlight) return;
    if (pendingJoinSyndicateId === syndicate.id) return;
    if (
      pendingJoinSyndicateId != null &&
      pendingJoinSyndicateId !== syndicate.id
    ) {
      Alert.alert(
        "Request pending",
        "You already have a pending join request. Wait for a response before requesting another clan.",
      );
      return;
    }

    const requestId = `join-${Date.now()}`;
    setJoinInFlight(true);

    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((msg) => {
          if (msg.type === "REQUEST_JOIN_OK") {
            unsubscribe();
            const data = (msg.data || {}) as {
              ok?: boolean;
              status?: string;
            };

            if (data.status === "accepted") {
              setPendingJoinSyndicateId(null);
              setJoinedMessage(`Successfully joined ${syndicate.name}!`);
              joinSyndicate({
                id: syndicate.id,
                name: syndicate.name,
                rank: syndicate.rank,
                logo: peacockIcon,
                role: "Initiate",
                wealth: 0,
                memberCount: syndicate.memberCount + 1,
                maxMembers: syndicate.maxMembers,
                season: "Season 4 · Start",
              });
              setSelectedSyndicate(null);
              resolve();
              return;
            }

            if (data.ok === false) {
              reject(
                new Error(
                  (msg as { message?: string }).message ||
                    "Join request was rejected",
                ),
              );
              return;
            }

            setPendingJoinSyndicateId(syndicate.id);
            setJoinedMessage(`Application sent to ${syndicate.name}.`);
            resolve();
          } else if (msg.type === "ERROR") {
            unsubscribe();
            const code = (msg as { code?: string }).code;
            if (code === "ALREADY_IN_SYNDICATE") {
              reject(new Error("You are already in a syndicate."));
            } else if (code === "ALREADY_REQUESTED") {
              setPendingJoinSyndicateId(syndicate.id);
              reject(
                new Error(
                  "You already have a pending request for this syndicate.",
                ),
              );
            } else {
              reject(new Error(msg.message || "Failed to join syndicate"));
            }
          }
        });

        void websocketManager.send(
          "REQUEST_JOIN",
          { requestId, syndicateId: syndicate.id },
          false,
        );
      });
    } catch (err) {
      Alert.alert(
        "Error Joining",
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      setJoinInFlight(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!pendingJoinSyndicateId) return;
    const syndicateId = pendingJoinSyndicateId;
    const requestId = `cancel-join-${Date.now()}`;

    try {
      await new Promise<void>((resolve, reject) => {
        const unsubscribe = websocketManager.onMessage((msg) => {
          if (msg.type === "CANCEL_JOIN_REQUEST_OK") {
            unsubscribe();
            setPendingJoinSyndicateId(null);
            setJoinedMessage(null);
            resolve();
          } else if (msg.type === "ERROR") {
            unsubscribe();
            reject(new Error(msg.message || "Failed to cancel request"));
          }
        });

        void websocketManager.send(
          "CANCEL_JOIN_REQUEST",
          { requestId, syndicateId },
          false,
        );
      });
    } catch (err) {
      Alert.alert(
        "Cancel Failed",
        err instanceof Error ? err.message : "Could not cancel request",
      );
    }
  };

  const filteredSyndicates = syndicates.filter((s: Syndicate) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!_hasHydrated) return null;

  // ── SYNDICATE DETAIL VIEW ─────────────────────────────────────────────────
  if (selectedSyndicate) {
    const detailJoin = joinActionState(
      selectedSyndicate.id,
      selectedSyndicate.memberCount,
      selectedSyndicate.maxMembers,
      pendingJoinSyndicateId,
      joinInFlight,
    );

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <ScreenHeader
            title="SYNDICATE"
            onBackPress={() => setSelectedSyndicate(null)}
          />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header */}
            <View style={styles.profileHeaderRow}>
              <View style={styles.profileAvatarBox}>
                <Image
                  source={
                    selectedSyndicate.name.toLowerCase().includes("phoenix") ||
                    selectedSyndicate.rank % 2 === 0
                      ? peacockIcon
                      : alpacaIcon
                  }
                  style={styles.profileAvatarImage}
                  contentFit="contain"
                />
              </View>

              <View style={styles.profileHeaderRight}>
                <View style={styles.profileRankRow}>
                  <View style={styles.rankBadgeLarge}>
                    <Text style={styles.rankBadgeLargeText}>
                      Rank #{selectedSyndicate.rank}
                    </Text>
                  </View>
                  {pendingJoinSyndicateId === selectedSyndicate.id ? (
                    <TouchableOpacity
                      style={[styles.joinBtnSmall, styles.cancelBtn]}
                      onPress={handleCancelJoinRequest}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.joinBtnSmall,
                        detailJoin.disabled && styles.fullBtn,
                      ]}
                      disabled={detailJoin.disabled}
                      onPress={() => handleJoinRequest(selectedSyndicate)}
                    >
                      <Text
                        style={[
                          styles.joinBtnText,
                          detailJoin.disabled && styles.fullBtnText,
                        ]}
                      >
                        {detailJoin.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.clanReqRowProfile}>
                  <View style={styles.reqBlock}>
                    <Text style={styles.reqLabel}>Min Level</Text>
                    <Text style={styles.reqValueLarge}>
                      {selectedSyndicate.minLevel}
                    </Text>
                  </View>
                  <View style={styles.reqDivider} />
                  <View style={styles.reqBlock}>
                    <Text style={styles.reqLabel}>Min Asset</Text>
                    <Text style={styles.reqValueLarge}>
                      {selectedSyndicate.minAsset}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.profileNameLarge}>
              {selectedSyndicate.name}
            </Text>

            <View style={styles.card}>
              <Text style={styles.descriptionText}>
                {selectedSyndicate.description}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.card, styles.statCardCentered]}>
                <Text style={styles.reqLabel}>Members</Text>
                <Text style={styles.statValue}>
                  {selectedSyndicate.memberCount}
                  <Text style={styles.statValueMuted}>
                    /{selectedSyndicate.maxMembers}
                  </Text>
                </Text>
              </View>
              <View style={[styles.card, styles.statCardCentered]}>
                <Text style={styles.reqLabel}>Status</Text>
                <Text style={styles.statValue}>
                  {visibilityStatusLabel(selectedSyndicate.visibility)}
                </Text>
              </View>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Members ({selectedSyndicate.memberCount})
              </Text>
              <View style={styles.membersListCard}>
                {isLoadingDetails ? (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <ActivityIndicator color="#71B312" />
                    <Text style={[styles.reqLabel, { marginTop: 10 }]}>
                      Loading Roster...
                    </Text>
                  </View>
                ) : selectedSyndicate.members.length === 0 ? (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Text style={styles.reqLabel}>No members found</Text>
                  </View>
                ) : (
                  selectedSyndicate.members.map((member, idx) => (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        idx > 0 && styles.memberRowBorder,
                      ]}
                    >
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberInitial}>
                            {member.initial}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.memberName}>{member.name}</Text>
                          <Text style={styles.memberRole}>{member.role}</Text>
                        </View>
                      </View>
                      <Text style={styles.memberLevel}>Lv.{member.level}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── CREATE VIEW ───────────────────────────────────────────────────────────
  if (isCreating) {
    const isNameValid = name.trim().length >= 3;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <ScreenHeader
            title="CREATE CLAN"
            onBackPress={() => setIsCreating(false)}
          />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.profileNameLarge}>Create Clan</Text>

            <View style={styles.card}>
              <Text style={styles.cardSectionLabel}>Clan Logo</Text>
              <View style={styles.logoGrid}>
                {CLAN_LOGO_KEYS.map((emblemId) => {
                  const isSelected = selectedLogo === emblemId;
                  return (
                    <TouchableOpacity
                      key={emblemId}
                      onPress={() => setSelectedLogo(emblemId)}
                      style={[
                        styles.logoOption,
                        isSelected && styles.logoOptionSelected,
                      ]}
                    >
                      <Image
                        source={EMBLEM_MAP[emblemId]}
                        style={{ width: 36, height: 36 }}
                        contentFit="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardSectionLabel}>
                Clan Name (3–28 chars)
              </Text>
              <TextInput
                style={styles.inputField}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Grain Ghosts"
                placeholderTextColor="rgba(3, 32, 24, 0.35)"
                maxLength={28}
              />
              <Text style={[styles.cardSectionLabel, { marginTop: 18 }]}>
                Description (optional)
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { height: 80, textAlignVertical: "top" },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your clan..."
                placeholderTextColor="rgba(3, 32, 24, 0.35)"
                multiline
                maxLength={240}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardSectionLabel}>Visibility</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[styles.radioBtn, isPublic && styles.radioBtnActive]}
                  onPress={() => setIsPublic(true)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      isPublic && styles.radioTextActive,
                    ]}
                  >
                    Public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioBtn, !isPublic && styles.radioBtnActive]}
                  onPress={() => setIsPublic(false)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      !isPublic && styles.radioTextActive,
                    ]}
                  >
                    Private
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Image source={crownIcon} style={{ width: 14, height: 14 }} />
                  <Text style={styles.cardSectionLabel}>Min Level</Text>
                </View>
                <TextInput
                  style={styles.inputField}
                  value={minLevel}
                  onChangeText={setMinLevel}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="rgba(3, 32, 24, 0.35)"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Image source={coinsIcon} style={{ width: 14, height: 14 }} />
                  <Text style={styles.cardSectionLabel}>Min Gold</Text>
                </View>
                <TextInput
                  style={styles.inputField}
                  value={minGold}
                  onChangeText={setMinGold}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(3, 32, 24, 0.35)"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.createSubmitBtn,
                (!isNameValid || isSubmitting) && { opacity: 0.45 },
              ]}
              disabled={!isNameValid || isSubmitting}
              onPress={async () => {
                setIsSubmitting(true);
                const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

                try {
                  await new Promise<void>((resolve, reject) => {
                    const unsubscribe = websocketManager.onMessage((msg) => {
                      if (msg.type === "CREATE_SYNDICATE_OK") {
                        unsubscribe();

                        // Parse response mapping
                        const syndicateId =
                          (msg.data as any)?.syndicateId ||
                          Math.random().toString();
                        const syndicateName =
                          (msg.data as any)?.name || name.trim();

                        setJoinedMessage(`Created clan: ${syndicateName}`);
                        joinSyndicate({
                          id: syndicateId,
                          name: syndicateName,
                          rank: 99,
                          logo: EMBLEM_MAP[selectedLogo],
                          role: "Grandmaster",
                          wealth: 0,
                          memberCount: 1,
                          maxMembers: 25,
                          season: "Season 4 · Start",
                        });

                        resolve();
                      } else if (
                        msg.type === "ERROR" &&
                        (msg as any).payload?.requestId === requestId
                      ) {
                        // Or if the error encompasses this requestId inside the payload
                        // Note: Error catching is optimistic based on type checks
                        unsubscribe();
                        reject(
                          new Error(
                            msg.message || msg.code || "Failed to create clan",
                          ),
                        );
                      } else if (
                        msg.type === "ERROR" &&
                        !(msg as any).payload?.requestId
                      ) {
                        // Some general errors won't mirror the request ID, we check immediately if it was sent back rapidly after our payload
                        unsubscribe();
                        reject(
                          new Error(
                            msg.message || msg.code || "Failed to create clan",
                          ),
                        );
                      }
                    });

                    websocketManager
                      .send(
                        "CREATE_SYNDICATE",
                        {
                          requestId,
                          name: name.trim(),
                          description: description.trim(),
                          visibility: isPublic ? "public" : "private",
                          levelPreferenceMin: parseInt(minLevel) || 1,
                          goldPreferenceMin: parseInt(minGold) || 0,
                          emblemId: selectedLogo,
                        },
                        false,
                      )
                      .catch((err) => {
                        unsubscribe();
                        reject(err);
                      });
                  });

                  setIsCreating(false);
                  setName("");
                  setDescription("");
                } catch (error) {
                  Alert.alert(
                    "Error Creating Clan",
                    error instanceof Error ? error.message : "Network error",
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Text style={styles.createSubmitText}>
                {isSubmitting ? "Creating..." : "Create Clan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── DASHBOARD VIEW ────────────────────────────────────────────────────────
  if (joinedSyndicate) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <ScreenHeader
            title={joinedSyndicate.name.toUpperCase()}
            renderRight={() => (
              <TouchableOpacity
                style={styles.chatEntryBtn}
                onPress={() => router.push("/syndicate-chat")}
              >
                <MessageSquare size={17} color="#032018" />
              </TouchableOpacity>
            )}
          />

          <View style={styles.dashHeaderExtension}>
            {/* Identity Row */}
            <View style={styles.dashIdentity}>
              <View style={styles.dashLogoBox}>
                <Image
                  source={joinedSyndicate.logo}
                  style={{ width: 30, height: 30 }}
                  contentFit="contain"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.dashTitleRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>
                      #{joinedSyndicate.rank}
                    </Text>
                  </View>
                  <Text style={styles.dashSubtitle}>
                    {joinedSyndicate.season}
                  </Text>
                </View>
              </View>
            </View>

            {/* Buff Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 6,
                paddingRight: 4,
                paddingBottom: 12,
              }}
            >
              <View style={[styles.pill, styles.pillActive]}>
                <Text style={styles.pillTextActive}>Craft +12%</Text>
              </View>
              <View style={[styles.pill, styles.pillActive]}>
                <Text style={styles.pillTextActive}>Econ +8%</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Yield +5%</Text>
              </View>
            </ScrollView>
          </View>

          {/* Tab Bar */}
          <SubTabs
            tabs={SYNDICATE_TABS}
            activeTabId={activeTab}
            onTabPress={(id) => setActiveTab(id as Tab)}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "dashboard" && <DashboardContent />}
            {activeTab === "bank" && <BankContent />}
            {activeTab === "war" && <WarContent />}
            {activeTab === "idol" && <IdolContent />}
            {activeTab === "roster" && <RosterContent />}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── SEARCH / LIST VIEW ────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScreenHeader
          title="CLANS"
          renderRight={() => (
            <TouchableOpacity
              style={styles.createBtnHeader}
              onPress={() => setIsCreating(true)}
            >
              <Plus size={18} color="#032018" />
            </TouchableOpacity>
          )}
        />

        <View style={styles.searchBox}>
          <Search size={15} color="rgba(3, 32, 24, 0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clans..."
            placeholderTextColor="rgba(3, 32, 24, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {joinedMessage && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{joinedMessage}</Text>
            {pendingJoinSyndicateId && (
              <TouchableOpacity
                style={styles.cancelRequestBtn}
                onPress={handleCancelJoinRequest}
              >
                <Text style={styles.cancelRequestText}>Cancel Request</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={fetchSyndicates}
              tintColor="#71B312"
              colors={["#71B312"]}
            />
          }
        >
          <View style={styles.listContainer}>
            {filteredSyndicates.length === 0 ? (
              <Text style={styles.noClansText}>No clans found</Text>
            ) : (
              filteredSyndicates.map((syn: Syndicate, idx: number) => {
                const listJoin = joinActionState(
                  syn.id,
                  syn.memberCount,
                  syn.maxMembers,
                  pendingJoinSyndicateId,
                  joinInFlight,
                );

                return (
                  <TouchableOpacity
                    key={syn.id}
                    style={styles.clanCard}
                    onPress={() => setSelectedSyndicate(syn)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.clanAvatar}>
                      <Image
                        source={idx % 2 === 0 ? peacockIcon : alpacaIcon}
                        style={styles.clanAvatarImage}
                        contentFit="contain"
                      />
                    </View>
                    <View style={styles.clanInfo}>
                      <View style={styles.clanNameRow}>
                        <Text style={styles.clanName} numberOfLines={1}>
                          {syn.name}
                        </Text>
                        <Text style={styles.rankText}>#{syn.rank}</Text>
                      </View>
                      <Text style={styles.clanMembersText}>
                        {syn.memberCount}/{syn.maxMembers} members
                      </Text>
                      <View style={styles.clanReqRow}>
                        <Text style={styles.clanReqText}>
                          Lv.{syn.minLevel}+
                        </Text>
                        <Text style={styles.clanReqSep}>·</Text>
                        <Text style={styles.clanReqText}>
                          Asset {syn.minAsset}+
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.joinBtnSmall,
                        listJoin.disabled && styles.fullBtn,
                      ]}
                      disabled={listJoin.disabled}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleJoinRequest(syn);
                      }}
                    >
                      <Text
                        style={[
                          styles.joinBtnText,
                          listJoin.disabled && styles.fullBtnText,
                        ]}
                      >
                        {listJoin.label}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function useSyndicateDashboard() {
  const joinedSyndicate = useSyndicateStore((s) => s.joinedSyndicate);
  const dashboard = useSyndicateStore((s) => s.dashboard);
  const dashboardLoading = useSyndicateStore((s) => s.dashboardLoading);
  const setDashboard = useSyndicateStore((s) => s.setDashboard);
  const setDashboardLoading = useSyndicateStore((s) => s.setDashboardLoading);

  const fetchDashboard = useCallback(() => {
    if (!joinedSyndicate) return;
    setDashboardLoading(true);

    void websocketManager.send(
      "SYNDICATE_DASHBOARD",
      { syndicateId: joinedSyndicate.id },
      false,
    );
  }, [joinedSyndicate, setDashboardLoading]);

  useEffect(() => {
    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === "SYNDICATE_DASHBOARD_OK" && msg.data) {
        const raw = msg.data as Record<string, unknown>;
        const d: SyndicateDashboard = {
          ...(raw as unknown as SyndicateDashboard),
          joinRequests: Array.isArray(raw.joinRequests)
            ? (raw.joinRequests as JoinRequest[])
            : [],
        };
        setDashboard(d);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [setDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, dashboardLoading, refetch: fetchDashboard };
}

function CommodityRow({
  commodity,
  isLast,
}: {
  commodity: DashboardCommodity;
  isLast: boolean;
}) {
  const icon = ASSET_MAP[commodity.itemId];
  const pricePerUnit = commodity.sellPriceMicro / MICRO_PER_GOLD;

  return (
    <View style={[styles.commodityRow, !isLast && styles.commodityRowBorder]}>
      <View style={styles.cropIconWrap}>
        <Image
          source={icon ?? ASSET_MAP["wheat"]}
          style={{ width: 26, height: 26 }}
          contentFit="contain"
        />
      </View>
      <View style={styles.cropInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.commodityName}>
            {formatItemName(commodity.itemId)}
          </Text>
          {commodity.monopolyPct >= 10 && (
            <View style={styles.monopolyTag}>
              <Text style={styles.monopolyText}>MONOPOLY</Text>
            </View>
          )}
        </View>
        <Text style={styles.commodityStats}>
          x{commodity.quantity} · {commodity.monopolyPct.toFixed(1)}% share
        </Text>
      </View>
      <View style={styles.cropRight}>
        <Text style={styles.priceMove}>{pricePerUnit.toFixed(1)}g/u</Text>
        {commodity.crashPct > 5 ? (
          <View style={[styles.hintPill, styles.sellHint]}>
            <Text style={styles.hintText}>HIGH CRASH</Text>
          </View>
        ) : (
          <View style={[styles.hintPill, styles.buyHint]}>
            <Text style={styles.hintText}>
              {formatGold(commodity.sellPriceMicro * commodity.quantity)}g
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const MemoizedCommodityRow = React.memo(CommodityRow);

function MemberRow({
  member,
  isLast,
}: {
  member: DashboardMember;
  isLast: boolean;
}) {
  const shortId = member.userId.slice(0, 6);
  return (
    <View style={[styles.miniMemberRow, !isLast && styles.miniMemberBorder]}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: member.online ? "#71B312" : "#FFB038" },
        ]}
      />
      <Text style={styles.miniMemberName}>{shortId}</Text>
      <Text style={styles.miniMemberRole}>{roleLabel(member.role)}</Text>
    </View>
  );
}

const MemoizedMemberRow = React.memo(MemberRow);

function useMyBackendRole(): "owner" | "officer" | "member" | null {
  const joinedSyndicate = useSyndicateStore((s) => s.joinedSyndicate);
  const dashboard = useSyndicateStore((s) => s.dashboard);

  return useMemo(() => {
    if (!joinedSyndicate || !dashboard?.members) return null;
    const myId = getMyUserId();
    if (!myId) return null;
    const me = dashboard.members.find((m) => m.userId === myId);
    return me?.role ?? null;
  }, [joinedSyndicate, dashboard?.members]);
}

function JoinRequestRow({
  req,
  syndicateId,
  onActionComplete,
  isLast,
}: {
  req: JoinRequest;
  syndicateId: string;
  onActionComplete: () => void;
  isLast: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const shortId = req.userId.slice(0, 6);

  const handleAcceptOrReject = async (
    action: "ACCEPT_REQUEST" | "REJECT_REQUEST",
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const okType =
        action === "ACCEPT_REQUEST" ? "ACCEPT_REQUEST_OK" : "REJECT_REQUEST_OK";
      await sendSyndicateAction(action, { syndicateId, userId: req.userId }, okType);
      onActionComplete();
    } catch (err) {
      Alert.alert(
        "Action Failed",
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[styles.fullMemberRow, !isLast && styles.fullMemberBorder]}
    >
      <View style={styles.memberAvatarSmall}>
        <Text style={styles.avatarInitial}>
          {shortId[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.fullMemberName}>{shortId}</Text>
        <Text style={styles.fullMemberRole}>Lv. {req.level}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TouchableOpacity
          style={styles.adminAcceptBtn}
          onPress={() => handleAcceptOrReject("ACCEPT_REQUEST")}
          disabled={busy}
        >
          <Text style={styles.adminAcceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adminRejectBtn}
          onPress={() => handleAcceptOrReject("REJECT_REQUEST")}
          disabled={busy}
        >
          <Text style={styles.adminRejectText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DashboardContent() {
  const { joinedSyndicate } = useSyndicateStore();
  const { dashboard, dashboardLoading, refetch } = useSyndicateDashboard();
  const myRole = useMyBackendRole();
  const isAdmin = myRole === "owner" || myRole === "officer";

  if (!joinedSyndicate) return null;

  if (dashboardLoading && !dashboard) {
    return (
      <View style={{ padding: 40, alignItems: "center" }}>
        <ActivityIndicator color="#71B312" />
        <Text style={[styles.reqLabel, { marginTop: 10 }]}>Loading...</Text>
      </View>
    );
  }

  const totalGold = dashboard?.totalGold ?? joinedSyndicate.wealth;
  const totalMembers = dashboard?.totalMembers ?? joinedSyndicate.memberCount;
  const onlineCount = dashboard?.onlineCount ?? 0;
  const commodities = dashboard?.commodities ?? [];
  const members = dashboard?.members ?? [];
  const joinRequests = dashboard?.joinRequests ?? [];

  return (
    <View style={styles.tabContainer}>
      {/* Wealth + Members */}
      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.reqLabel}>Bank Gold</Text>
          <Text style={styles.statValue}>{totalGold.toLocaleString()}</Text>
          <Text style={styles.statSub}>Syndicate vault</Text>
        </View>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.reqLabel}>Members</Text>
          <Text style={styles.statValue}>
            {totalMembers}
            <Text style={styles.statValueMuted}>
              /{joinedSyndicate.maxMembers}
            </Text>
          </Text>
          <Text style={styles.statSub}>{onlineCount} online</Text>
        </View>
      </View>

      {/* Join Requests (Owner / Officer only) */}
      {isAdmin && joinRequests.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              Join Requests ({joinRequests.length})
            </Text>
          </View>
          {joinRequests.map((req, i) => (
            <JoinRequestRow
              key={req.userId}
              req={req}
              syndicateId={joinedSyndicate.id}
              onActionComplete={refetch}
              isLast={i === joinRequests.length - 1}
            />
          ))}
        </View>
      )}

      {/* Boosts */}
      {dashboard?.activeBoost && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Idol Status</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <View
              style={[
                styles.pill,
                dashboard.activeBoost.idolStatus === "blessed" &&
                  styles.pillActive,
              ]}
            >
              <Text
                style={
                  dashboard.activeBoost.idolStatus === "blessed"
                    ? styles.pillTextActive
                    : styles.pillText
                }
              >
                Idol Lv.{dashboard.activeBoost.idolLevel}
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                dashboard.activeBoost.idolStatus === "blessed"
                  ? styles.pillActive
                  : dashboard.activeBoost.idolStatus === "punished"
                    ? {
                        backgroundColor: "rgba(255,56,60,0.1)",
                        borderColor: "rgba(255,56,60,0.3)",
                      }
                    : undefined,
              ]}
            >
              <Text
                style={
                  dashboard.activeBoost.idolStatus === "blessed"
                    ? styles.pillTextActive
                    : dashboard.activeBoost.idolStatus === "punished"
                      ? {
                          fontSize: 11,
                          fontFamily: "Space Mono",
                          color: "#FF383C",
                          fontWeight: "700",
                        }
                      : styles.pillText
                }
              >
                {dashboard.activeBoost.idolStatus === "blessed"
                  ? "Blessed"
                  : dashboard.activeBoost.idolStatus === "punished"
                    ? "Punished"
                    : "Neutral"}
              </Text>
            </View>
            {dashboard.activeBoost.shieldExpiresAtMs > Date.now() && (
              <View style={[styles.pill, styles.pillActive]}>
                <Text style={styles.pillTextActive}>Shield Active</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Commodity Board */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Commodity Board</Text>
          <ChevronDown size={15} color="rgba(3,32,24,0.4)" />
        </View>

        {commodities.length === 0 ? (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>No commodities in bank</Text>
          </View>
        ) : (
          commodities.map((c, i) => (
            <MemoizedCommodityRow
              key={c.itemId}
              commodity={c}
              isLast={i === commodities.length - 1}
            />
          ))
        )}
      </View>

      {/* Active Roster */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>
            Active Roster ({onlineCount}/{totalMembers})
          </Text>
        </View>

        {members.length === 0 ? (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>No members loaded</Text>
          </View>
        ) : (
          members
            .slice()
            .sort((a, b) => Number(b.online) - Number(a.online))
            .map((m, i, arr) => (
              <MemoizedMemberRow
                key={m.userId}
                member={m}
                isLast={i === arr.length - 1}
              />
            ))
        )}
      </View>
    </View>
  );
}

function BankContent() {
  const { joinedSyndicate, dashboard } = useSyndicateStore();
  const { refetch: refetchSyndicateDashboard } = useSyndicateDashboard();
  const playerGold = useGameStore((s) => s.coins);
  const inventoryItems = useInventoryStore((s) => s.items);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositingGold, setDepositingGold] = useState(false);
  const [depositingItemId, setDepositingItemId] = useState<string | null>(null);
  const [sellingItem, setSellingItem] = useState<string | null>(null);
  const [sellQty, setSellQty] = useState("");

  const isOwnerOrOfficer = useMemo(() => {
    if (!dashboard?.members || !joinedSyndicate) return false;
    const authStore = require("@/store/auth-store").useAuthStore;
    const profile = authStore.getState().profile;
    if (!profile) return false;
    const me = dashboard.members.find((m) => m.userId === profile.id);
    return me?.role === "owner" || me?.role === "officer";
  }, [dashboard?.members, joinedSyndicate]);

  const totalGold = dashboard?.totalGold ?? 0;
  const commodities = dashboard?.commodities ?? [];

  const depositableItems = useMemo(() => {
    return Object.values(inventoryItems).filter(
      (item) => item.type === "crop" && item.quantity > 0,
    );
  }, [inventoryItems]);

  const handleDepositGold = useDebounce(() => {
    const amount = parseInt(depositAmount, 10);
    if (!amount || amount <= 0 || !joinedSyndicate) return;
    if (amount > playerGold) {
      Alert.alert("Insufficient Gold", "You don't have enough gold.");
      return;
    }

    setDepositingGold(true);
    void (async () => {
      try {
        const data = await syndicateWsCall<Record<string, unknown>>(
          "DEPOSIT_BANK",
          {
            syndicateId: joinedSyndicate.id,
            kind: "gold",
            amount,
          },
          "DEPOSIT_BANK_OK",
        );
        applyDepositBankSuccess(data, { kind: "gold", amount });
        refetchSyndicateDashboard();
        setDepositAmount("");
        Alert.alert(
          "Deposited",
          `${amount} gold deposited to syndicate bank.`,
        );
      } catch (err) {
        Alert.alert(
          "Deposit Failed",
          err instanceof Error ? err.message : "Could not deposit gold.",
        );
      } finally {
        setDepositingGold(false);
      }
    })();
  }, 500);

  const handleDepositItem = useDebounce((itemId: string, qty: number) => {
    if (qty <= 0 || !joinedSyndicate) return;

    setDepositingItemId(itemId);
    void (async () => {
      try {
        const data = await syndicateWsCall<Record<string, unknown>>(
          "DEPOSIT_BANK",
          {
            syndicateId: joinedSyndicate.id,
            kind: "item",
            itemId,
            amount: qty,
          },
          "DEPOSIT_BANK_OK",
        );
        applyDepositBankSuccess(data, { kind: "item", itemId, qty });
        refetchSyndicateDashboard();
        Alert.alert(
          "Deposited",
          `${qty}x ${formatItemName(itemId)} deposited.`,
        );
      } catch (err) {
        Alert.alert(
          "Deposit Failed",
          err instanceof Error ? err.message : "Could not deposit items.",
        );
      } finally {
        setDepositingItemId(null);
      }
    })();
  }, 500);

  const handleSellFromBank = useDebounce((itemId: string, quantity: number) => {
    if (quantity <= 0 || !joinedSyndicate) return;

    setSellingItem(itemId);
    const requestId = `sell-${Date.now().toString(36)}`;

    const unsubscribe = websocketManager.onMessage((msg) => {
      if (msg.type === "SYNDICATE_BANK_SELL_OK") {
        unsubscribe();
        setSellingItem(null);
        setSellQty("");
        const data = msg.data as
          | {
              item: string;
              quantity: number;
              goldPaid: number;
            }
          | undefined;
        Alert.alert(
          "Sold",
          `Sold ${data?.quantity ?? quantity}x ${formatItemName(itemId)} for ${data?.goldPaid ?? "?"} gold.`,
        );
      } else if (msg.type === "ERROR") {
        const payload = msg.payload as Record<string, unknown> | undefined;
        if (
          payload?.requestId === requestId ||
          msg.code === "NOT_AUTHORIZED" ||
          msg.code === "INSUFFICIENT_INV" ||
          msg.code === "TREASURY_DEPLETED"
        ) {
          unsubscribe();
          setSellingItem(null);
          Alert.alert("Sell Failed", msg.message || "Could not sell items.");
        }
      }
    });

    void websocketManager.send(
      "SYNDICATE_BANK_SELL",
      {
        requestId,
        syndicateId: joinedSyndicate.id,
        itemId,
        quantity,
      },
      false,
    );
  }, 500);

  return (
    <View style={styles.tabContainer}>
      {/* Gold Vault */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gold Vault</Text>
        <Text style={[styles.statValue, { marginTop: 8 }]}>
          {totalGold.toLocaleString()}
          <Text style={styles.statValueMuted}> gold</Text>
        </Text>

        <View style={{ marginTop: 16 }}>
          <Text style={styles.reqLabel}>Deposit Gold</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TextInput
              style={[styles.inputField, { flex: 1, marginTop: 0 }]}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              placeholder={`You have ${playerGold.toLocaleString()}`}
              placeholderTextColor="rgba(3,32,24,0.35)"
            />
            <TouchableOpacity
              style={[
                styles.depositBtn,
                {
                  width: 60,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: "#032018",
                },
                (depositingGold || depositingItemId) && { opacity: 0.5 },
              ]}
              disabled={
                depositingGold ||
                depositingItemId != null ||
                !depositAmount ||
                parseInt(depositAmount, 10) <= 0
              }
              onPress={handleDepositGold}
            >
              <Text
                style={{
                  color: "white",
                  fontFamily: "Space Mono",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {depositingGold ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Commodities in Bank */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bank Commodities</Text>
        {commodities.length === 0 ? (
          <View style={[styles.noDataBox, { marginTop: 12 }]}>
            <Text style={styles.noDataText}>No commodities stored</Text>
          </View>
        ) : (
          <View style={{ gap: 2, marginTop: 12 }}>
            {commodities.map((c, i) => (
              <View
                key={c.itemId}
                style={[
                  styles.depositRow,
                  i < commodities.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(3,32,24,0.06)",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Image
                    source={ASSET_MAP[c.itemId] ?? ASSET_MAP["wheat"]}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                  />
                  <View>
                    <Text style={styles.depositName}>
                      {formatItemName(c.itemId)}
                    </Text>
                    <Text style={styles.depositQty}>
                      x{c.quantity} in vault
                    </Text>
                  </View>
                </View>
                {isOwnerOrOfficer && (
                  <TouchableOpacity
                    style={[
                      styles.depositBtn,
                      {
                        width: 48,
                        borderRadius: 10,
                        backgroundColor:
                          sellingItem === c.itemId
                            ? "rgba(255,56,60,0.2)"
                            : "#FF383C",
                      },
                    ]}
                    disabled={sellingItem === c.itemId}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt(
                            `Sell ${formatItemName(c.itemId)}`,
                            `Max: ${c.quantity}. Gold earned: ~${(c.sellPriceMicro / MICRO_PER_GOLD).toFixed(1)}/unit`,
                            (text) => {
                              const qty = parseInt(text, 10);
                              if (qty > 0 && qty <= c.quantity) {
                                handleSellFromBank(c.itemId, qty);
                              }
                            },
                            "plain-text",
                            String(c.quantity),
                            "numeric",
                          )
                        : handleSellFromBank(c.itemId, c.quantity);
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontFamily: "Space Mono",
                        fontSize: 9,
                        fontWeight: "700",
                      }}
                    >
                      SELL
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Deposit Items from Inventory */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Deposit Items</Text>
        {depositableItems.length === 0 ? (
          <View style={[styles.noDataBox, { marginTop: 12 }]}>
            <Text style={styles.noDataText}>No crops in inventory</Text>
          </View>
        ) : (
          <View style={{ gap: 2, marginTop: 12 }}>
            {depositableItems.map((item, i) => (
              <View
                key={item.id}
                style={[
                  styles.depositRow,
                  i < depositableItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(3,32,24,0.06)",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Image
                    source={ASSET_MAP[item.id] ?? ASSET_MAP["wheat"]}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                  />
                  <Text style={styles.depositName}>
                    {formatItemName(item.id)}
                  </Text>
                </View>
                <Text style={styles.depositQty}>x{item.quantity} owned</Text>
                <TouchableOpacity
                  style={[
                    styles.depositBtn,
                    (depositingItemId === item.id || depositingGold) && {
                      opacity: 0.45,
                    },
                  ]}
                  disabled={depositingItemId === item.id || depositingGold}
                  onPress={() => handleDepositItem(item.id, item.quantity)}
                >
                  <Text style={styles.depositBtnText}>
                    {depositingItemId === item.id ? "…" : "+"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const WAR_TROOP_TYPES = [
  "worker",
  "tractor",
  "scarecrow_breaker",
  "crop_duster",
  "siege_harvester",
] as const;

const SHIELD_TYPES = [
  "harvest_dome",
  "gold_vault_lock",
  "militia_surge",
  "crop_decoy",
  "ceasefire",
] as const;

function formatTroopLabel(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function WarContent() {
  const joinedSyndicate = useSyndicateStore((s) => s.joinedSyndicate);
  const myRole = useMyBackendRole();
  const canManage = myRole === "owner" || myRole === "officer";

  const [loading, setLoading] = useState(true);
  const [activeWar, setActiveWar] = useState<{
    warId: string;
    attackerId: string;
    defenderId: string;
    phase: string;
    endTimeMs: number;
  } | null>(null);
  const [troopLevels, setTroopLevels] = useState<Record<string, number>>({});
  const [attackTroops, setAttackTroops] = useState<Record<string, string>>({});
  const [targetSyndicateId, setTargetSyndicateId] = useState("");
  const [shieldType, setShieldType] =
    useState<(typeof SHIELD_TYPES)[number]>("harvest_dome");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadWar = useCallback(async () => {
    if (!joinedSyndicate) return;
    setLoading(true);
    try {
      const war = await syndicateWsCall<Record<string, unknown>>(
        "VIEW_ACTIVE_WAR",
        { syndicateId: joinedSyndicate.id },
        "VIEW_ACTIVE_WAR_OK",
      );
      const wid = war.warId;
      if (typeof wid === "string" && wid.length > 0) {
        setActiveWar({
          warId: wid,
          attackerId: typeof war.attackerId === "string" ? war.attackerId : "",
          defenderId: typeof war.defenderId === "string" ? war.defenderId : "",
          phase: typeof war.phase === "string" ? war.phase : "preparation",
          endTimeMs:
            typeof war.endTimeMs === "number" ? war.endTimeMs : Date.now(),
        });
      } else {
        setActiveWar(null);
      }
    } catch {
      setActiveWar(null);
    }

    try {
      const levels = await syndicateWsCall<Record<string, unknown>>(
        "VIEW_TROOP_LEVELS",
        { syndicateId: joinedSyndicate.id },
        "VIEW_TROOP_LEVELS_OK",
      );
      setTroopLevels(levels as Record<string, number>);
    } catch {
      setTroopLevels({});
    } finally {
      setLoading(false);
    }
  }, [joinedSyndicate]);

  useEffect(() => {
    void loadWar();
  }, [loadWar]);

  const runAction = async (key: string, fn: () => Promise<void>) => {
    if (busyKey) return;
    setBusyKey(key);
    try {
      await fn();
      await loadWar();
    } catch (err) {
      Alert.alert(
        "War",
        err instanceof Error ? err.message : "Action failed",
      );
    } finally {
      setBusyKey(null);
    }
  };

  if (!joinedSyndicate) return null;

  if (loading && !activeWar && Object.keys(troopLevels).length === 0) {
    return (
      <View style={[styles.tabContainer, { paddingVertical: 40 }]}>
        <ActivityIndicator color="#71B312" />
        <Text style={[styles.reqLabel, { marginTop: 10, textAlign: "center" }]}>
          Loading war room…
        </Text>
      </View>
    );
  }

  const isAttacker =
    activeWar && activeWar.attackerId === joinedSyndicate.id;
  const inBattle = activeWar?.phase === "active";

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContainer}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={[styles.card, { marginBottom: 8 }]}
        onPress={() => void loadWar()}
        disabled={!!busyKey}
      >
        <Text style={styles.cardTitle}>Refresh status</Text>
        <Text style={styles.statSub}>Tap to reload war and troop levels</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Defense</Text>
        <View style={styles.defenseGrid}>
          <View style={styles.defenseItem}>
            <Shield size={16} color="#71B312" />
            <Text style={styles.defenseLabel}>Syndicate</Text>
            <Text style={styles.defenseValue} numberOfLines={1}>
              {joinedSyndicate.name}
            </Text>
          </View>
          <View style={styles.defenseItem}>
            <Text style={styles.defenseLabel}>Role</Text>
            <Text style={styles.defenseValue}>
              {myRole === "owner"
                ? "Leader"
                : myRole === "officer"
                  ? "Officer"
                  : "Member"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active war</Text>
        {!activeWar ? (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>No active war</Text>
          </View>
        ) : (
          <View style={{ marginTop: 10, gap: 8 }}>
            <Text style={styles.depositQty}>War {activeWar.warId}</Text>
            <Text style={styles.depositQty}>
              Phase: {activeWar.phase}
              {activeWar.endTimeMs > 0
                ? ` · ends ${new Date(activeWar.endTimeMs).toLocaleString()}`
                : ""}
            </Text>
            <Text style={styles.depositQty} numberOfLines={2}>
              {isAttacker ? "You are attacking" : "You are defending"} · vs{" "}
              {isAttacker ? activeWar.defenderId : activeWar.attackerId}
            </Text>
          </View>
        )}
      </View>

      {canManage && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Declare war</Text>
          <Text style={[styles.statSub, { marginBottom: 8 }]}>
            Target syndicate id (enemy)
          </Text>
          <TextInput
            style={styles.inputField}
            value={targetSyndicateId}
            onChangeText={setTargetSyndicateId}
            placeholder="syn_…"
            placeholderTextColor="rgba(3,32,24,0.35)"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[
              styles.depositBtn,
              {
                marginTop: 12,
                alignSelf: "flex-start",
                paddingHorizontal: 16,
                backgroundColor: "#032018",
              },
            ]}
            disabled={!!busyKey || !targetSyndicateId.trim()}
            onPress={() =>
              runAction("declare", () =>
                syndicateWsCall("DECLARE_WAR", {
                  syndicateId: joinedSyndicate.id,
                  targetSyndicateId: targetSyndicateId.trim(),
                }, "DECLARE_WAR_OK").then(() => undefined),
              )
            }
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {busyKey === "declare" ? "…" : "Declare war"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Troop upgrades</Text>
        <Text style={[styles.statSub, { marginBottom: 10 }]}>
          Bank gold · officer or leader
        </Text>
        {WAR_TROOP_TYPES.map((t) => (
          <View
            key={t}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(3,32,24,0.06)",
            }}
          >
            <View>
              <Text style={styles.depositName}>{formatTroopLabel(t)}</Text>
              <Text style={styles.depositQty}>
                Level {troopLevels[t] ?? 0}
                {troopLevels[t] != null && troopLevels[t] >= 5 ? " (max)" : ""}
              </Text>
            </View>
            {canManage && (troopLevels[t] ?? 0) < 5 && (
              <TouchableOpacity
                style={[styles.adminAcceptBtn, { opacity: busyKey ? 0.5 : 1 }]}
                disabled={!!busyKey}
                onPress={() =>
                  runAction(`up-${t}`, () =>
                    syndicateWsCall("UPGRADE_TROOP", {
                      syndicateId: joinedSyndicate.id,
                      troopType: t,
                    }, "UPGRADE_TROOP_OK").then(() => undefined),
                  )
                }
              >
                <Text style={styles.adminAcceptText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {activeWar && inBattle && isAttacker && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>War attack</Text>
          <Text style={[styles.statSub, { marginBottom: 8 }]}>
            Commit troops (phase must be active)
          </Text>
          {WAR_TROOP_TYPES.map((t) => (
            <View key={`atk-${t}`} style={{ marginBottom: 8 }}>
              <Text style={styles.reqLabel}>{formatTroopLabel(t)}</Text>
              <TextInput
                style={[styles.inputField, { marginTop: 4 }]}
                keyboardType="numeric"
                value={attackTroops[t] ?? ""}
                onChangeText={(v) =>
                  setAttackTroops((prev) => ({ ...prev, [t]: v }))
                }
                placeholder="0"
                placeholderTextColor="rgba(3,32,24,0.35)"
              />
            </View>
          ))}
          <TouchableOpacity
            style={[
              styles.depositBtn,
              {
                marginTop: 8,
                alignSelf: "flex-start",
                backgroundColor: "#FF383C",
                paddingHorizontal: 16,
              },
            ]}
            disabled={!!busyKey}
            onPress={() => {
              const troops: Record<string, number> = {};
              for (const t of WAR_TROOP_TYPES) {
                const n = parseInt(attackTroops[t] ?? "0", 10);
                if (n > 0) troops[t] = n;
              }
              if (Object.keys(troops).length === 0) {
                Alert.alert("War attack", "Enter at least one troop count.");
                return;
              }
              runAction("attack", () =>
                syndicateWsCall("WAR_ATTACK", {
                  syndicateId: joinedSyndicate.id,
                  warId: activeWar.warId,
                  troops,
                }, "WAR_ATTACK_OK").then(() => undefined),
              );
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {busyKey === "attack" ? "…" : "Launch attack"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {canManage && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>War shield</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {SHIELD_TYPES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.pill,
                  shieldType === s && styles.pillActive,
                  { marginBottom: 4 },
                ]}
                onPress={() => setShieldType(s)}
              >
                <Text
                  style={
                    shieldType === s ? styles.pillTextActive : styles.pillText
                  }
                  numberOfLines={1}
                >
                  {s.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[
              styles.depositBtn,
              {
                marginTop: 12,
                alignSelf: "flex-start",
                backgroundColor: "#032018",
                paddingHorizontal: 16,
              },
            ]}
            disabled={!!busyKey}
            onPress={() =>
              runAction("shield", () =>
                syndicateWsCall("BUY_WAR_SHIELD", {
                  syndicateId: joinedSyndicate.id,
                  shieldType,
                }, "BUY_WAR_SHIELD_OK").then(() => undefined),
              )
            }
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {busyKey === "shield" ? "…" : "Buy shield"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function IdolContent() {
  const { joinedSyndicate } = useSyndicateStore();
  const { dashboard, refetch } = useSyndicateDashboard();
  const playerGold = useGameStore((s) => s.coins);
  const [goldInput, setGoldInput] = useState("");
  const [busy, setBusy] = useState(false);

  const idolLevel = dashboard?.activeBoost?.idolLevel ?? 0;
  const idolStatus = dashboard?.activeBoost?.idolStatus ?? "none";

  const contributeGold = useDebounce(() => {
    if (!joinedSyndicate || busy) return;
    const goldAmount = parseInt(goldInput, 10);
    if (!goldAmount || goldAmount <= 0) {
      Alert.alert("Idol", "Enter a gold amount.");
      return;
    }
    if (goldAmount > playerGold) {
      Alert.alert("Idol", "Not enough personal gold.");
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        await syndicateWsCall(
          "IDOL_CONTRIBUTE",
          {
            syndicateId: joinedSyndicate.id,
            goldAmount,
            items: {},
          },
          "IDOL_CONTRIBUTE_OK",
        );
        setGoldInput("");
        refetch();
        Alert.alert("Idol", "Contribution sent.");
      } catch (err) {
        Alert.alert(
          "Idol",
          err instanceof Error ? err.message : "Contribution failed",
        );
      } finally {
        setBusy(false);
      }
    })();
  }, 500);

  if (!joinedSyndicate) return null;

  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Idol status</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <View style={[styles.pill, styles.pillActive]}>
            <Text style={styles.pillTextActive}>Level {idolLevel}</Text>
          </View>
          <View
            style={[
              styles.pill,
              idolStatus === "blessed"
                ? styles.pillActive
                : idolStatus === "punished"
                  ? {
                      backgroundColor: "rgba(255,56,60,0.12)",
                      borderColor: "rgba(255,56,60,0.35)",
                    }
                  : undefined,
            ]}
          >
            <Text
              style={
                idolStatus === "blessed"
                  ? styles.pillTextActive
                  : idolStatus === "punished"
                    ? { color: "#FF383C", fontWeight: "700", fontSize: 11 }
                    : styles.pillText
              }
            >
              {idolStatus === "blessed"
                ? "Blessed"
                : idolStatus === "punished"
                  ? "Punished"
                  : "Neutral"}
            </Text>
          </View>
        </View>
        <Text style={[styles.statSub, { marginTop: 14 }]}>
          Contribute personal gold to level the idol and syndicate buffs.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contribute gold</Text>
        <Text style={[styles.reqLabel, { marginTop: 8 }]}>Amount</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TextInput
            style={[styles.inputField, { flex: 1, marginTop: 0 }]}
            keyboardType="numeric"
            value={goldInput}
            onChangeText={setGoldInput}
            placeholder={`You have ${playerGold.toLocaleString()}`}
            placeholderTextColor="rgba(3,32,24,0.35)"
          />
          <TouchableOpacity
            style={[
              styles.depositBtn,
              {
                paddingHorizontal: 18,
                backgroundColor: "#032018",
                opacity: busy ? 0.5 : 1,
              },
            ]}
            disabled={busy}
            onPress={contributeGold}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {busy ? "…" : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function RosterMemberRow({
  member,
  myRole,
  syndicateId,
  isLast,
  onActionComplete,
}: {
  member: DashboardMember;
  myRole: "owner" | "officer" | "member" | null;
  syndicateId: string;
  isLast: boolean;
  onActionComplete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const shortId = member.userId.slice(0, 6);
  const initial = shortId[0]?.toUpperCase() ?? "?";
  const myId = getMyUserId();
  const isMe = myId === member.userId;

  const canKick =
    !isMe &&
    ((myRole === "owner" && member.role !== "owner") ||
      (myRole === "officer" && member.role === "member"));

  const canPromote = myRole === "owner" && member.role === "member";
  const canDemote = myRole === "owner" && member.role === "officer";

  const handleAction = async (
    type: string,
    okType: string,
    confirmTitle: string,
    confirmMsg: string,
  ) => {
    Alert.alert(confirmTitle, confirmMsg, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            await sendSyndicateAction(
              type,
              { syndicateId, userId: member.userId },
              okType,
            );
            onActionComplete();
          } catch (err) {
            Alert.alert(
              "Failed",
              err instanceof Error ? err.message : "Action failed",
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.fullMemberRow, !isLast && styles.fullMemberBorder]}>
      <View style={styles.memberAvatarSmall}>
        <Text style={styles.avatarInitial}>{initial}</Text>
        {member.online && <View style={styles.onlineDot} />}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.fullMemberName}>
          {shortId}
          {isMe ? " (You)" : ""}
        </Text>
        <Text style={styles.fullMemberRole}>
          {roleLabel(member.role)} · Lv. {member.level}
        </Text>
      </View>
      {(canKick || canPromote || canDemote) && (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {canPromote && (
            <TouchableOpacity
              style={styles.adminAcceptBtn}
              disabled={busy}
              onPress={() =>
                handleAction(
                  "PROMOTE_MEMBER",
                  "PROMOTE_MEMBER_OK",
                  "Promote to Enforcer",
                  `Promote ${shortId} to Enforcer?`,
                )
              }
            >
              <Text style={styles.adminAcceptText}>Promote</Text>
            </TouchableOpacity>
          )}
          {canDemote && (
            <TouchableOpacity
              style={styles.adminDemoteBtn}
              disabled={busy}
              onPress={() =>
                handleAction(
                  "DEMOTE_MEMBER",
                  "DEMOTE_MEMBER_OK",
                  "Demote to Member",
                  `Demote ${shortId} back to Member?`,
                )
              }
            >
              <Text style={styles.adminDemoteText}>Demote</Text>
            </TouchableOpacity>
          )}
          {canKick && (
            <TouchableOpacity
              style={styles.adminRejectBtn}
              disabled={busy}
              onPress={() =>
                handleAction(
                  "KICK_MEMBER",
                  "KICK_MEMBER_OK",
                  "Kick Member",
                  `Remove ${shortId} from the syndicate?`,
                )
              }
            >
              <Text style={styles.adminRejectText}>Kick</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function RosterContent() {
  const { joinedSyndicate, dashboard } = useSyndicateStore();
  const { refetch } = useSyndicateDashboard();
  const myRole = useMyBackendRole();
  const members = dashboard?.members ?? [];
  const sorted = useMemo(
    () =>
      members
        .slice()
        .sort(
          (a, b) => Number(b.online) - Number(a.online) || b.level - a.level,
        ),
    [members],
  );

  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Members (
          {dashboard?.totalMembers ?? joinedSyndicate?.memberCount ?? 0})
        </Text>
        {sorted.length === 0 ? (
          <View style={[styles.noDataBox, { marginTop: 14 }]}>
            <Text style={styles.noDataText}>No members loaded</Text>
          </View>
        ) : (
          <View style={{ gap: 0, marginTop: 14 }}>
            {sorted.map((m, i, arr) => (
              <RosterMemberRow
                key={m.userId}
                member={m}
                myRole={myRole}
                syndicateId={joinedSyndicate?.id ?? ""}
                isLast={i === arr.length - 1}
                onActionComplete={refetch}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  dashHeaderExtension: {
    paddingHorizontal: 20,
    gap: 12,
  },
  createBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(3, 32, 24, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── SCROLL CONTENT
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: BottomTabInset,
    gap: 10,
  },

  // ── SEARCH LIST HEADER
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    color: "#032018",
    fontSize: 22,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  createBtn: {
    backgroundColor: "#032018",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  createBtnText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },

  // ── SEARCH BOX
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.07)",
  },
  searchInput: {
    flex: 1,
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    padding: 0,
  },

  // ── BANNER
  banner: {
    backgroundColor: "#DAF8B7",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(113,179,18,0.3)",
  },
  bannerText: {
    color: "#032018",
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },

  noClansText: {
    textAlign: "center",
    color: "#032018",
    opacity: 0.4,
    marginTop: 48,
    fontFamily: "Space Mono",
    fontSize: 13,
  },

  // ── CLAN LIST
  listContainer: { gap: 10 },

  clanCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.07)",
  },
  clanAvatar: {
    width: 46,
    height: 46,
    backgroundColor: "rgba(113, 179, 18, 0.12)",
    borderRadius: 14,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(113,179,18,0.2)",
  },
  clanAvatarImage: { width: 30, height: 30 },
  clanInfo: { flex: 1, gap: 3 },
  clanNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clanName: {
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    flex: 1,
    marginRight: 6,
  },
  rankText: {
    color: "#032018",
    fontSize: 12,
    fontFamily: "Space Mono",
    opacity: 0.4,
  },
  clanReqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clanReqText: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.4,
  },
  clanReqSep: {
    color: "#032018",
    opacity: 0.25,
    fontSize: 11,
    fontFamily: "Space Mono",
  },
  clanMembersText: {
    color: "#032018",
    fontSize: 12,
    fontFamily: "Space Mono",
    opacity: 0.5,
  },

  // ── JOIN BUTTON
  joinBtnSmall: {
    backgroundColor: "#032018",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 10,
    alignSelf: "center",
  },
  fullBtn: {
    backgroundColor: "#F0F0EC",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.12)",
  },
  joinBtnText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  fullBtnText: { color: "rgba(3,32,24,0.45)" },

  // ── BACK BUTTON
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 2,
  },
  backText: {
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
  },

  // ── PROFILE VIEW
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 16,
  },
  profileAvatarBox: {
    width: 82,
    height: 82,
    backgroundColor: "white",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.08)",
  },
  profileAvatarImage: { width: 56, height: 56 },
  profileHeaderRight: {
    flex: 1,
    justifyContent: "space-between",
    height: 82,
  },
  profileRankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankBadgeLarge: {
    backgroundColor: "rgba(113,179,18,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(113,179,18,0.25)",
  },
  rankBadgeLargeText: {
    color: "#71B312",
    fontSize: 11,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  clanReqRowProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  reqBlock: { gap: 2 },
  reqDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(3,32,24,0.08)",
  },
  profileNameLarge: {
    color: "#032018",
    fontSize: 26,
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginBottom: 10,
  },

  // ── SECTION TITLE
  sectionTitle: {
    color: "#032018",
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginBottom: 8,
  },

  // ── REQ LABELS
  reqLabel: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.45,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reqValueLarge: {
    color: "#032018",
    fontSize: 20,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },

  // ── CARD
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.07)",
  },
  descriptionText: {
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    opacity: 0.65,
    lineHeight: 22,
  },

  // ── STATS ROW
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    gap: 3,
  },
  statCardCentered: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
  },
  statValue: {
    color: "#032018",
    fontSize: 24,
    fontFamily: "Space Mono",
    fontWeight: "700",
    lineHeight: 28,
  },
  statValueMuted: {
    fontSize: 15,
    opacity: 0.4,
    fontWeight: "400",
  },
  statSub: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.35,
  },

  // ── MEMBERS LIST
  membersListCard: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.07)",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  memberRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 32, 24, 0.06)",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DAF8B7",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitial: {
    color: "#032018",
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  memberName: {
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  memberRole: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.45,
    marginTop: 1,
  },
  memberLevel: {
    color: "#032018",
    fontSize: 12,
    fontFamily: "Space Mono",
    opacity: 0.5,
  },

  // ── CREATE FORM
  cardSectionLabel: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.45,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    justifyContent: "space-between",
  },
  logoOption: {
    width: 50,
    height: 50,
    backgroundColor: "#F5F7F2",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  logoOptionSelected: {
    backgroundColor: "rgba(113,179,18,0.12)",
    borderColor: "#032018",
  },
  inputField: {
    backgroundColor: "#F5F7F2",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 14,
    marginTop: 8,
  },
  radioRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 18,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.15)",
    alignItems: "center",
  },
  radioBtnActive: {
    backgroundColor: "#032018",
    borderColor: "#032018",
  },
  radioText: {
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 13,
    fontWeight: "700",
  },
  radioTextActive: { color: "white" },
  inputGroup: { marginTop: 16 },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createSubmitBtn: {
    backgroundColor: "#032018",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },
  createSubmitText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },

  // ── DASHBOARD HEADER
  dashboardHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "white",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    gap: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(3,32,24,0.06)",
  },
  dashIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },
  dashLogoBox: {
    width: 46,
    height: 46,
    backgroundColor: "#F5F7F2",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.07)",
  },
  dashTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dashTitle: {
    color: "#032018",
    fontSize: 18,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  dashSubtitle: {
    color: "#032018",
    fontSize: 11,
    fontFamily: "Space Mono",
    opacity: 0.4,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: "rgba(113, 179, 18, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(113,179,18,0.25)",
  },
  rankBadgeText: {
    color: "#71B312",
    fontSize: 10,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  chatEntryBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#F5F7F2",
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3,32,24,0.07)",
  },

  // ── BUFF PILLS
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F5F7F2",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.08)",
  },
  pillActive: {
    backgroundColor: "rgba(113, 179, 18, 0.10)",
    borderColor: "rgba(113,179,18,0.3)",
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.5,
  },
  pillTextActive: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#71B312",
    fontWeight: "700",
  },

  // ── TABS
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: "#032018" },
  tabBtnText: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },
  tabBtnTextActive: {
    color: "white",
    opacity: 1,
    fontWeight: "700",
  },

  // ── TAB CONTENT
  tabContainer: { gap: 10 },
  tabScroll: { flex: 1 },

  // ── CARD HEADER
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  cardAction: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },
  cardSectionLabel2: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.45,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── COMMODITY
  commodityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 10,
  },
  commodityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3,32,24,0.06)",
  },
  cropIconWrap: {
    width: 38,
    height: 38,
    backgroundColor: "#F5F7F2",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cropInfo: { flex: 1 },
  cropRight: { alignItems: "flex-end", gap: 4 },
  commodityName: {
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  commodityStats: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
    marginTop: 2,
  },
  priceMove: {
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  hintPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  hintText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.4,
  },
  sellHint: { backgroundColor: "#FF383C" },
  buyHint: { backgroundColor: "#71B312" },
  holdHint: { backgroundColor: "#FFB038" },

  monopolyTag: {
    backgroundColor: "rgba(255,56,60,0.1)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(255,56,60,0.2)",
  },
  monopolyText: {
    fontSize: 8,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#FF383C",
    letterSpacing: 0.3,
  },

  // ── MINI ROSTER
  miniMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  miniMemberBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3,32,24,0.06)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  miniMemberName: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    fontWeight: "700",
    flex: 1,
  },
  miniMemberRole: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },

  // ── VAULT / METER
  vaultMeterContainer: { marginTop: 14, gap: 8 },
  vaultMeterBg: {
    height: 10,
    backgroundColor: "#F5F7F2",
    borderRadius: 8,
    overflow: "hidden",
  },
  vaultMeterFill: {
    height: "100%",
    backgroundColor: "#71B312",
    borderRadius: 8,
  },
  vaultLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vaultLabelText: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.45,
  },

  // ── DEPOSIT
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  depositName: {
    fontSize: 13,
    fontFamily: "Space Mono",
    color: "#032018",
    fontWeight: "700",
  },
  depositQty: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
    flex: 1,
    textAlign: "right",
    marginRight: 12,
  },
  depositBtn: {
    width: 28,
    height: 28,
    backgroundColor: "#DAF8B7",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  depositBtnText: {
    color: "#032018",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 20,
  },

  // ── DEFENSE
  defenseGrid: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  defenseItem: {
    flex: 1,
    backgroundColor: "#F5F7F2",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    gap: 5,
  },
  defenseLabel: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  defenseValue: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#71B312",
  },
  noDataBox: {
    marginTop: 12,
    padding: 22,
    backgroundColor: "#F5F7F2",
    borderRadius: 13,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.1)",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.3,
  },

  // ── IDOL
  quotaTitle: {
    fontSize: 12,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  penaltyText: {
    color: "white",
    fontFamily: "Space Mono",
    fontSize: 12,
    marginTop: 6,
    opacity: 0.88,
  },

  // ── ROSTER
  fullMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  fullMemberBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3,32,24,0.06)",
  },
  memberAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DAF8B7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  onlineDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#71B312",
    borderWidth: 2,
    borderColor: "white",
  },
  fullMemberName: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  fullMemberRole: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
    marginTop: 2,
  },
  wealthLabel: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },

  // ── ADMIN ACTION BUTTONS
  cancelBtn: {
    backgroundColor: "#FF383C",
    borderWidth: 0,
  },
  cancelBtnText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  cancelRequestBtn: {
    marginTop: 8,
    backgroundColor: "rgba(3, 32, 24, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cancelRequestText: {
    fontSize: 11,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  adminAcceptBtn: {
    backgroundColor: "#DAF8B7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(113,179,18,0.3)",
  },
  adminAcceptText: {
    fontSize: 10,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  adminRejectBtn: {
    backgroundColor: "rgba(255,56,60,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,56,60,0.2)",
  },
  adminRejectText: {
    fontSize: 10,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#FF383C",
  },
  adminDemoteBtn: {
    backgroundColor: "rgba(255,176,56,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,176,56,0.3)",
  },
  adminDemoteText: {
    fontSize: 10,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#CC8800",
  },
});
