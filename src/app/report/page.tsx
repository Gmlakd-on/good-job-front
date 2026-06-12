"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EMOTIONS } from "@/types";

interface DiaryForReport {
  created_at: string;
  diary_emotions: { emotion_code: string }[];
}

type Period = "7d" | "30d" | "all";

type EmotionCount = [code: string, count: number];
type RefreshGroup = "bright" | "soft" | "tense" | "low" | "heated" | "default";
type RefreshCategory = "content" | "lightAction" | "sense" | "question" | "mission";

interface RefreshCardSuggestion {
  category: RefreshCategory;
  icon: string;
  title: string;
  body: string;
  action: string;
}

const EMOTION_EN_LABELS: Record<string, string> = {
  joy: "Joy",
  happiness: "Happiness",
  calm: "Calm",
  gratitude: "Gratitude",
  excitement: "Excitement",
  pride: "Pride",
  hope: "Hope",
  love: "Love",
  satisfaction: "Satisfaction",
  comfort: "Comfort",
  sadness: "Sadness",
  anxiety: "Anxiety",
  loneliness: "Loneliness",
  lethargy: "Low energy",
  exhaustion: "Exhaustion",
  anger: "Anger",
  irritation: "Irritation",
  frustration: "Frustration",
  regret: "Regret",
  fear: "Fear",
};

const REFRESH_GROUP_BY_EMOTION: Record<string, RefreshGroup> = {
  joy: "bright",
  happiness: "bright",
  gratitude: "bright",
  excitement: "bright",
  pride: "bright",
  hope: "bright",
  love: "bright",
  satisfaction: "bright",
  calm: "soft",
  comfort: "soft",
  sadness: "soft",
  loneliness: "soft",
  regret: "soft",
  anxiety: "tense",
  fear: "tense",
  frustration: "tense",
  lethargy: "low",
  exhaustion: "low",
  anger: "heated",
  irritation: "heated",
};

const REFRESH_CATEGORY_LABELS: Record<"ko" | "en", Record<RefreshCategory, string>> = {
  ko: {
    content: "콘텐츠 추천",
    lightAction: "가벼운 행동",
    sense: "감각 환기",
    question: "마음 질문",
    mission: "작은 미션",
  },
  en: {
    content: "Content pick",
    lightAction: "Light action",
    sense: "Sensory reset",
    question: "Heart question",
    mission: "Tiny mission",
  },
};

