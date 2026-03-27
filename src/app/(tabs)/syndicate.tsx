import { Search, ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSyndicateStore, SyndicateRole, SyndicateActivity } from "../../store/syndicate-store";
import { ChevronDown, MessageSquare } from "lucide-react-native";
import { useRouter } from "expo-router";

import { BottomTabInset, Spacing } from "../../constants/theme";
import { Syndicate, MOCK_SYNDICATES } from "../../constants/syndicate-mock";

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
  { name: "Carrot", image: carrotIcon, share: 51, priceMove: 4.2, monopoly: true, hint: "sell", vaultQty: 340 },
  { name: "Corn", image: cornIcon, share: 28, priceMove: -1.8, monopoly: false, hint: "buy", vaultQty: 120 },
  { name: "Berry", image: berryIcon, share: 15, priceMove: 0.5, monopoly: false, hint: "hold", vaultQty: 85 },
];

export default function SyndicateScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 20) + 8;

  const { joinedSyndicate, joinSyndicate, _hasHydrated } = useSyndicateStore();
  const router = useRouter();

  const [selectedSyndicate, setSelectedSyndicate] = useState<Syndicate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedMessage, setJoinedMessage] = useState<string | null>(null);

  // Creation Form State
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(CLAN_LOGOS[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [minLevel, setMinLevel] = useState("1");
  const [minGold, setMinGold] = useState("0");

  // Dashboard State
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const filteredSyndicates = MOCK_SYNDICATES.filter((s: Syndicate) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // MOCK STATS for requirement checking to match provided logic
  const playerStats = { level: 12, totalAsset: 50 };

  if (!_hasHydrated) return null;

  if (selectedSyndicate) {
    const isFull = selectedSyndicate.memberCount >= selectedSyndicate.maxMembers;
    const meetsReqs = playerStats.level >= selectedSyndicate.minLevel && playerStats.totalAsset >= selectedSyndicate.minAsset;
    const canJoin = !isFull && selectedSyndicate.status !== "Closed" && meetsReqs;

    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSyndicate(null)}
          >
            <ChevronLeft color="#032018" size={20} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Profile Header (Avatar Left, Info Right) */}
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
                <Text style={styles.rankText}>Rank #{selectedSyndicate.rank}</Text>
                {/* Top Join Button */}
                {!joinedMessage?.includes(selectedSyndicate.name) && (
                  <TouchableOpacity
                    style={[
                      styles.joinBtnSmall,
                      !canJoin && styles.fullBtn
                    ]}
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
                    <Text style={[
                      styles.joinBtnText,
                      !canJoin && styles.fullBtnText
                    ]}>
                      {isFull ? "Full" : canJoin ? "Join" : "Locked"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Requirements Next to Avatar */}
              <View style={styles.clanReqRowProfile}>
                <View>
                  <Text style={styles.reqLabel}>Min Level</Text>
                  <Text style={styles.reqValueLarge}>{selectedSyndicate.minLevel}</Text>
                </View>
                <View>
                  <Text style={styles.reqLabel}>Min Asset</Text>
                  <Text style={styles.reqValueLarge}>{selectedSyndicate.minAsset}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Clan Name directly under the header block */}
          <Text style={styles.profileNameLarge}>{selectedSyndicate.name}</Text>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              {selectedSyndicate.description}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsRow}>
            <View style={[styles.card, styles.statCardCentered]}>
              <Text style={styles.reqLabel}>Members</Text>
              <Text style={styles.statValue}>
                {selectedSyndicate.memberCount}/{selectedSyndicate.maxMembers}
              </Text>
            </View>
            <View style={[styles.card, styles.statCardCentered]}>
              <Text style={styles.reqLabel}>Status</Text>
              <Text style={styles.statValue}>{selectedSyndicate.status}</Text>
            </View>
          </View>

          {/* Members List */}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>
              Members ({selectedSyndicate.memberCount})
            </Text>
            <View style={styles.membersListCard}>
              {selectedSyndicate.members.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    idx > 0 && styles.memberRowBorder,
                  ]}
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
      </View>
    );
  }

  // --- Create Mode View ---
  if (isCreating) {
    const isNameValid = name.trim().length >= 3;
    
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsCreating(false)}
          >
            <ChevronLeft color="#032018" size={20} />
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.profileNameLarge}>Create Clan</Text>

          {/* Logo Picker */}
          <View style={styles.card}>
            <Text style={styles.reqLabel}>Clan Logo</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12, justifyContent: "space-between" }}>
              {CLAN_LOGOS.map((logo, index) => {
                const isSelected = selectedLogo === logo;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedLogo(logo)}
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: isSelected ? "rgba(113, 179, 18, 0.2)" : "#F8F9FA",
                      borderRadius: 12,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: isSelected ? "#032018" : "transparent"
                    }}
                  >
                    <Image source={logo} style={{ width: 36, height: 36 }} contentFit="contain" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Basis Info */}
          <View style={styles.card}>
            <Text style={styles.reqLabel}>Clan Name (3-28 chars)</Text>
            <TextInput
              style={styles.inputField}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Grain Ghosts"
              placeholderTextColor="rgba(3, 32, 24, 0.4)"
              maxLength={28}
            />

            <Text style={[styles.reqLabel, { marginTop: 16 }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.inputField,
                { height: 80, textAlignVertical: "top" },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your clan..."
              placeholderTextColor="rgba(3, 32, 24, 0.4)"
              multiline
              maxLength={240}
            />
          </View>

          {/* Preferences */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
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

            <View style={{ gap: 16 }}>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Image
                    source={crownIcon}
                    style={{ width: 16, height: 16 }}
                  />
                  <Text style={styles.reqLabel}>Min Level Preference</Text>
                </View>
                <TextInput
                  style={styles.inputField}
                  value={minLevel}
                  onChangeText={setMinLevel}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <Image
                    source={coinsIcon}
                    style={{ width: 16, height: 16 }}
                  />
                  <Text style={styles.reqLabel}>Min Gold Preference</Text>
                </View>
                <TextInput
                  style={styles.inputField}
                  value={minGold}
                  onChangeText={setMinGold}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.createSubmitBtn,
              !isNameValid && { opacity: 0.5 },
            ]}
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
            <Text style={styles.createSubmitText}>
              Create
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // --- Dashboard View (Joined) ---
  if (joinedSyndicate) {

    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.dashboardHeader}>
          <View style={styles.dashIdentity}>
            <View style={styles.dashLogoBox}>
              <Image source={joinedSyndicate.logo} style={{ width: 32, height: 32 }} contentFit="contain" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.dashTitle}>{joinedSyndicate.name}</Text>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{joinedSyndicate.rank}</Text>
                </View>
              </View>
              <Text style={styles.dashSubtitle}>{joinedSyndicate.season}</Text>
            </View>
            <TouchableOpacity style={styles.chatEntryBtn} onPress={() => router.push("/syndicate-chat")}>
              <MessageSquare size={18} color="#032018" />
            </TouchableOpacity>
          </View>

          {/* Buff Strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buffStrip} contentContainerStyle={{ gap: 8 }}>
            <View style={[styles.pill, styles.pillActive]}><Text style={styles.pillTextActive}>Craft +12%</Text></View>
            <View style={[styles.pill, styles.pillActive]}><Text style={styles.pillTextActive}>Econ +8%</Text></View>
            <View style={styles.pill}><Text style={styles.pillText}>Yield +5%</Text></View>
          </ScrollView>

          {/* Tab Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ gap: 4 }}>
            {(["dashboard", "bank", "war", "idol", "roster"] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === "dashboard" && <DashboardContent />}
          {activeTab === "bank" && <BankContent />}
          {activeTab === "war" && <WarContent />}
          {activeTab === "idol" && <IdolContent />}
          {activeTab === "roster" && <RosterContent />}
        </ScrollView>
      </View>
    );
  }

  // --- Search List View ---
  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Clans</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreating(true)}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>


      {/* Search Box */}
      <View style={styles.searchBox}>
        <Search size={16} color="rgba(3, 32, 24, 0.5)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clans..."
          placeholderTextColor="rgba(3, 32, 24, 0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Banner */}
      {joinedMessage && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{joinedMessage}</Text>
        </View>
      )}

      {/* List */}
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
              const meetsReqs = playerStats.level >= syn.minLevel && playerStats.totalAsset >= syn.minAsset;
              const canJoin = !isFull && syn.status !== "Closed" && meetsReqs;

              return (
                <TouchableOpacity
                  key={syn.id}
                  style={styles.clanCard}
                  onPress={() => setSelectedSyndicate(syn)}
                  activeOpacity={0.7}
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
                      <Text style={styles.rankText}>Rank #{syn.rank}</Text>
                    </View>
                    <Text style={styles.clanMembersText}>
                      {syn.memberCount}/{syn.maxMembers} members
                    </Text>
                    <View style={styles.clanReqRow}>
                      <Text style={styles.clanReqText}>Lv.{syn.minLevel}+</Text>
                      <Text style={styles.clanReqText}>Asset {syn.minAsset}+</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.joinBtnSmall,
                      !canJoin && styles.fullBtn
                    ]}
                    disabled={!canJoin}
                    onPress={() => setJoinedMessage(`You joined ${syn.name}!`)}
                  >
                    <Text style={[
                      styles.joinBtnText,
                      !canJoin && styles.fullBtnText
                    ]}>
                      {isFull ? "Full" : canJoin ? "Join" : "Locked"}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-Components ──────────────────────────────────────────

