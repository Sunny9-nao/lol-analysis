export interface Champion {
  name: string;
  title: string;
  imageUrl: string;
}

export interface MatchNote {
  id: string;
  content: string;
  matchupTag?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarlyItem {
  timestamp: string;
  itemId: number;
}

export interface GoldTimelinePoint {
  minute: number;
  goldDiff?: number | null;
  myGold: number;
  oppGold?: number | null;
}

export interface TimelineKillEvent {
  minute: number;
  timestamp: string;
  category: "solo_kill_opp" | "death_to_opp" | "kill_other" | "death_other" | "assist" | string;
  label: string;
  killer: string;
  victim: string;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  championName: string;
  opponentChampionName?: string | null;
  position?: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
  cs: number;
  goldEarned: number;
  totalDamageDealt: number;
  items?: number[] | null;
  spells?: number[] | null;
  formattedDuration: string;
  gameMode: string;
  queueId?: number | null;
  queueName?: string | null;
  gameCreation?: string | null;
  matchNote?: MatchNote | null;
  champion?: Champion | null;
  opponentChampion?: Champion | null;
  goldDiffAt14?: number | null;
  csDiffAt14?: number | null;
  laneOutcome?: "win" | "even" | "loss" | string | null;
  earlyItems?: EarlyItem[] | null;
  goldTimeline?: GoldTimelinePoint[] | null;
  killEvents?: TimelineKillEvent[] | null;
  itemTimeline?: EarlyItem[] | null;
}

export interface PlayedChampion {
  championName: string;
  matchCount: number;
  winCount: number;
  winRate: number;
  mostPlayedPosition?: string | null;
  champion?: Champion | null;
}

export interface MatchupSummary {
  opponentChampionName: string;
  championName?: string | null;
  matchCount: number;
  winCount: number;
  winRate: number;
  averageKda: number;
  averageCsPerMinute: number;
  hardCount: number;
  evenCount: number;
  easyCount: number;
  latestNote?: MatchNote | null;
  opponentChampion?: Champion | null;
  champion?: Champion | null;
}

export interface MatchupDetail {
  championName: string;
  opponentChampionName: string;
  matchCount: number;
  winCount: number;
  winRate: number;
  averageKda: number;
  averageCsPerMinute: number;
  hardCount: number;
  evenCount: number;
  easyCount: number;
  champion?: Champion | null;
  opponentChampion?: Champion | null;
  participants: MatchParticipant[];
}

export interface Summoner {
  id: string;
  puuid?: string | null;
  gameName: string;
  tagLine: string;
  riotId: string;
  summonerLevel?: number | null;
  profileIconId?: number | null;
  profileIconUrl?: string | null;
  isPrivate: boolean;
  lastSyncedAt?: string | null;
  recentWinRate?: number | null;
  syncStatus: "idle" | "syncing" | "failed";
  syncError?: string | null;
  matchParticipants: MatchParticipant[];
  playedChampions: PlayedChampion[];
  matchupSummaries: MatchupSummary[];
  matchupDetail?: MatchupDetail | null;
  counterRecommendations?: MatchupSummary[];
}

export interface User {
  id: string;
  email: string;
  authToken?: string | null;
  summoner?: Summoner | null;
  createdAt?: string;
  updatedAt?: string;
}