const REFRESH_CARD_POOL: Record<"ko" | "en", Record<RefreshGroup, RefreshCardSuggestion[]>> = {
  ko: {
    bright: [
      { category: "content", icon: "🎧", title: "기분을 더 오래 머물게 하는 노래 한 곡", body: "지금의 좋은 감정을 배경음악처럼 오래 곁에 둘 수 있게, 좋아하는 노래를 한 곡 골라 천천히 들어보세요.", action: "노래가 끝나기 전까지 오늘 좋았던 장면 하나를 떠올리기" },
      { category: "mission", icon: "📸", title: "좋아하는 장면 저장하기", body: "오늘의 밝은 감정이 흩어지기 전에 사진첩에서 마음에 드는 사진 하나를 골라 즐겨찾기에 넣어보세요.", action: "사진 하나 고르고, 왜 좋은지 한 문장 적기" },
    ],
    soft: [
      { category: "sense", icon: "🌤️", title: "하늘 색 관찰하기", body: "창밖이나 바깥에서 하늘을 30초만 바라보며 색과 구름 모양을 천천히 찾아보세요.", action: "하늘에서 보이는 색 3가지를 마음속으로 말하기" },
      { category: "question", icon: "🫖", title: "지금 마음이 원하는 속도", body: "편안함이 필요할 때는 빨리 괜찮아지려 하기보다, 내 마음이 원하는 속도를 묻는 게 좋아요.", action: "지금 내 마음이 가장 원하는 건 뭘까?" },
    ],
    tense: [
      { category: "lightAction", icon: "🚶", title: "15분 산책으로 불안의 속도 낮추기", body: "목적지를 정하지 않고 15분만 걸어보세요. 발바닥이 바닥에 닿는 느낌에 집중하면 생각의 속도가 조금 느려져요.", action: "나가기 어렵다면 방 안에서 30걸음 천천히 걷기" },
      { category: "sense", icon: "🪟", title: "창문 열고 공기 바꾸기", body: "불안이 커질 때는 주변 공기를 바꾸는 작은 행동만으로도 몸이 먼저 안정을 기억할 수 있어요.", action: "창문을 열고 깊게 3번 숨 쉬기" },
      { category: "question", icon: "💭", title: "1년 뒤에도 중요할 고민인지 묻기", body: "지금 큰 고민처럼 느껴지는 것을 조금 멀리서 바라보면, 내가 붙잡을 것과 놓아도 될 것이 나뉘어요.", action: "이 고민은 1년 뒤에도 여전히 중요할까?" },
    ],
    low: [
      { category: "content", icon: "📺", title: "짧고 가벼운 예능 한 편", body: "긴 몰입이 부담스럽다면 10~20분짜리 클립이나 편한 예능 한 편으로 마음의 압력을 낮춰보세요.", action: "웃음이 나왔던 장면 하나만 기억하기" },
      { category: "lightAction", icon: "💧", title: "물 한 잔과 어깨 내리기", body: "무기력하거나 지칠 때는 큰 계획보다 몸에 신호를 보내는 작은 루틴이 먼저예요.", action: "물 한 잔 마시고 어깨를 5초간 아래로 툭 내려놓기" },
    ],
    heated: [
      { category: "mission", icon: "🧹", title: "책상 한 칸만 정리하기", body: "짜증이나 분노가 남아 있을 때는 작게 통제할 수 있는 영역을 하나 만드는 게 도움이 돼요.", action: "책상이나 가방 속 한 칸만 비우기" },
      { category: "sense", icon: "🌬️", title: "차가운 물로 손 씻기", body: "감정의 온도가 높아졌다면 손끝 감각을 바꿔 몸이 먼저 식을 시간을 주세요.", action: "손을 씻으며 물의 온도에만 집중하기" },
    ],
    default: [
      { category: "question", icon: "🌱", title: "오늘 나를 부드럽게 바꾸는 질문", body: "거창한 답을 찾지 않아도 괜찮아요. 지금의 마음이 원하는 작은 방향만 확인해보세요.", action: "지금 내 마음이 가장 원하는 건 뭘까?" },
      { category: "lightAction", icon: "☁️", title: "구름 모양 맞춰보기", body: "눈앞의 모양에 이름을 붙이는 가벼운 놀이가 복잡한 생각을 잠시 멈추게 해줘요.", action: "구름이나 주변 물건에서 닮은 모양 하나 찾기" },
    ],
  },
  en: {
    bright: [
      { category: "content", icon: "🎧", title: "One song to keep the good mood near", body: "Pick a song that matches this lighter feeling and let it stay with you a little longer.", action: "Before the song ends, recall one good moment from today." },
      { category: "mission", icon: "📸", title: "Save a favorite scene", body: "Choose one photo that feels warm or fun, and let it become a small bookmark for today.", action: "Favorite one photo and write why it feels good." },
    ],
    soft: [
      { category: "sense", icon: "🌤️", title: "Look at the color of the sky", body: "Spend 30 seconds noticing the sky, the light, or the shape of the clouds.", action: "Name three colors you can see." },
      { category: "question", icon: "🫖", title: "Ask what pace your heart wants", body: "You do not have to feel better quickly. Start by asking what pace feels kind.", action: "What does my heart want most right now?" },
    ],
    tense: [
      { category: "lightAction", icon: "🚶", title: "A 15-minute walk to slow anxiety", body: "Walk without a destination and notice how your feet touch the ground.", action: "If going out is hard, take 30 slow steps indoors." },
      { category: "sense", icon: "🪟", title: "Open a window and reset the air", body: "When tension grows, changing the air around you can help your body remember calm.", action: "Open a window and take three deep breaths." },
      { category: "question", icon: "💭", title: "Ask if this will matter in a year", body: "A little distance can separate what needs care from what can be released.", action: "Will this still matter one year from now?" },
    ],
    low: [
      { category: "content", icon: "📺", title: "A short, easy show clip", body: "When focus feels heavy, try a short comedy, variety clip, or comforting video.", action: "Remember just one scene that made your face soften." },
      { category: "lightAction", icon: "💧", title: "A glass of water and dropped shoulders", body: "When energy is low, a tiny body cue can be easier than a big plan.", action: "Drink water and drop your shoulders for five seconds." },
    ],
    heated: [
      { category: "mission", icon: "🧹", title: "Clear one small corner", body: "After irritation or anger, making one small area feel manageable can help.", action: "Clear one corner of your desk or bag." },
      { category: "sense", icon: "🌬️", title: "Wash your hands with cool water", body: "When the emotional temperature is high, let your senses cool first.", action: "Focus only on the temperature of the water." },
    ],
    default: [
      { category: "question", icon: "🌱", title: "A gentle question for today", body: "You do not need a perfect answer. Just notice one small direction your heart wants.", action: "What does my heart want most right now?" },
      { category: "lightAction", icon: "☁️", title: "Find a cloud shape", body: "Giving a shape a playful name can pause the heavier stream of thoughts.", action: "Find one shape in the clouds or nearby objects." },
    ],
  },
};


