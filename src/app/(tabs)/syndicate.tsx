import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  Search,
  Shield,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { useSyndicateStore } from "../../store/syndicate-store";
import { ScreenHeader } from "@/components/screen-header";
import { SubTabs } from "@/components/sub-tabs";
import { ThemedView } from "@/components/themed-view";
import { Plus } from "lucide-react-native";

import { MOCK_SYNDICATES, Syndicate } from "../../constants/syndicate-mock";
import { BottomTabInset } from "../../constants/theme";

const reindeerIcon = require("@/assets/image/assets_images_icons_sanctuary_reindeer.webp");
const phoenixIcon = require("@/assets/image/assets_images_icons_sanctuary_phoenix.webp");
const peacockIcon = require("@/assets/image/assets_images_icons_sanctuary_peacock.webp");
const pandaIcon = require("@/assets/image/assets_images_icons_sanctuary_panda.webp");
const flamingoIcon = require("@/assets/image/assets_images_icons_sanctuary_flamingo.webp");
const alpacaIcon = require("@/assets/image/assets_images_icons_sanctuary_alpaca.webp");

const CLAN_LOGOS = [
  reindeerIcon,
  phoenixIcon,
  peacockIcon,
  pandaIcon,
  flamingoIcon,
  alpacaIcon,
];

const crownIcon = require("@/assets/image/assets_images_icons_misc_crown.webp");
const coinsIcon = require("@/assets/image/assets_images_icons_misc_coins.webp");

const carrotIcon = require("@/assets/image/assets_images_icons_crops_carrot.webp");
const cornIcon = require("@/assets/image/assets_images_icons_crops_corn.webp");
const berryIcon = require("@/assets/image/assets_images_icons_areaitems_berries.webp");

type Tab = "dashboard" | "bank" | "war" | "idol" | "roster";

const SYNDICATE_TABS = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "bank", label: "BANK" },
  { id: "war", label: "WAR" },
  { id: "idol", label: "IDOL" },
  { id: "roster", label: "ROSTER" },
];

interface CropShare {
  name: string;
  image: any;
  share: number;
  priceMove: number;
  monopoly: boolean;
  hint: "buy" | "sell" | "hold";
  vaultQty: number;
}

const CROPS: CropShare[] = [
  {
    name: "Carrot",
    image: carrotIcon,
    share: 51,
    priceMove: 4.2,
    monopoly: true,
    hint: "sell",
    vaultQty: 340,
  },
  {
    name: "Corn",
    image: cornIcon,
    share: 28,
    priceMove: -1.8,
    monopoly: false,
    hint: "buy",
    vaultQty: 120,
  },
  {
    name: "Berry",
    image: berryIcon,
    share: 15,
    priceMove: 0.5,
    monopoly: false,
    hint: "hold",
    vaultQty: 85,
  },
];

