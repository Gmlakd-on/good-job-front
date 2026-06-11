// types/exchange.ts — 교환일기 시스템 타입

// ─── 교환일기 프로필 ─────────────────

export interface ExchangeProfile {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  random_matching_enabled: boolean;
  penalty_score: number;
  random_cooldown_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExchangeProfileSearchResult {
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

// ─── 랜덤 매칭 제출 ─────────────────

export type SubmissionStatus = "active" | "matched" | "withdrawn" | "expired";

export interface ExchangeRandomSubmission {
  id: string;
  user_id: string;
  diary_id: string;
  preview_text: string;
  emotions: { code: string; label: string }[] | null;
  status: SubmissionStatus;
  expires_at: string;
  created_at: string;
}

// ─── 매칭 제안 ─────────────────

export type MatchDecision = "pending" | "accepted" | "declined";
export type MatchOfferStatus = "pending" | "matched" | "declined" | "expired";

export interface ExchangeMatchOffer {
  id: string;
  user_a_id: string;
  user_b_id: string;
  submission_a_id: string;
  submission_b_id: string;
  user_a_decision: MatchDecision;
  user_b_decision: MatchDecision;
  status: MatchOfferStatus;
  expires_at: string;
  created_at: string;
}

/** 상대방 일기 미리보기 포함 */
export interface MatchOfferWithPreview extends ExchangeMatchOffer {
  partner_preview_text: string;
  partner_emotions: { code: string; label: string }[] | null;
  partner_display_name: string;
  my_decision: MatchDecision;
}

// ─── 교환일기 세션 ─────────────────

export type ExchangeSessionType = "random" | "friend";
export type ExchangeSessionStatus =
  | "active_7day"
  | "extension_pending"
  | "extended"
  | "ended"
  | "terminated";

export interface ExchangeSession {
  id: string;
  type: ExchangeSessionType;
  user_a_id: string;
  user_b_id: string;
  status: ExchangeSessionStatus;
  started_at: string;
  initial_ends_at: string;
  ended_at: string | null;
  terminated_by: string | null;
  termination_reason: string | null;
  penalty_applied: boolean;
  created_at: string;
}

export interface ExchangeSessionWithPartner extends ExchangeSession {
  partner_display_name: string;
  partner_handle: string;
  partner_avatar_url: string | null;
}

// ─── 교환일기 엔트리 ─────────────────

export interface ExchangeEntry {
  id: string;
  session_id: string;
  author_id: string;
  day_index: number;
  content: string;
  mood: string | null;
  visible_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 연장 투표 ─────────────────

export type ExtensionVote = "continue" | "stop";

export interface ExchangeExtensionVote {
  id: string;
  session_id: string;
  user_id: string;
  vote: ExtensionVote;
  created_at: string;
}

// ─── 지인 초대 ─────────────────

export type InviteStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";

export interface ExchangeFriendInvite {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: InviteStatus;
  message: string | null;
  expires_at: string;
  created_at: string;
}

export interface FriendInviteWithProfile extends ExchangeFriendInvite {
  from_display_name: string;
  from_handle: string;
  from_avatar_url: string | null;
  to_display_name: string;
  to_handle: string;
  to_avatar_url: string | null;
}

// ─── 차단 ─────────────────

export interface ExchangeBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// ─── 신고 ─────────────────

export interface ExchangeReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  session_id: string | null;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
}

// ─── 종료 사유 ─────────────────

export const TERMINATION_REASONS = [
  { code: "inappropriate", label: "상대가 불쾌한 말을 했어요" },
  { code: "personal_info", label: "개인정보나 연락처를 요구했어요" },
  { code: "inactive", label: "상대가 거의 작성하지 않아요" },
  { code: "mismatch", label: "대화/교환이 잘 맞지 않아요" },
  { code: "personal", label: "개인 사정이 생겼어요" },
  { code: "other", label: "기타" },
] as const;

export type TerminationReasonCode = (typeof TERMINATION_REASONS)[number]["code"];

/** 패널티가 면제되는 안전 사유 */
export const SAFE_TERMINATION_REASONS: readonly string[] = [
  "inappropriate",
  "personal_info",
  "inactive",
];

// ─── API 요청/응답 ─────────────────

export interface SetupExchangeProfileRequest {
  handle: string;
  display_name: string;
  random_matching_enabled?: boolean;
}

export interface SubmitRandomDiaryRequest {
  diary_id: string;
  preview_text: string;
  emotions?: { code: string; label: string }[];
}

export interface CreateExchangeEntryRequest {
  content: string;
  mood?: string;
}

export interface TerminateSessionRequest {
  reason: TerminationReasonCode;
  detail?: string;
}

export interface SendFriendInviteRequest {
  to_handle: string;
  message?: string;
}

export interface ExchangeReportRequest {
  reported_user_id: string;
  session_id?: string;
  reason: string;
  detail?: string;
}

// ─── 핸들 유효성 검사 ─────────────────

export const HANDLE_WORDS = [
  "lucky",
  "love",
  "hope",
  "smile",
  "good",
  "food",
  "mood",
  "moon",
  "star",
] as const;
export const HANDLE_REGEX = /^(lucky|love|hope|smile|good|food|mood|moon|star)_([1-9]|[1-9][0-9])$/;
export const MIN_HANDLE_LENGTH = 6;
export const MAX_HANDLE_LENGTH = 8;
export const MAX_EXCHANGE_DISPLAY_NAME_LENGTH = 20;
export const MAX_PREVIEW_TEXT_LENGTH = 500;
export const MAX_EXCHANGE_ENTRY_LENGTH = 3000;
export const MAX_INVITE_MESSAGE_LENGTH = 200;
export const MAX_EXCHANGE_REPORT_DETAIL_LENGTH = 1000;

export function isValidHandle(handle: string): boolean {
  return HANDLE_REGEX.test(handle.trim().toLowerCase());
}