const EXTRA_KO_REFRESH_MISSIONS: RefreshCardSuggestion[] = [
  {
    category: "sense",
    icon: "👂",
    title: "미션: 소리 수집하기",
    body: "주변에서 들리는 가장 편안한 소리 하나에 1분간 집중해 보세요. 빗소리, 타자 소리, 혹은 멀리서 들리는 일상적인 소리도 좋습니다.",
    action: "가장 편안했던 소리 하나를 마음속에 저장하기",
  },
  {
    category: "sense",
    icon: "🌿",
    title: "미션: 향기 한 스푼",
    body: "좋아하는 핸드크림을 바르거나 차를 한 잔 우려보세요. 그 향기를 깊게 들이마시고 내쉬는 데에만 온전히 집중해 보세요.",
    action: "향을 들이마시며 천천히 숨 3번 쉬기",
  },
  {
    category: "lightAction",
    icon: "🤲",
    title: "미션: 내 몸 깨우기",
    body: "손끝부터 발끝까지 천천히 힘을 주었다가 '툭' 하고 한꺼번에 풀어보세요. 몸에 쌓인 잔여 긴장감이 빠져나가는 것을 느껴보세요.",
    action: "힘을 주고 풀어내는 감각을 한 번 더 느끼기",
  },
  {
    category: "sense",
    icon: "🍃",
    title: "오늘의 감정 🍃 개운함",
    body: "지금의 개운한 느낌이 어디에서 시작됐는지 잠깐 살펴보세요. 몸이 가벼운 곳, 생각이 정리된 곳을 하나만 찾아도 충분해요.",
    action: "오늘의 개운함을 만든 작은 이유 한 가지 떠올리기",
  },
  {
    category: "mission",
    icon: "🗑️",
    title: "미션: 마음 쓰레기통 비우기",
    body: "지금 나를 불편하게 하는 생각을 종이에 적고, 종이를 구겨 버리며 마음에서 떠나보내 주세요.",
    action: "버리고 싶은 생각을 한 문장으로 적기",
  },
  {
    category: "mission",
    icon: "🪞",
    title: "미션: 나를 향한 다정함",
    body: "오늘 가장 애쓴 나를 위해, 거울 속의 나에게 \"오늘 하루도 정말 고생 많았어\"라고 나지막이 말해주세요.",
    action: "거울 속 나와 3초 눈 맞추기",
  },
  {
    category: "mission",
    icon: "👏",
    title: "미션: 칭찬 샤워",
    body: "오늘 내가 한 일 중 아주 사소하지만 잘한 행동 하나를 찾아 스스로에게 칭찬해 주세요. 예를 들면 물 한 잔 마시기처럼 작은 것도 좋아요.",
    action: "사소하지만 잘한 행동 하나 말해주기",
  },
  {
    category: "sense",
    icon: "👀",
    title: "미션: 시선의 확장",
    body: "평소와는 다른 각도로 지금 있는 공간을 30초만 천천히 둘러보세요. 고개를 살짝 들어보거나, 앉은 자리에서 몸을 돌려봐도 좋아요.",
    action: "처음 보인 물건 하나를 새롭게 바라보기",
  },
  {
    category: "sense",
    icon: "🎨",
    title: "미션: 예쁜 구석 찾기",
    body: "내 주변에서 색감이 가장 예쁜 사물 하나를 골라 10초 동안 가만히 관찰해 보세요. 책상, 방 안, 창밖 어디든 괜찮아요.",
    action: "가장 예뻤던 색 이름 붙이기",
  },
  {
    category: "mission",
    icon: "🙏",
    title: "미션: 고마움의 목록",
    body: "오늘 나를 미소 짓게 했던 아주 작은 일 3가지만 떠올려 보세요. 당연하게 지나쳤던 것들의 소중함을 느껴보세요.",
    action: "작은 고마움 3가지를 천천히 떠올리기",
  },
  {
    category: "content",
    icon: "🎵",
    title: "미션: BGM 바꾸기",
    body: "지금 내 기분을 반전시켜줄 수 있는 노래 한 곡을 골라보세요. 곡이 끝날 때까지 아무것도 하지 않고 오직 음악에만 빠져보세요.",
    action: "노래가 끝날 때까지 화면 잠시 내려놓기",
  },
  {
    category: "content",
    icon: "📖",
    title: "미션: 오늘의 문장 찾기",
    body: "책을 아무 페이지나 펼치거나, 눈에 보이는 문장 하나를 골라 오늘의 나에게 건네는 메시지로 읽어보세요.",
    action: "오늘 나에게 닿은 문장 한 줄 고르기",
  },
  {
    category: "sense",
    icon: "🖼️",
    title: "미션: 풍경 액자 만들기",
    body: "창가로 가서 창문을 액자라고 생각하고, 밖의 풍경을 한 폭의 그림처럼 1분 동안 감상해 보세요.",
    action: "풍경 속 가장 먼저 눈에 들어온 것 기억하기",
  },
  {
    category: "question",
    icon: "🌦️",
    title: "미션: 감정 날씨 기록",
    body: "오늘 내 마음의 상태를 날씨 단어로 표현해 보세요. 맑음, 흐림 뒤 갬, 소나기처럼 적고 왜 그런지도 한 문장 덧붙여보세요.",
    action: "오늘의 마음 날씨를 한 단어로 정하기",
  },
  {
    category: "question",
    icon: "💫",
    title: "미션: 낯선 질문 던지기",
    body: "'만약 오늘 내가 딱 한 가지 소원을 이룰 수 있다면?'이라는 질문을 스스로에게 던지고 짧게 대답해 보세요.",
    action: "오늘의 소원 하나를 아주 솔직하게 떠올리기",
  },
  {
    category: "mission",
    icon: "🌙",
    title: "미션: 내일의 기분 예약",
    body: "내일 아침 나에게 선물하고 싶은 기분 한 가지를 정하고, 그걸 느끼기 위해 할 수 있는 작은 행동을 계획해 보세요.",
    action: "내일 아침을 위한 작은 행동 하나 정하기",
  },
];