function DashboardContent() {
  const { joinedSyndicate } = useSyndicateStore();
  if (!joinedSyndicate) return null;

  return (
    <View style={styles.tabContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.reqLabel}>Wealth</Text>
          <Text style={styles.statValue}>${joinedSyndicate.wealth.toLocaleString()}</Text>
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.reqLabel}>Members</Text>
          <Text style={styles.statValue}>{joinedSyndicate.memberCount}/{joinedSyndicate.maxMembers}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Commodity Board</Text>
          <ChevronDown size={16} color="#032018" opacity={0.5} />
        </View>
        <View style={{ gap: 12, marginTop: 12 }}>
          {CROPS.map((crop) => (
            <View key={crop.name} style={styles.commodityRow}>
              <View style={styles.commodityInfo}>
                <Image source={crop.image} style={{ width: 28, height: 28 }} contentFit="contain" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.commodityName}>{crop.name}</Text>
                  <Text style={styles.commodityStats}>{crop.share}% Syndicate Share</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.priceMove, { color: crop.priceMove > 0 ? "#71B312" : "#FF383C" }]}>
                  {crop.priceMove > 0 ? "+" : ""}{crop.priceMove}%
                </Text>
                <View style={[styles.hintPill, crop.hint === "sell" ? styles.sellHint : crop.hint === "buy" ? styles.buyHint : styles.holdHint]}>
                  <Text style={styles.hintText}>{crop.hint.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Roster</Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          <View style={styles.miniMemberRow}>
            <View style={[styles.statusDot, { backgroundColor: "#71B312" }]} />
            <Text style={styles.miniMemberName}>Satoshi_Grind</Text>
            <Text style={styles.miniMemberRole}>Grandmaster</Text>
          </View>
          <View style={styles.miniMemberRow}>
            <View style={[styles.statusDot, { backgroundColor: "#71B312" }]} />
            <Text style={styles.miniMemberName}>CropCommander</Text>
            <Text style={styles.miniMemberRole}>Enforcer</Text>
          </View>
          <View style={styles.miniMemberRow}>
            <View style={[styles.statusDot, { backgroundColor: "#FFB038" }]} />
            <Text style={styles.miniMemberName}>YieldHunter</Text>
            <Text style={styles.miniMemberRole}>Enforcer</Text>
          </View>
        </View>
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
        <View style={{ gap: 8, marginTop: 12 }}>
          {CROPS.map((crop) => (
            <View key={crop.name} style={styles.depositRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Image source={crop.image} style={{ width: 24, height: 24 }} />
                <Text style={styles.depositName}>{crop.name}</Text>
              </View>
              <Text style={styles.depositQty}>{crop.vaultQty} in Vault</Text>
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
        <View style={{ marginTop: 12 }}>
          <Text style={styles.quotaTitle}>Corn Harvest Mission</Text>
          <View style={styles.vaultMeterBg}>
            <View style={[styles.vaultMeterFill, { width: "42%", backgroundColor: "#71B312" }]} />
          </View>
          <Text style={styles.vaultLabelText}>4,200 / 10,000</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: "#FF383C" }]}>
        <Text style={[styles.cardTitle, { color: "white" }]}>Active Penalty</Text>
        <Text style={{ color: "white", fontFamily: "Space Mono", fontSize: 13, marginTop: 4, opacity: 0.9 }}>
          Market Tax: +5% (Quota Failed)
        </Text>
      </View>
    </View>
  );
}

function RosterContent() {
  const { joinedSyndicate } = useSyndicateStore();
  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Members ({joinedSyndicate?.memberCount})</Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          <View style={styles.fullMemberRow}>
             <View style={styles.memberAvatarSmall}>
               <Text style={styles.avatarInitial}>S</Text>
               <View style={styles.onlineDot} />
             </View>
             <View style={{ flex: 1, marginLeft: 12 }}>
               <Text style={styles.fullMemberName}>Satoshi_Grind</Text>
               <Text style={styles.fullMemberRole}>Grandmaster · Lv. 45</Text>
             </View>
             <Text style={styles.wealthLabel}>$2.4M</Text>
          </View>
          <View style={styles.fullMemberRow}>
             <View style={styles.memberAvatarSmall}>
               <Text style={styles.avatarInitial}>C</Text>
               <View style={styles.onlineDot} />
             </View>
             <View style={{ flex: 1, marginLeft: 12 }}>
               <Text style={styles.fullMemberName}>CropCommander</Text>
               <Text style={styles.fullMemberRole}>Enforcer · Lv. 38</Text>
             </View>
             <Text style={styles.wealthLabel}>$1.1M</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    // Add significant padding to clear navigation bar and notch completely
    paddingBottom: BottomTabInset + 120,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
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
    paddingVertical: 8,
    borderRadius: 14,
  },
  createBtnText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: Spacing.four,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    marginBottom: Spacing.four,
  },
  searchInput: {
    flex: 1,
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    padding: 0,
  },
  banner: {
    backgroundColor: "white",
    marginHorizontal: Spacing.four,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: Spacing.four,
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
    opacity: 0.5,
    marginTop: 40,
    fontFamily: "Space Mono",
    fontSize: 14,
  },
  listContainer: {
    gap: 12,
  },
  clanCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
  },
  clanAvatar: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(113, 179, 18, 0.15)",
    borderRadius: 14,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  clanAvatarImage: {
    width: 32,
    height: 32,
  },
  clanInfo: {
    flex: 1,
    gap: 2,
  },
  clanNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  clanName: {
    color: "#032018",
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  rankText: {
    color: "#032018",
    fontSize: 13, // Increased from 11
    fontFamily: "Space Mono",
    opacity: 0.5,
  },
  clanReqRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  clanReqText: {
    color: "#032018",
    fontSize: 12, // Increased from 10
    fontFamily: "Space Mono",
    opacity: 0.4,
  },
  clanMembersText: {
    color: "#032018",
    fontSize: 13, // Increased from 11
    fontFamily: "Space Mono",
    opacity: 0.5,
  },
  joinBtnSmall: {
    backgroundColor: "#032018",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: "center",
  },
  fullBtn: {
    backgroundColor: "#DAF8B7",
  },
  joinBtnText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  fullBtnText: {
    color: "#032018",
  },

  // Profile View Styles
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6, // Very tight
  },
  backText: {
    color: "#032018",
    fontSize: 14,
    fontFamily: "Space Mono",
    marginLeft: 4,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6, // Very tight against title
  },
  profileAvatarBox: {
    width: 80,
    height: 80,
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarImage: {
    width: 54,
    height: 54,
  },
  profileHeaderRight: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
    height: 80,
  },
  profileRankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clanReqRowProfile: {
    flexDirection: "row",
    gap: 24,
  },
  profileNameLarge: {
    color: "#032018",
    fontSize: 26,
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginBottom: 8, // Very tight against description
  },
  sectionTitle: {
    color: "#032018",
    fontSize: 16,
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginBottom: 6, // Very close to list
  },
  reqLabel: {
    color: "#032018",
    fontSize: 13, // Increased from 12
    fontFamily: "Space Mono",
    opacity: 0.5,
  },
  reqValueLarge: {
    color: "#032018",
    fontSize: 20,
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginTop: 2,
  },
  card: {
    backgroundColor: "white",
    padding: 16, // Returned to standard to avoid bloat
    borderRadius: 16,
    marginBottom: 8, // Very tight
  },
  descriptionText: {
    color: "#032018",
    fontSize: 15, // Increased from 14
    fontFamily: "Space Mono",
    opacity: 0.7,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8, // Tight drop before Members
  },
  statCardCentered: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16, // Smoothed out
    backgroundColor: "white",
    borderRadius: 16,
  },
  statValue: {
    color: "#032018",
    fontSize: 24, // BIGGER
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  membersListCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14, // Extra breathing room inside
    paddingHorizontal: 16,
  },
  memberRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(3, 32, 24, 0.05)",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 36, // Bigger
    height: 36, // Bigger
    borderRadius: 18,
    backgroundColor: "#DAF8B7",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitial: {
    color: "#032018",
    fontSize: 14, // Bigger
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  memberName: {
    color: "#032018",
    fontSize: 16, // BIGGER
    fontFamily: "Space Mono",
    fontWeight: "700",
    marginBottom: 2,
  },
  memberRole: {
    color: "#032018",
    fontSize: 13, // Increased from 11
    fontFamily: "Space Mono",
    opacity: 0.5,
  },
  memberLevel: {
    color: "#032018",
    fontSize: 14, // Increased from 13
    fontFamily: "Space Mono",
    opacity: 0.6,
  },
  inputField: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 14,
    marginTop: 8,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.2)",
    alignItems: "center",
  },
  radioBtnActive: {
    backgroundColor: "#032018",
    borderColor: "#032018",
  },
  radioText: {
    color: "#032018",
    fontFamily: "Space Mono",
    fontSize: 14,
    fontWeight: "700",
  },
  radioTextActive: {
    color: "white",
  },
  createSubmitBtn: {
    backgroundColor: "#032018",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  createSubmitText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  // Dashboard Styles
  dashboardHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 16,
  },
  dashIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },
  dashLogoBox: {
    width: 48,
    height: 48,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  dashTitle: {
    color: "#032018",
    fontSize: 20,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  dashSubtitle: {
    color: "#032018",
    fontSize: 12,
    fontFamily: "Space Mono",
    opacity: 0.5,
  },
  rankBadge: {
    backgroundColor: "rgba(113, 179, 18, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    color: "#71B312",
    fontSize: 10,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  chatEntryBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buffStrip: {
    flexDirection: "row",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.05)",
  },
  pillActive: {
    backgroundColor: "rgba(113, 179, 18, 0.1)",
    borderColor: "#71B312",
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.6,
  },
  pillTextActive: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#71B312",
    fontWeight: "700",
  },
  tabScroll: {
    height: 44,
  },
  tabBtn: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: "#032018",
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.5,
  },
  tabBtnTextActive: {
    color: "white",
    opacity: 1,
    fontWeight: "700",
  },
  tabContainer: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  commodityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commodityInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  commodityName: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  commodityStats: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.5,
  },
  priceMove: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
  },
  hintPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  hintText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "white",
  },
  sellHint: { backgroundColor: "#FF383C" },
  buyHint: { backgroundColor: "#71B312" },
  holdHint: { backgroundColor: "#FFB038" },
  miniMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniMemberName: {
    fontSize: 13,
    fontFamily: "Space Mono",
    color: "#032018",
    flex: 1,
  },
  miniMemberRole: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },
  vaultMeterContainer: {
    marginTop: 12,
    gap: 8,
  },
  vaultMeterBg: {
    height: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    overflow: "hidden",
  },
  vaultMeterFill: {
    height: "100%",
    backgroundColor: "#71B312",
  },
  vaultLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vaultLabelText: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.6,
  },
  depositRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3, 32, 24, 0.05)",
  },
  depositName: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
  },
  depositQty: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.5,
  },
  depositBtn: {
    width: 24,
    height: 24,
    backgroundColor: "#DAF8B7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  depositBtnText: {
    color: "#032018",
    fontWeight: "700",
  },
  defenseGrid: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  defenseItem: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  defenseLabel: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },
  defenseValue: {
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#71B312",
  },
  noDataBox: {
    marginTop: 12,
    padding: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(3, 32, 24, 0.1)",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 13,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.3,
  },
  quotaTitle: {
    fontSize: 13,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
    marginBottom: 8,
  },
  fullMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  memberAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DAF8B7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontFamily: "Space Mono",
    fontWeight: "700",
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
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  fullMemberRole: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.5,
  },
  wealthLabel: {
    fontSize: 15,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  // Chat Styles
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(3, 32, 24, 0.05)",
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  chatBubble: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(3, 32, 24, 0.1)",
    gap: 4,
  },
  chatUser: {
    fontSize: 12,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  chatText: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
    lineHeight: 20,
  },
  chatInputRow: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: BottomTabInset + 16,
    backgroundColor: "white",
    gap: 12,
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Space Mono",
    fontSize: 14,
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
