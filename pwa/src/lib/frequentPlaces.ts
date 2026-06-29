/** Frequent place kinds — mirrors backend catalogue */
export const FREQUENT_PLACE_KINDS = [
  { id: "work", label: "Work", icon: "work", description: "Office or workplace" },
  { id: "chill", label: "Chill spot", icon: "local_cafe", description: "Hangout & leisure" },
  { id: "gym", label: "Gym / fitness", icon: "fitness_center", description: "Workout & sports" },
  { id: "school", label: "School / study", icon: "school", description: "Campus or classes" },
  { id: "worship", label: "Worship", icon: "church", description: "Church, mosque, temple" },
  { id: "family", label: "Family", icon: "family_restroom", description: "Family or relatives" },
  { id: "other", label: "Other", icon: "place", description: "Anywhere you visit often" },
] as const;

export type FrequentPlaceKind = (typeof FREQUENT_PLACE_KINDS)[number]["id"];

export type FrequentPlace = {
  id: string;
  kind: FrequentPlaceKind;
  label: string;
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  formattedAddress?: string;
  lga?: string;
  state?: string;
  neighborhood?: string;
  createdAt: string;
};

export type HomeSummary = {
  formattedAddress?: string;
  lga?: string;
  state?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
};

export type SmartLocationSyncResult = {
  action?: string;
  primaryUpdated?: boolean;
  currentUpdated?: boolean;
  message?: string;
  showHomeHint?: boolean;
  primaryAddress?: string;
  homeRefinement?: {
    visitCount: number;
    visitsRequired: number;
    pendingAddress?: string;
    lat: number;
    lng: number;
  };
};

export function kindMeta(kind: string) {
  return FREQUENT_PLACE_KINDS.find((k) => k.id === kind) ?? FREQUENT_PLACE_KINDS[FREQUENT_PLACE_KINDS.length - 1];
}
