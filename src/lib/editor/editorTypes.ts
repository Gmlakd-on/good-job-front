import type { CoverStyleId } from "@/components/book-ui/bookTypes";

// ─── Tool Types ───
export type ToolType =
  | "chisel" | "chisel_deep"
  | "brush" | "brush_light" | "brush_dark"
  | "fountain_pen" | "ink_navy" | "ink_brown"
  | "pencil_2h" | "pencil_hb" | "pencil_2b" | "pencil_4b"
  | "pastel" | "ballpoint_color"
  | "color_pen" | "sticker_stamp"
  | "minimal_pen"
  | "eraser";

export type ToolCategory = "primary" | "variant" | "utility";

export interface EditorTool {
  id: ToolType;
  label: string;
  icon: string;
  category: ToolCategory;
  color?: string;
  size?: number;
  opacity?: number;
}

// ─── Canvas Stroke ───
export interface Stroke {
  id: string;
  tool: ToolType;
  points: { x: number; y: number; pressure: number }[];
  color: string;
  size: number;
  opacity: number;
  timestamp: number;
}

// ─── Editor State ───
export interface EditorState {
  coverStyle: CoverStyleId;
  selectedTool: ToolType;
  plainText: string;
  strokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  isDirty: boolean;
}

// ─── World Config ───
export interface WorldConfig {
  id: CoverStyleId;
  label: string;
  subtitle: string;
  tools: EditorTool[];
  canvasEnabled: boolean;
  textStyle: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    color: string;
    placeholder: string;
  };
  bgStyle: {
    background: string;
    texture?: string;
    filter?: string;
  };
  canvasStyle?: {
    strokeCap: CanvasLineCap;
    compositeOp?: GlobalCompositeOperation;
    pressureSensitive: boolean;
    textureOverlay?: string;
  };
}

