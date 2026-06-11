// types/index.ts — 참 잘했어요 v1.0.0 공통 타입

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DiaryStatus = "DRAFT" | "SUBMITTED" | "REPLIED" | "REPORTED" | "DELETED";

export type ModerationStatus = "PENDING" | "PASSED" | "BLOCKED";

// ─── Visual Recovery ─────────────────

export interface RecoveryProgress {
  totalLogs: number;
  colorLevel: number; // 0~1 사이 회복도
  lastUpdated: string;
}

export interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: number;
  eyeType: number;
  irisType: number;
  topType: number;
  bottomType: number;
  accType: number;
}

// ─── 아바타 Mood 시스템 ─────────────────

export type AvatarMood =
  | "idle"       // 기본 대기
  | "hello"      // 인사 (온보딩, 첫 진입)
  | "listening"  // 듣는 중 (글쓰기 중)
  | "thinking"   // 생각 중 (AI 답글 생성 중)
  | "reply"      // 답장 전달 (답글 도착)
  | "comfort"    // 위로 (일기 다시 읽을 때)
  | "celebrate"  // 축하 (일기장 완결, 연속 기록)
  | "error";     // 오류 (AI 실패 등)

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps {
  mood: AvatarMood;
  size: AvatarSize;
  message?: string;
  progress?: number; // 회복도 0~1
}

// ─── 감정 선택 ─────────────────

export interface EmotionOption {
  code: string;
  label: string;
  emoji: string;
}

export const EMOTIONS: EmotionOption[] = [
  { code: "joy",        label: "기쁨",   emoji: "😊" },
  { code: "calm",       label: "평온",   emoji: "🍃" },
  { code: "anxiety",    label: "불안",   emoji: "😰" },
  { code: "sadness",    label: "슬픔",   emoji: "🥲" },
  { code: "loneliness", label: "외로움", emoji: "🌙" },
  { code: "lethargy",   label: "무기력", emoji: "😶" },
  { code: "anger",      label: "분노",   emoji: "😤" },
  { code: "regret",     label: "후회",   emoji: "💭" },
  { code: "gratitude",  label: "감사",   emoji: "🙏" },
  { code: "exhaustion", label: "지침",   emoji: "😮‍💨" },
];

