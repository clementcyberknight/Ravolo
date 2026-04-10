export type SyndicateMember = {
  id: string;
  name: string;
  role: "Leader" | "Elder" | "Member";
  level: number;
  initial: string;
};

export type Syndicate = {
  id: string;
  name: string;
  rank: number;
  description: string;
  minLevel: number;
  minAsset: number;
  memberCount: number;
  maxMembers: number;
  /** Capacity / recruitment (legacy + list UI). */
  status: "Open" | "Closed" | "Full";
  /** Server `visibility` — shown as Public/Private in detail Status card. */
  visibility?: "public" | "private";
  members: SyndicateMember[];
};

export const MOCK_SYNDICATES: Syndicate[] = [
  {
    id: "s1",
    name: "Phoenix Order",
    rank: 15,
    description: "A legendary clan of dedicated farmers.",
    minLevel: 5,
    minAsset: 10,
    memberCount: 43,
    maxMembers: 50,
    status: "Open",
    members: [
      { id: "m1", name: "BloomRider", role: "Leader", level: 16, initial: "B" },
      { id: "m2", name: "HarvestHero", role: "Elder", level: 14, initial: "H" },
      { id: "m3", name: "FieldFox", role: "Elder", level: 18, initial: "F" },
      { id: "m4", name: "SoilSage", role: "Member", level: 23, initial: "S" },
      { id: "m5", name: "GrainGhost", role: "Member", level: 23, initial: "G" },
      { id: "m6", name: "SunChaser", role: "Member", level: 22, initial: "S" },
      { id: "m7", name: "SeedMaster", role: "Member", level: 17, initial: "S" },
      { id: "m8", name: "PlowPro", role: "Member", level: 16, initial: "P" },
      { id: "m9", name: "FarmKing", role: "Member", level: 14, initial: "F" },
      { id: "m10", name: "GreenQueen", role: "Member", level: 12, initial: "G" },
      { id: "m11", name: "RootWalker", role: "Member", level: 10, initial: "R" },
      { id: "m12", name: "CropLord", role: "Member", level: 6, initial: "C" },
      { id: "m13", name: "MoonReaper", role: "Member", level: 6, initial: "M" },
      { id: "m14", name: "RainMaker", role: "Member", level: 6, initial: "R" },
      { id: "m15", name: "LeafDancer", role: "Member", level: 5, initial: "L" },
    ],
  },
  {
    id: "s2",
    name: "Harvest Moon",
    rank: 8,
    description: "We farm by moonlight and profit by day.",
    minLevel: 10,
    minAsset: 25,
    memberCount: 28,
    maxMembers: 30,
    status: "Open",
    members: [],
  },
  {
    id: "s3",
    name: "Green Thumb",
    rank: 32,
    description: "Beginner friendly clan. All are welcome!",
    minLevel: 1,
    minAsset: 0,
    memberCount: 15,
    maxMembers: 40,
    status: "Open",
    members: [],
  },
  {
    id: "s4",
    name: "Iron Roots",
    rank: 3,
    description: "Top 3 global ranking. Serious players only.",
    minLevel: 20,
    minAsset: 100,
    memberCount: 50,
    maxMembers: 50,
    status: "Full",
    members: [],
  },
  {
    id: "s5",
    name: "Sunflower Squad",
    rank: 45,
    description: "Praise the sun and grow some flowers.",
    minLevel: 3,
    minAsset: 5,
    memberCount: 19,
    maxMembers: 25,
    status: "Open",
    members: [],
  },
  {
    id: "s6",
    name: "Midnight Garden",
    rank: 12,
    description: "A mysterious group of nocturnal harvesters.",
    minLevel: 8,
    minAsset: 30,
    memberCount: 33,
    maxMembers: 40,
    status: "Open",
    members: [],
  },
];
