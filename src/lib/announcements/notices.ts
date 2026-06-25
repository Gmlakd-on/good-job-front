export type AnnouncementNoticeKind = "update" | "coming-soon" | "maintenance";

export interface AnnouncementNotice {
  /** Change this id when you want users to see the popup again. */
  id: string;
  kind: AnnouncementNoticeKind;
  title: string;
  description: string;
  items?: string[];
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export const ANNOUNCEMENT_POPUP_VERSION = "2026-06-25";

export const ANNOUNCEMENT_NOTICES: AnnouncementNotice[] = [
  {
    id: "chami-care-widget-live",
    kind: "update",
    badge: "업데이트",
    title: "참이 돌봄 위젯을 바로 사용할 수 있어요",
    description: "홈 화면에서 먹이 주기, 놀아주기, 씻기기, 재우기, 미니게임까지 한 번에 즐길 수 있도록 준비했어요.",
    items: ["확언 먹이주기 중복 버튼은 정리했어요.", "참이의 상태는 브라우저에 안전하게 저장돼요."],
    ctaLabel: "홈에서 확인하기",
    ctaHref: "/",
  },
  {
    id: "preparing-more-care-rewards",
    kind: "coming-soon",
    badge: "준비중",
    title: "돌봄 보상과 성장 기록을 준비하고 있어요",
    description: "꾸준히 참이를 돌본 기록이 더 예쁘게 남고, 작은 보상으로 이어질 수 있도록 다음 업데이트를 준비 중이에요.",
    items: ["돌봄 연속 기록", "참이 성장/기분 변화", "도감과 연결되는 작은 보상"],
  },
];