export default function SyndicateScreen() {
  const insets = useSafeAreaInsets();
  const { joinedSyndicate, joinSyndicate, _hasHydrated } = useSyndicateStore();
  const router = useRouter();

  const [selectedSyndicate, setSelectedSyndicate] = useState<Syndicate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedMessage, setJoinedMessage] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(CLAN_LOGOS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [minLevel, setMinLevel] = useState("1");
  const [minGold, setMinGold] = useState("0");

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const filteredSyndicates = MOCK_SYNDICATES.filter((s: Syndicate) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const playerStats = { level: 12, totalAsset: 50 };

  if (!_hasHydrated) return null;

  // ── SYNDICATE DETAIL VIEW ─────────────────────────────────────────────────
  if (selectedSyndicate) {
    const isFull = selectedSyndicate.memberCount >= selectedSyndicate.maxMembers;
    const meetsReqs =
      playerStats.level >= selectedSyndicate.minLevel &&
      playerStats.totalAsset >= selectedSyndicate.minAsset;
    const canJoin = !isFull && selectedSyndicate.status !== "Closed" && meetsReqs;

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
                  {!joinedMessage?.includes(selectedSyndicate.name) && (
                    <TouchableOpacity
                      style={[styles.joinBtnSmall, !canJoin && styles.fullBtn]}
                      disabled={!canJoin}
                      onPress={() => {
                        joinSyndicate({
                          id: selectedSyndicate.id,
                          name: selectedSyndicate.name,
                          rank: selectedSyndicate.rank,
                          logo: phoenixIcon,
                          role: "Initiate",
                          wealth: 8420,
                          memberCount: selectedSyndicate.memberCount + 1,
                          maxMembers: selectedSyndicate.maxMembers,
                          season: "Season 4 · Rise of Roots",
                        });
                        setJoinedMessage(`You joined ${selectedSyndicate.name}!`);
                        setSelectedSyndicate(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.joinBtnText,
                          !canJoin && styles.fullBtnText,
                        ]}
                      >
                        {isFull ? "Full" : canJoin ? "Join" : "Locked"}
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

            <Text style={styles.profileNameLarge}>{selectedSyndicate.name}</Text>

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
                <Text style={styles.statValue}>{selectedSyndicate.status}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Members ({selectedSyndicate.memberCount})
              </Text>
              <View style={styles.membersListCard}>
                {selectedSyndicate.members.map((member, idx) => (
                  <View
                    key={member.id}
                    style={[styles.memberRow, idx > 0 && styles.memberRowBorder]}
                  >
                    <View style={styles.memberInfo}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitial}>{member.initial}</Text>
                      </View>
                      <View>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberRole}>{member.role}</Text>
                      </View>
                    </View>
                    <Text style={styles.memberLevel}>Lv.{member.level}</Text>
                  </View>
                ))}
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
                {CLAN_LOGOS.map((logo, index) => {
                  const isSelected = selectedLogo === logo;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedLogo(logo)}
                      style={[
                        styles.logoOption,
                        isSelected && styles.logoOptionSelected,
                      ]}
                    >
                      <Image
                        source={logo}
                        style={{ width: 36, height: 36 }}
                        contentFit="contain"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardSectionLabel}>Clan Name (3–28 chars)</Text>
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
                    style={[styles.radioText, isPublic && styles.radioTextActive]}
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
              style={[styles.createSubmitBtn, !isNameValid && { opacity: 0.45 }]}
              disabled={!isNameValid}
              onPress={() => {
                setJoinedMessage(`Created clan: ${name.trim()}`);
                joinSyndicate({
                  id: Math.random().toString(),
                  name: name.trim(),
                  rank: 99,
                  logo: selectedLogo,
                  role: "Grandmaster",
                  wealth: 0,
                  memberCount: 1,
                  maxMembers: 25,
                  season: "Season 4 · Start",
                });
                setIsCreating(false);
                setName("");
                setDescription("");
              }}
            >
              <Text style={styles.createSubmitText}>Create Clan</Text>
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
              contentContainerStyle={{ gap: 6, paddingRight: 4, paddingBottom: 12 }}
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
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listContainer}>
            {filteredSyndicates.length === 0 ? (
              <Text style={styles.noClansText}>No clans found</Text>
            ) : (
              filteredSyndicates.map((syn: Syndicate, idx: number) => {
                const isFull = syn.memberCount >= syn.maxMembers;
                const meetsReqs =
                  playerStats.level >= syn.minLevel &&
                  playerStats.totalAsset >= syn.minAsset;
                const canJoin = !isFull && syn.status !== "Closed" && meetsReqs;

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
                        <Text style={styles.clanReqText}>Lv.{syn.minLevel}+</Text>
                        <Text style={styles.clanReqSep}>·</Text>
                        <Text style={styles.clanReqText}>
                          Asset {syn.minAsset}+
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.joinBtnSmall, !canJoin && styles.fullBtn]}
                      disabled={!canJoin}
                      onPress={() => setJoinedMessage(`You joined ${syn.name}!`)}
                    >
                      <Text
                        style={[
                          styles.joinBtnText,
                          !canJoin && styles.fullBtnText,
                        ]}
                      >
                        {isFull ? "Full" : canJoin ? "Join" : "Locked"}
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

function DashboardContent() {
  const { joinedSyndicate } = useSyndicateStore();
  if (!joinedSyndicate) return null;

  return (
    <View style={styles.tabContainer}>
      {/* Wealth + Members */}
      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.reqLabel}>Wealth</Text>
          <Text style={styles.statValue}>
            ${joinedSyndicate.wealth.toLocaleString()}
          </Text>
          <Text style={styles.statSub}>Season total</Text>
        </View>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.reqLabel}>Members</Text>
          <Text style={styles.statValue}>
            {joinedSyndicate.memberCount}
            <Text style={styles.statValueMuted}>
              /{joinedSyndicate.maxMembers}
            </Text>
          </Text>
          <Text style={styles.statSub}>
            {joinedSyndicate.maxMembers - joinedSyndicate.memberCount} slots
            open
          </Text>
        </View>
      </View>

      {/* Commodity Board */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Commodity Board</Text>
          <ChevronDown size={15} color="rgba(3,32,24,0.4)" />
        </View>

        {CROPS.map((crop, i) => (
          <View
            key={crop.name}
            style={[
              styles.commodityRow,
              i < CROPS.length - 1 && styles.commodityRowBorder,
            ]}
          >
            <View style={styles.cropIconWrap}>
              <Image
                source={crop.image}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            </View>
            <View style={styles.cropInfo}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.commodityName}>{crop.name}</Text>
                {crop.monopoly && (
                  <View style={styles.monopolyTag}>
                    <Text style={styles.monopolyText}>MONOPOLY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.commodityStats}>
                {crop.share}% Syndicate Share
              </Text>
            </View>
            <View style={styles.cropRight}>
              <Text
                style={[
                  styles.priceMove,
                  { color: crop.priceMove > 0 ? "#71B312" : "#FF383C" },
                ]}
              >
                {crop.priceMove > 0 ? "+" : ""}
                {crop.priceMove}%
              </Text>
              <View
                style={[
                  styles.hintPill,
                  crop.hint === "sell"
                    ? styles.sellHint
                    : crop.hint === "buy"
                      ? styles.buyHint
                      : styles.holdHint,
                ]}
              >
                <Text style={styles.hintText}>{crop.hint.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Active Roster */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Active Roster</Text>
          <Text style={styles.cardAction}>View all</Text>
        </View>

        {[
          { name: "Satoshi_Grind", role: "Grandmaster", online: true },
          { name: "CropCommander", role: "Enforcer", online: true },
          { name: "YieldHunter", role: "Enforcer", online: false },
        ].map((m, i, arr) => (
          <View
            key={m.name}
            style={[
              styles.miniMemberRow,
              i < arr.length - 1 && styles.miniMemberBorder,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: m.online ? "#71B312" : "#FFB038" },
              ]}
            />
            <Text style={styles.miniMemberName}>{m.name}</Text>
            <Text style={styles.miniMemberRole}>{m.role}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BankContent() {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Syndicate Vault</Text>
        <View style={styles.vaultMeterContainer}>
          <View style={styles.vaultMeterBg}>
            <View style={[styles.vaultMeterFill, { width: "68%" }]} />
          </View>
          <View style={styles.vaultLabels}>
            <Text style={styles.vaultLabelText}>6.8k / 10k Tokens</Text>
            <Text style={styles.vaultLabelText}>LVL 4</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Deposit Assets</Text>
        <View style={{ gap: 2, marginTop: 12 }}>
          {CROPS.map((crop, i) => (
            <View
              key={crop.name}
              style={[
                styles.depositRow,
                i < CROPS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(3,32,24,0.06)",
                },
              ]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Image
                  source={crop.image}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                />
                <Text style={styles.depositName}>{crop.name}</Text>
              </View>
              <Text style={styles.depositQty}>{crop.vaultQty} in vault</Text>
              <TouchableOpacity style={styles.depositBtn}>
                <Text style={styles.depositBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function WarContent() {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Defense Status</Text>
        <View style={styles.defenseGrid}>
          <View style={styles.defenseItem}>
            <Shield size={16} color="#71B312" />
            <Text style={styles.defenseLabel}>Shields</Text>
            <Text style={styles.defenseValue}>Online</Text>
          </View>
          <View style={styles.defenseItem}>
            <Text style={styles.defenseLabel}>Garrison</Text>
            <Text style={styles.defenseValue}>12/20</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Wars</Text>
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>No active conflicts</Text>
        </View>
      </View>
    </View>
  );
}

function IdolContent() {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Global Quota</Text>
        <View style={{ marginTop: 14 }}>
          <Text style={styles.quotaTitle}>Corn Harvest Mission</Text>
          <View style={[styles.vaultMeterBg, { marginTop: 8 }]}>
            <View
              style={[
                styles.vaultMeterFill,
                { width: "42%", backgroundColor: "#71B312" },
              ]}
            />
          </View>
          <View style={[styles.vaultLabels, { marginTop: 6 }]}>
            <Text style={styles.vaultLabelText}>4,200 harvested</Text>
            <Text style={styles.vaultLabelText}>10,000 goal</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: "#FF383C", borderColor: "transparent" },
        ]}
      >
        <Text style={[styles.cardTitle, { color: "white" }]}>
          Active Penalty
        </Text>
        <Text style={styles.penaltyText}>Market Tax: +5% (Quota Failed)</Text>
      </View>
    </View>
  );
}

function RosterContent() {
  const { joinedSyndicate } = useSyndicateStore();
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Members ({joinedSyndicate?.memberCount})
        </Text>
        <View style={{ gap: 0, marginTop: 14 }}>
          {[
            {
              initial: "S",
              name: "Satoshi_Grind",
              role: "Grandmaster · Lv. 45",
              wealth: "$2.4M",
              online: true,
            },
            {
              initial: "C",
              name: "CropCommander",
              role: "Enforcer · Lv. 38",
              wealth: "$1.1M",
              online: true,
            },
          ].map((m, i, arr) => (
            <View
              key={m.name}
              style={[
                styles.fullMemberRow,
                i < arr.length - 1 && styles.fullMemberBorder,
              ]}
            >
              <View style={styles.memberAvatarSmall}>
                <Text style={styles.avatarInitial}>{m.initial}</Text>
                {m.online && <View style={styles.onlineDot} />}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.fullMemberName}>{m.name}</Text>
                <Text style={styles.fullMemberRole}>{m.role}</Text>
              </View>
              <Text style={styles.wealthLabel}>{m.wealth}</Text>
            </View>
          ))}
        </View>
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
});
