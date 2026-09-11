export type CompanyStatus = 'private' | 'public' | 'acquired' | 'defunct';

export interface Company {
  id: string;
  name: string;
  domain: string;
  sector: string;
  hqCountry: string;
  hqCity: string;
  founded: number;
  status: CompanyStatus;
  /** Peak valuation in billions USD */
  peakValuationB: number;
  brandColor: string;
}

export type RoomPhase = 'lobby' | 'playing' | 'finished';

export interface PlayerView {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  remaining: number;
  wantsRematch: boolean;
}

export interface FinishInfo {
  winnerId: string;
  loserId: string;
  reason: 'correct-guess' | 'wrong-guess';
  guessedCompanyId: string;
  secrets: Record<string, string>; // playerId -> companyId
}

/** Personalized snapshot sent to one player. */
export interface RoomView {
  code: string;
  phase: RoomPhase;
  me: string; // my player id
  players: PlayerView[];
  board: Company[]; // 24 shared cards, empty in lobby
  mySecretId: string | null;
  myFlipped: string[];
  activePlayerId: string | null;
  finish: FinishInfo | null;
  round: number;
  version: number;
}

export type Action =
  | { type: 'start' }
  | { type: 'end' }
  | { type: 'flip'; companyId: string; down: boolean }
  | { type: 'guess'; companyId: string }
  | { type: 'rematch' };

export interface JoinResponse {
  code: string;
  token: string;
  playerId: string;
}

export interface ApiError {
  error: string;
}

export const BOARD_SIZE = 25; // 5 x 5
export const MAX_NAME_LENGTH = 20;

export function valuationTier(b: number): string {
  if (b >= 100) return '$100B+';
  if (b >= 50) return '$50B+';
  if (b >= 10) return '$10B+';
  if (b >= 5) return '$5B+';
  return '$1B+';
}
