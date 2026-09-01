export type FactionPersonality = "hawkish" | "dovish" | "pragmatic" | "reformist";

export interface Politician {
  id: string;
  name: string;
  factionId: string;
  role?: string;
}

export interface FactionDef {
  id: string;
  name: string;
  leaderName: string;
  personality: FactionPersonality;
  initialSeatShare: number;
  initialLoyalty: number;
}

export interface CountryDef {
  id: string;
  name: string;
  initialRelation: number;
}

export interface FamilyMemberDef {
  id: string;
  name: string;
  relation: string; // "配偶者" | "長女" | "長男" など
  initialRelationship: number;
}