// ─── World Definitions ───
export const WORLDS: Record<CoverStyleId, WorldConfig> = {
  stone: {
    id: "stone",
    label: "돌판",
    subtitle: "깊이 새기는 단단한 기록",
    canvasEnabled: true,
    tools: [
      { id: "chisel", label: "조각 도구", icon: "⛏", category: "primary", color: "#8a8070", size: 3, opacity: 0.85 },
      { id: "chisel_deep", label: "깊이", icon: "🪨", category: "variant", color: "#5c5348", size: 5, opacity: 1 },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      fontSize: "17px",
      lineHeight: "1.9",
      color: "#4a4038",
      placeholder: "오늘, 마음을 단단히 새긴다.",
    },
    bgStyle: {
      background: "linear-gradient(175deg, #9e9486 0%, #7d7568 40%, #6b6358 100%)",
      texture: "noise-stone",
    },
    canvasStyle: {
      strokeCap: "round",
      compositeOp: "multiply",
      pressureSensitive: true,
      textureOverlay: "engrave",
    },
  },

  archive: {
    id: "archive",
    label: "고서",
    subtitle: "먹과 붓으로 남기는 전통의 기록",
    canvasEnabled: true,
    tools: [
      { id: "brush", label: "붓", icon: "🖌", category: "primary", color: "#1a1008", size: 4, opacity: 0.9 },
      { id: "brush_light", label: "연함", icon: "💧", category: "variant", color: "#3a3028", size: 3, opacity: 0.45 },
      { id: "brush_dark", label: "진함", icon: "🖤", category: "variant", color: "#0a0804", size: 5, opacity: 1 },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Noto Serif KR', 'Batang', serif",
      fontSize: "18px",
      lineHeight: "2.2",
      color: "#1a1008",
      placeholder: "오늘, 마음을 마주하다",
    },
    bgStyle: {
      background: "linear-gradient(178deg, #f4edbd 0%, #e8dca5 100%)",
      texture: "noise-hanji",
    },
    canvasStyle: {
      strokeCap: "round",
      pressureSensitive: true,
      textureOverlay: "ink-bleed",
    },
  },

  "1950": {
    id: "1950",
    label: "클래식",
    subtitle: "시간을 품은 우아한 기록",
    canvasEnabled: false,
    tools: [
      { id: "fountain_pen", label: "만년필", icon: "🖋", category: "primary", color: "#1a1a1a", size: 2 },
      { id: "ink_navy", label: "네이비", icon: "🔵", category: "variant", color: "#1a2a4a" },
      { id: "ink_brown", label: "브라운", icon: "🟤", category: "variant", color: "#4a3020" },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Noto Serif KR', 'Georgia', serif",
      fontSize: "17px",
      lineHeight: "2.0",
      color: "#1a1a1a",
      placeholder: "오늘의 나에게 보내는 편지",
    },
    bgStyle: {
      background: "linear-gradient(180deg, #faf5e8 0%, #f0e8d0 100%)",
      texture: "noise-cream",
    },
  },

  "1980": {
    id: "1980",
    label: "스케치",
    subtitle: "생각을 자유롭게 그리는 기록",
    canvasEnabled: true,
    tools: [
      { id: "pencil_hb", label: "HB", icon: "✏️", category: "primary", color: "#3a3a3a", size: 2, opacity: 0.7 },
      { id: "pencil_2h", label: "2H", icon: "✏️", category: "variant", color: "#6a6a6a", size: 1.5, opacity: 0.45 },
      { id: "pencil_2b", label: "2B", icon: "✏️", category: "variant", color: "#2a2a2a", size: 3, opacity: 0.85 },
      { id: "pencil_4b", label: "4B", icon: "✏️", category: "variant", color: "#1a1a1a", size: 4, opacity: 1 },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      fontSize: "16px",
      lineHeight: "1.8",
      color: "#3a3a3a",
      placeholder: "오늘의 순간들",
    },
    bgStyle: {
      background: "#f8f4ee",
      texture: "noise-sketch",
    },
    canvasStyle: {
      strokeCap: "round",
      pressureSensitive: true,
      textureOverlay: "pencil-grain",
    },
  },

  "1990": {
    id: "1990",
    label: "팝",
    subtitle: "컬러와 그래픽으로 표현하는 기록",
    canvasEnabled: true,
    tools: [
      { id: "pastel", label: "파스텔", icon: "🖍", category: "primary", color: "#e87ba8", size: 4 },
      { id: "ballpoint_color", label: "볼펜", icon: "🖊", category: "variant", color: "#4a8fe7" },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      fontSize: "17px",
      lineHeight: "1.85",
      color: "#3a2a4a",
      placeholder: "오늘의 기분, POP하게!",
    },
    bgStyle: {
      background: "linear-gradient(165deg, #fce4ec 0%, #e8eaf6 50%, #e0f7fa 100%)",
    },
  },

  "2000": {
    id: "2000",
    label: "키치",
    subtitle: "사랑스럽게 꾸미는 나만의 기록",
    canvasEnabled: true,
    tools: [
      { id: "color_pen", label: "컬러펜", icon: "🖊", category: "primary", color: "#e44d8a" },
      { id: "sticker_stamp", label: "스티커", icon: "💖", category: "variant" },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      fontSize: "16px",
      lineHeight: "1.9",
      color: "#4a3040",
      placeholder: "오늘의 하이라이트",
    },
    bgStyle: {
      background: "linear-gradient(170deg, #fef3e2 0%, #fce4ec 50%, #f3e5f5 100%)",
    },
  },

  "2010": {
    id: "2010",
    label: "미니멀",
    subtitle: "불필요한 것 없이, 집중하는 기록",
    canvasEnabled: false,
    tools: [
      { id: "minimal_pen", label: "펜", icon: "✒", category: "primary", color: "#2a2a2a", size: 1.5 },
      { id: "eraser", label: "지우개", icon: "🧹", category: "utility" },
    ],
    textStyle: {
      fontFamily: "'Noto Sans KR', 'Helvetica Neue', sans-serif",
      fontSize: "16px",
      lineHeight: "2.0",
      color: "#2a2a2a",
      placeholder: "오늘, 나에게 집중하는 시간",
    },
    bgStyle: {
      background: "#fafaf8",
    },
  },
};