function pickRefreshCardSuggestion(code: string, language: "ko" | "en", seed: number): RefreshCardSuggestion {
  const group = REFRESH_GROUP_BY_EMOTION[code] ?? "default";
  const basePool = REFRESH_CARD_POOL[language][group] ?? REFRESH_CARD_POOL[language].default;
  const fallbackPool = group === "default" ? [] : REFRESH_CARD_POOL[language].default;
  const extraPool = language === "ko" ? EXTRA_KO_REFRESH_MISSIONS : [];
  const pool = [...basePool, ...fallbackPool, ...extraPool];

  return pool[Math.abs(seed) % pool.length] ?? REFRESH_CARD_POOL[language].default[0];
}

function computeStreak(diaries: DiaryForReport[], now: Date): number {
  const days = new Set(diaries.map((diary) => new Date(diary.created_at).toDateString()));
  let streak = 0;
  const cursor = new Date(now);

  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getEmotionMeta(code: string, language: "ko" | "en") {
  const emotion = EMOTIONS.find((item) => item.code === code);
  return {
    emoji: emotion?.emoji ?? "•",
    label: language === "en" ? EMOTION_EN_LABELS[code] ?? emotion?.label ?? code : emotion?.label ?? code,
  };
}


export default function ReportPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [diaries, setDiaries] = useState<DiaryForReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [refreshCard, setRefreshCard] = useState<RefreshCardSuggestion | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const copy = language === "en"
    ? {
      back: "← Home",
      title: "Emotion Report ✨",
      refreshButton: "Create reset card",
      refreshAnother: "Another card",
      refreshEyebrow: "Reset card",
      refreshFor: "For today's feeling",
      period: { "7d": "7 days", "30d": "30 days", all: "All" },
      periodSentence: { "7d": "this week", "30d": "the last 30 days", all: "all records" },
      diaryCount: "Written diaries",
      streak: "Streak",
      topEmotion: "Most common emotion",
      recovered: "Recovered emotion",
      recoveredValue: "Writing streak",
      mostThisWeek: "Most common this week",
      repeated: "Often repeated",
      recoveredTitle: "Recovered feeling",
      donut: "Emotion donut",
      distribution: "Emotion distribution",
      insight: "Emotion insight",
      aiTitle: "AI summary of your emotional flow",
      noData: "No records yet",
      noDataDesc: "Once you write a diary, your emotional flow will appear here.",
      pctTail: "of your entries carried this feeling.",
      repeatedDesc: "Repeated feelings can be a gentle signal to care for yourself.",
      notEnough: "A little more writing will reveal the pattern.",
      recoveryDesc: "Your steady records show a small rhythm of recovery.",
      insightBody: "Recently, anxiety and low energy appear often. Take a quiet break and remember the small things you already handled well.",
      cheer: "Encourage today’s me",
    }
    : {
      back: "← 홈",
      title: "감정 리포트 ✨",
      refreshButton: "환기 카드 생성",
      refreshAnother: "다른 카드 보기",
      refreshEyebrow: "환기 카드",
      refreshFor: "오늘의 감정",
      period: { "7d": "7일", "30d": "30일", all: "전체" },
      periodSentence: { "7d": "이번 주", "30d": "최근 30일", all: "전체 기록" },
      diaryCount: "기록한 일기",
      streak: "연속 기록",
      topEmotion: "가장 많았던 감정",
      recovered: "회복된 감정",
      recoveredValue: "기록 흐름",
      mostThisWeek: "이번 주 가장 많았던 감정",
      repeated: "자주 반복된 감정",
      recoveredTitle: "회복된 감정",
      donut: "감정 도넛",
      distribution: "감정 분포",
      insight: "감정 인사이트",
      aiTitle: "AI가 요약한 감정 흐름",
      noData: "아직 기록이 없어요",
      noDataDesc: "일기를 쓰면 이곳에서 감정 흐름을 조용히 돌아볼 수 있어요.",
      pctTail: "정도가 이 감정으로 남아 있어요.",
      repeatedDesc: "반복되는 감정은 나를 돌보라는 작은 신호일 수 있어요.",
      notEnough: "아직 반복 패턴을 말하기엔 기록이 조금 더 필요해요.",
      recoveryDesc: "기록을 이어가며 마음을 회복하는 흐름이 보여요.",
      insightBody: "최근 불안과 무기력이 자주 나타나고 있어요. 충분히 쉬고, 작은 성취를 기억하며 나를 다독이는 시간을 가져보세요.",
      cheer: "오늘의 당신을 응원해요",
    };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const response = await fetch("/api/diaries", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setDiaries(data.diaries || []);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    if (period === "all") return diaries;

    const days = period === "7d" ? 7 : 30;
    const threshold = new Date(now.getTime() - days * 86400000);
    return diaries.filter((diary) => new Date(diary.created_at) >= threshold);
  }, [diaries, now, period]);

  const { sortedEmotions, totalEmotions } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    filtered.forEach((diary) => {
      diary.diary_emotions?.forEach((emotion) => {
        counts[emotion.emotion_code] = (counts[emotion.emotion_code] || 0) + 1;
        total += 1;
      });
    });

    return {
      sortedEmotions: Object.entries(counts).sort(([, a], [, b]) => b - a) as EmotionCount[],
      totalEmotions: total,
    };
  }, [filtered]);

  const streak = useMemo(() => computeStreak(diaries, now), [diaries, now]);
  const topEmotion = sortedEmotions[0];
  const topMeta = topEmotion ? getEmotionMeta(topEmotion[0], language) : null;
  const topEmotionPct = topEmotion && totalEmotions > 0 ? Math.round((topEmotion[1] / totalEmotions) * 100) : 0;
  const repeatedEmotion = sortedEmotions.find(([, count]) => count >= 2);
  const repeatedMeta = repeatedEmotion ? getEmotionMeta(repeatedEmotion[0], language) : null;
  const latestEmotionCode = useMemo(() => {
    const latestDiary = [...filtered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((diary) => diary.diary_emotions?.length);

    return latestDiary?.diary_emotions?.[0]?.emotion_code ?? null;
  }, [filtered]);
  const refreshEmotionCode = latestEmotionCode ?? topEmotion?.[0] ?? "calm";
  const refreshEmotionMeta = getEmotionMeta(refreshEmotionCode, language);
  const refreshCategoryLabel = refreshCard ? REFRESH_CATEGORY_LABELS[language][refreshCard.category] : "";
  const createRefreshCard = () => {
    const nextSeed = refreshSeed + 1;
    setRefreshSeed(nextSeed);
    setRefreshCard(pickRefreshCardSuggestion(refreshEmotionCode, language, nextSeed + filtered.length + totalEmotions));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("report.loading")}</p>
      </div>
    );
  }

  return (
    <main className="report-page report-page--reference">
      <header className="report-reference-header">
        <button type="button" onClick={() => router.push("/")} className="report-reference-header__back">
          {copy.back}
        </button>
        <div className="report-reference-header__center">
          <h1>{copy.title}</h1>
          <div className="report-period" role="tablist" aria-label="감정 리포트 기간 선택">
            {(["7d", "30d", "all"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={period === key}
                onClick={() => setPeriod(key)}
                className={`report-period__btn ${period === key ? "report-period__btn--active" : ""}`}
              >
                {copy.period[key]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="report-reference-header__refresh" onClick={createRefreshCard}>
          <span aria-hidden="true">🌬️</span>
          {copy.refreshButton}
        </button>
      </header>

      <section className="report-stat-grid" aria-label="감정 요약">
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--green" aria-hidden="true">📖</span>
          <span>{copy.diaryCount}</span>
          <strong>{filtered.length}{language === "ko" ? "개" : ""}</strong>
        </article>
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--coral" aria-hidden="true">🗓️</span>
          <span>{copy.streak}</span>
          <strong>{language === "ko" ? `${streak}일` : `${streak} days`}</strong>
        </article>
      </section>

      {refreshCard && (
        <section className="report-refresh-card report-card-panel" aria-live="polite">
          <div className="report-refresh-card__header">
            <span className="report-refresh-card__icon" aria-hidden="true">{refreshCard.icon}</span>
            <div>
              <p>{copy.refreshEyebrow} · {refreshCategoryLabel}</p>
              <h2>{refreshCard.title}</h2>
            </div>
          </div>
          <p className="report-refresh-card__body">{refreshCard.body}</p>
          <div className="report-refresh-card__footer">
            <span>{copy.refreshFor} {refreshEmotionMeta.emoji} {refreshEmotionMeta.label}</span>
            <button type="button" onClick={createRefreshCard}>{copy.refreshAnother}</button>
          </div>
          <p className="report-refresh-card__action">✦ {refreshCard.action}</p>
        </section>
      )}

      {filtered.length === 0 ? (
        <section className="report-empty-card">
          <span aria-hidden="true">🍃</span>
          <h2>{copy.noData}</h2>
          <p>{copy.noDataDesc}</p>
        </section>
      ) : (
        <>
          <section className="report-reading-cards report-reading-cards--reference">
            <article className="report-reading-card report-reading-card--repeat">
              <span>{copy.repeated}</span>
              <strong>{repeatedMeta ? `${repeatedMeta.emoji} ${repeatedMeta.label}` : copy.noData}</strong>
              <p>{repeatedMeta ? copy.repeatedDesc : copy.notEnough}</p>
            </article>
            <article className="report-reading-card report-reading-card--wave">
              <span>{copy.recoveredTitle}</span>
              <strong>{streak > 0 ? (language === "ko" ? `연속 ${streak}일 기록` : `${streak} day streak`) : copy.recoveredValue}</strong>
              <p>{copy.recoveryDesc}</p>
            </article>
          </section>

          <section className="report-bottom-grid">
            <article className="report-donut-card report-card-panel">
              <p className="report-panel-title">{copy.donut}</p>
              <div
                className="report-donut"
                style={{
                  background: `conic-gradient(#ef6f4d 0 ${topEmotionPct}%, rgba(236, 224, 205, 0.78) ${topEmotionPct}% 100%)`,
                }}
              >
                <div>
                  <strong>{topEmotionPct}%</strong>
                  <span>{topMeta?.label ?? "-"}</span>
                </div>
              </div>
              <p className="report-donut-card__caption">{copy.periodSentence[period]} {language === "ko" ? "감정 중 가장 큰 비율이에요." : "emotion share."}</p>
            </article>

            <article className="report-distribution-card report-card-panel">
              <p className="report-panel-title">{copy.distribution}</p>
              <div className="report-distribution-list">
                {sortedEmotions.map(([code, count], index) => {
                  const meta = getEmotionMeta(code, language);
                  const pct = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;

                  return (
                    <div key={code} className="report-emotion-row">
                      <span className="report-emotion-row__label">{meta.emoji} {meta.label}</span>
                      <span className="report-emotion-row__bar"><span style={{ width: `${pct}%` }} /></span>
                      <span className="report-emotion-row__count">{count}{language === "ko" ? "회" : "x"} ({pct}%)</span>
                      {index === 0 && <span className="sr-only">top emotion</span>}
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className="report-insight-panel report-card-panel">
              <p className="report-panel-title">💡 {copy.insight}</p>
              <p>{topMeta ? (language === "ko" ? `${copy.periodSentence[period]} 동안 ${topMeta.label} 감정이 가장 자주 보였어요.` : `During ${copy.periodSentence[period]}, ${topMeta.label} appeared most often.`) : copy.noDataDesc}</p>
              <hr />
              <p>{copy.insightBody}</p>
              <button type="button">♥ {copy.cheer}</button>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}
