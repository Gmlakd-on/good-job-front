export type SupportedQuoteLanguage = "ko" | "en";

export interface DefaultQuote {
  id: string;
  quote_text_ko: string;
  quote_text_en: string;
  author_ko: string;
  author_en: string;
}

export interface PublicQuote {
  id: string;
  quote_text: string;
  author: string;
  quote_text_ko: string;
  quote_text_en: string;
  author_ko: string;
  author_en: string;
  language: SupportedQuoteLanguage;
}

export const DEFAULT_QUOTES: DefaultQuote[] = [
  {
    id: "lincoln-responsibility",
    quote_text_ko: "오늘의 책임을 피함으로써 내일의 책임을 피할 수는 없다.",
    quote_text_en: "You cannot escape the responsibility of tomorrow by evading it today.",
    author_ko: "에이브러햄 링컨",
    author_en: "Abraham Lincoln",
  },
  {
    id: "buffon-patience",
    quote_text_ko: "천재는 거대한 인내일 뿐이다.",
    quote_text_en: "Genius is nothing but a great capacity for patience.",
    author_ko: "뷔퐁",
    author_en: "Buffon",
  },
  {
    id: "spinoza-self-knowledge",
    quote_text_ko: "최대의 교만이나 최대의 낙담은 스스로에 대한 최대의 무지다.",
    quote_text_en: "The greatest pride, or the greatest despondency, is the greatest ignorance of one's self.",
    author_ko: "바뤼흐 스피노자",
    author_en: "Baruch Spinoza",
  },
  {
    id: "bill-nye-laugh-world",
    quote_text_ko: "세상에 대해 더 많이 알면 알수록 세상을 조소할 일이 많아진다.",
    quote_text_en: "The more you find out about the world, the more opportunities there are to laugh at it.",
    author_ko: "빌 나이",
    author_en: "Bill Nye",
  },
  {
    id: "powell-optimism",
    quote_text_ko: "지속적인 긍정적 사고는 능력을 배가시킨다.",
    quote_text_en: "Perpetual optimism is a force multiplier.",
    author_ko: "콜린 파월",
    author_en: "Colin Powell",
  },
  {
    id: "twain-laughter",
    quote_text_ko: "인류에게는 정말로 효과적인 무기가 하나있다. 바로 웃음이다.",
    quote_text_en: "The human race has one really effective weapon, and that is laughter.",
    author_ko: "마크 트웨인",
    author_en: "Mark Twain",
  },
  {
    id: "einstein-respect",
    quote_text_ko: "모든 인간은 개인으로서 존중받아야 하며, 그 누구도 우상으로 숭배해서는 안된다.",
    quote_text_en: "Let every man be respected as an individual and no man idolized.",
    author_ko: "알버트 아인슈타인",
    author_en: "Albert Einstein",
  },
  {
    id: "franklin-time",
    quote_text_ko: "그대는 인생을 사랑하는가? 그렇다면 시간을 낭비하지 말라, 시간이야말로 인생을 형성하는 재료이기 때문이다.",
    quote_text_en: "Dost thou love life? Then do not squander time, for that is the stuff life is made of.",
    author_ko: "벤자민 프랭클린",
    author_en: "Benjamin Franklin",
  },
  {
    id: "morley-life-language",
    quote_text_ko: "인생은 외국어이다. 모든 사람이 그것을 잘못 발음한다.",
    quote_text_en: "Life is a foreign language; all men mispronounce it.",
    author_ko: "크리스토퍼 몰리",
    author_en: "Christopher Morley",
  },
  {
    id: "seneca-courage-live",
    quote_text_ko: "때로는 살아있는 것조차도 용기가 될 때가 있다.",
    quote_text_en: "Sometimes even to live is an act of courage.",
    author_ko: "세네카",
    author_en: "Seneca",
  },
  {
    id: "ebner-eschenbach-learn-understand",
    quote_text_ko: "우리는 젊을 때에 배우고 나이가 들어서 이해한다.",
    quote_text_en: "In youth we learn; in age we understand.",
    author_ko: "마리 폰 에브너 에셴바흐",
    author_en: "Marie Ebner von Eschenbach",
  },
  {
    id: "jean-paul-meeting-farewell",
    quote_text_ko: "인간의 감정은 누군가를 만날 때와 헤어질 때 가장 순수하며 가장 빛난다.",
    quote_text_en: "Man's feelings are always purest and most glowing in the hour of meeting and of farewell.",
    author_ko: "장 폴 리히터",
    author_en: "Jean Paul Richter",
  },
  {
    id: "shakespeare-bud-of-love",
    quote_text_ko: "이 사랑의 꽃봉오리는 여름날 바람에 마냥 부풀었다가, 다음 만날 때엔 예쁘게 꽃필 거예요.",
    quote_text_en: "This bud of love, by summer's ripening breath, May prove a beauteous flower when next we meet.",
    author_ko: "윌리엄 셰익스피어",
    author_en: "William Shakespeare",
  },
  {
    id: "jean-paul-action-moderation",
    quote_text_ko: "행동만이 삶에 힘을 주고, 절제만이 삶에 매력을 준다.",
    quote_text_en: "Only actions give life strength; only moderation gives it a charm.",
    author_ko: "장 폴 리히터",
    author_en: "Jean Paul Richter",
  },
];

export function normalizeQuoteLanguage(value: unknown): SupportedQuoteLanguage {
  return value === "en" ? "en" : "ko";
}

export function localizeQuote(quote: DefaultQuote, language: SupportedQuoteLanguage): PublicQuote {
  return {
    ...quote,
    quote_text: language === "en" ? quote.quote_text_en : quote.quote_text_ko,
    author: language === "en" ? quote.author_en : quote.author_ko,
    language,
  };
}