export interface Diary {
  id: string;
  user_id: string;
  content: string;
  status: DiaryStatus;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface DiaryEmotion {
  id: string;
  diary_id: string;
  emotion_code: string;
  emotion_label: string;
}

export interface Reply {
  id: string;
  diary_id: string;
  reply_type: "AI";
  persona: string;
  content: string;
  moderation_status: ModerationStatus;
  risk_level: RiskLevel;
  created_at: string;
}

export interface ReplyFeedback {
  id: string;
  reply_id: string;
  user_id: string;
  rating: number | null;
  is_helpful: boolean | null;
  feedback_text: string | null;
  created_at: string;
}

export interface AiLog {
  id: string;
  diary_id: string;
  model_name: string;
  prompt_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  risk_level: RiskLevel;
  moderation_status: ModerationStatus;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

export interface SafetyCheckResult {
  level: RiskLevel;
  shouldGenerateAiReply: boolean;
  message: string | null;
}

// AI 답글 생성 결과
export interface AiReplyAnalysis {
  detected_emotion: string;
  risk_level: RiskLevel;
  emotion_weight?: "low" | "medium" | "high" | "critical" | string;
  primary_care_mode?: string;
  priority_reason?: string;
  advice_allowed?: boolean;
  safety_check_needed?: boolean;
  warm_confrontation_needed?: boolean;
  life_care_needed?: boolean;
  growth_support_needed?: boolean;
  response_length?: string;
  persona_applied?: string;
}

export interface AiReplyDoodle {
  type: DoodleType;
  text?: string;          // handwriting일 때 ("잘했어 ♡" 등)
  intensity: DoodleIntensity;
}

export interface AiReplyResult {
  analysis: AiReplyAnalysis;
  reply: {
    persona: string;
    content: string;
    doodle?: AiReplyDoodle;
  };
}

// 일기 작성 요청 body
export interface CreateDiaryRequest {
  content: string;
  emotions: { code: string; label: string }[];
  persona?: string; // v1.0.0: 선택한 페르소나
}

// 일기 상세 (답글 포함)
export interface DiaryWithReply extends Diary {
  diary_emotions: DiaryEmotion[];
  replies: Reply[];
}

// ─── 페르소나 ─────────────────

export type DoodleType =
  | "stamp"        // 순자: 참 잘했어요 도장
  | "handwriting"  // 순자: 손글씨 낙서
  | "paw"          // 나비: 발도장
  | "scratch"      // 나비: 스크래치 자국
  | "fish"         // 나비: 물고기 낙서
  | "check"        // 선생님: 빨간펜 체크
  | "underline"    // 선생님: 밑줄
  | "dot"          // 할아버지: 점 하나
  | "curl"         // 샤론: 헤어 컬
  | "mirror";      // 샤론: 손거울

export type DoodleIntensity = "light" | "normal";

export interface PersonaTheme {
  /** 답글 카드 배경 */
  replyBg: string;
  /** 답글 카드 배경 그라데이션 */
  replyBgGradient: string;
  /** 답글 텍스트 색상 */
  replyInk: string;
  /** 악센트 컬러 (상단 바, 강조) */
  replyAccent: string;
  /** 답글 카드 테두리 */
  replyBorder: string;
  /** 낙서/도장 색상 */
  doodleColor: string;
  /** 기본 낙서 타입 목록 */
  doodleTypes: DoodleType[];
  /** 질감 키워드 */
  texture: string;
}

export interface PersonaOption {
  code: string;
  name: string;
  emoji: string;
  description: string;
  tone: string;
  tier: "free" | "pro";
  theme: PersonaTheme;
}

export const PERSONAS: PersonaOption[] = [
  {
    code: "operator_voice",
    name: "참이",
    emoji: "🫂",
    description: "이 서비스를 처음 만든 사람. 고통에 의미를 강요하지 않고, 조심스럽게 곁에 남아요.",
    tone: "부드러운 해요체, 조심스러운 바람, 열린 문장",
    tier: "free",
    theme: {
      replyBg: "#F5F0EB",
      replyBgGradient: "linear-gradient(145deg, #FAF7F3, #EDE5DB)",
      replyInk: "#4A443D",
      replyAccent: "#A89585",
      replyBorder: "rgba(168, 149, 133, 0.2)",
      doodleColor: "#A89585",
      doodleTypes: ["stamp", "handwriting"],
      texture: "kraft-grain",
    },
  },
  {
    code: "soonja_grandma",
    name: "순자 할머니",
    emoji: "👵",
    description: "교문 앞 분식집처럼 따뜻하게 받아주는 사람",
    tone: "구수함, 다정함, 품어주는 말투",
    tier: "free",
    theme: {
      replyBg: "#FFF5E8",
      replyBgGradient: "linear-gradient(145deg, #FFFCF5, #FFF0DD)",
      replyInk: "#5C4A35",
      replyAccent: "#C4A882",
      replyBorder: "rgba(196, 168, 130, 0.25)",
      doodleColor: "#C4A882",
      doodleTypes: ["stamp", "handwriting"],
      texture: "kraft-grain",
    },
  },
  {
    code: "nabi_cat",
    name: "교실 뒤 고양이 나비",
    emoji: "🐱",
    description: "장난스럽지만 일기는 끝까지 읽는 고양이",
    tone: "귀여움, 가벼운 유머, 은근한 어른스러움",
    tier: "free",
    theme: {
      replyBg: "#F0F7F2",
      replyBgGradient: "linear-gradient(145deg, #F5FCF7, #E5F2E9)",
      replyInk: "#3A5C4A",
      replyAccent: "#8BB89A",
      replyBorder: "rgba(139, 184, 154, 0.25)",
      doodleColor: "#8BB89A",
      doodleTypes: ["paw", "scratch", "fish"],
      texture: "linen-dot",
    },
  },
  {
    code: "warm_teacher",
    name: "옛 담임 선생님",
    emoji: "🧑‍🏫",
    description: "칠판 앞에서 짧고 차분하게 확인해주는 사람",
    tone: "정중한 존댓말, 관찰자적 시점, 짧고 담백한 문장",
    tier: "pro",
    theme: {
      replyBg: "#F5F5F0",
      replyBgGradient: "linear-gradient(145deg, #FAFAF7, #EEEEE8)",
      replyInk: "#4A5568",
      replyAccent: "#B85450",
      replyBorder: "rgba(184, 84, 80, 0.15)",
      doodleColor: "#B85450",
      doodleTypes: ["check", "underline"],
      texture: "notebook-rule",
    },
  },
  {
    code: "geonneomal_grandpa",
    name: "건너말 할아버지",
    emoji: "👴",
    description: "말은 적지만 운동장 끝 벤치처럼 곁에 있는 사람",
    tone: "투박하지만 깊은 다정함, 기다려주는 말투",
    tier: "pro",
    theme: {
      replyBg: "#F7F3ED",
      replyBgGradient: "linear-gradient(145deg, #FDFBF7, #EDE5D8)",
      replyInk: "#5C4E3C",
      replyAccent: "#B5A58A",
      replyBorder: "rgba(181, 165, 138, 0.2)",
      doodleColor: "#B5A58A",
      doodleTypes: ["dot"],
      texture: "wood-grain",
    },
  },
  {
    code: "sharon_director",
    name: "미용실 원장님 샤론",
    emoji: "💇‍♀️",
    description: "하교길 동네 미용실처럼 생활감 있게 들어주는 사람",
    tone: "현실적, 생활감, 따뜻한 수다",
    tier: "pro",
    theme: {
      replyBg: "#FFF5F8",
      replyBgGradient: "linear-gradient(145deg, #FFFBFC, #F5DDE5)",
      replyInk: "#6A4A55",
      replyAccent: "#D4A0B0",
      replyBorder: "rgba(212, 160, 176, 0.2)",
      doodleColor: "#D4A0B0",
      doodleTypes: ["curl", "mirror"],
      texture: "salon-soft",
    },
  },
];

// ─── 리마인더 & 알림 ─────────────────

export interface Reminder {
  id: string;
  user_id: string;
  diary_id: string | null;
  scheduled_at: string;
  message: string | null;
  status: "PENDING" | "SENT" | "CANCELLED";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string | null;
  channel: "web_inbox" | "push" | "widget";
  title: string;
  body: string;
  link: string | null;
  reminder_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AiInsight {
  model?: string;
  promptVersion?: string;
  moderationStatus?: ModerationStatus | string;
  riskLevel?: RiskLevel | string;
  emotionWeight?: string;
  primaryCareMode?: string;
  provider?: "external" | "fallback" | string;
}
