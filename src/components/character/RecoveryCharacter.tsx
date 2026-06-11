"use client";

import { useEffect, useRef, useMemo } from "react";

// ── Types ──
interface RecoveryCharacterProps {
  /** 0~1 사이 회복 진행률 (0 = 완전 grayscale, 1 = 완전 복원) */
  progress: number;
  /** 캐릭터 커스텀 설정 */
  config?: Partial<CharacterConfig>;
  /** 렌더 크기 */
  width?: number;
  height?: number;
  className?: string;
}

interface CharacterConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: number;    // 0=없음, 1=숏, 2=보브, 3=롱, 4=업
  eyeType: number;      // 0=둥근, 1=날카로운, 2=처진, 3=실눈
  irisType: number;     // 0=기본, 1=링, 2=별
  topType: number;      // 0=없음, 1=티, 2=후드, 3=셔츠
  bottomType: number;   // 0=없음, 1=팬츠, 2=스커트
  accType: number;      // 0=없음, 1=안경, 2=귀걸이
}

const DEFAULT_CONFIG: CharacterConfig = {
  skinColor: "#e8c8a8",
  hairColor: "#3a2818",
  hairStyle: 1,
  eyeType: 0,
  irisType: 0,
  topType: 1,
  bottomType: 1,
  accType: 0,
};

// ── Color utils ──
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function mixColors(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

function grayScale(c: [number, number, number]): [number, number, number] {
  const v = (c[0] + c[1] + c[2]) / 3;
  return [v, v, v];
}

function rgba(
  r: number,
  g: number,
  b: number,
  a = 1
): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

// ── Component ──
export default function RecoveryCharacter({
  progress,
  config: configOverride,
  width = 200,
  height = 320,
  className,
}: RecoveryCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...configOverride }),
    [configOverride]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderCharacter(ctx, width, height, Math.max(0, Math.min(1, progress)), config);
  }, [progress, config, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ borderRadius: "16px" }}
      aria-label={`캐릭터 회복도 ${Math.round(progress * 100)}%`}
    />
  );
}

// ── Rendering ──
function renderCharacter(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  rec: number,
  cfg: CharacterConfig
) {
  ctx.clearRect(0, 0, W, H);

  const skinRgb = hexToRgb(cfg.skinColor);
  const hairRgb = hexToRgb(cfg.hairColor);

  // Proportions
  const cx = W / 2;
  const headR = W * 0.12;
  const headY = H * 0.2;
  const bodyW = W * 0.14;
  const bodyH = H * 0.25;
  const bodyTop = headY + headR + H * 0.025;
  const legW = W * 0.05;
  const legH = H * 0.22;
  const legGap = bodyW * 0.35;
  const armW = W * 0.04;
  const armLen = bodyH * 0.85;

  function skinCol(a = 1): string {
    const c = rec < 1 ? mixColors(grayScale(skinRgb), skinRgb, rec) : skinRgb;
    return rgba(c[0], c[1], c[2], a);
  }

  function hairCol(a = 1): string {
    const c = rec < 1 ? mixColors(grayScale(hairRgb), hairRgb, rec) : hairRgb;
    return rgba(c[0], c[1], c[2], a);
  }

  // ── Shadow ──
  ctx.fillStyle = "rgba(0,0,0,.03)";
  ctx.beginPath();
  ctx.ellipse(cx, H * 0.92, bodyW * 1.5, H * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs ──
  const legY = bodyTop + bodyH;
  drawRoundRect(ctx, cx - legGap - legW / 2, legY, legW, legH, legW / 2, skinCol());
  drawRoundRect(ctx, cx + legGap - legW / 2, legY, legW, legH, legW / 2, skinCol());

  // ── Body ──
  ctx.beginPath();
  ctx.moveTo(cx - bodyW, bodyTop);
  ctx.bezierCurveTo(cx - bodyW, bodyTop + bodyH * 0.5, cx - bodyW * 0.9, bodyTop + bodyH, cx - bodyW * 0.5, bodyTop + bodyH);
  ctx.lineTo(cx + bodyW * 0.5, bodyTop + bodyH);
  ctx.bezierCurveTo(cx + bodyW * 0.9, bodyTop + bodyH, cx + bodyW, bodyTop + bodyH * 0.5, cx + bodyW, bodyTop);
  ctx.closePath();
  ctx.fillStyle = skinCol();
  ctx.fill();
  ctx.strokeStyle = skinCol(0.3);
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Costume (additive layer) ──
  if (cfg.topType > 0) {
    const topColors: [number, number, number][] = [[80, 120, 160], [100, 85, 65], [230, 225, 215]];
    const tc = topColors[cfg.topType - 1] || topColors[0];
    const gc = rec < 1 ? mixColors(grayScale(tc), tc, rec) : tc;
    ctx.fillStyle = rgba(gc[0], gc[1], gc[2], 0.65);

    ctx.beginPath();
    ctx.moveTo(cx - bodyW * 1.02, bodyTop + 2);
    ctx.bezierCurveTo(cx - bodyW, bodyTop + bodyH * 0.45, cx - bodyW * 0.9, bodyTop + bodyH * 0.55, cx - bodyW * 0.5, bodyTop + bodyH * 0.55);
    ctx.lineTo(cx + bodyW * 0.5, bodyTop + bodyH * 0.55);
    ctx.bezierCurveTo(cx + bodyW * 0.9, bodyTop + bodyH * 0.55, cx + bodyW, bodyTop + bodyH * 0.45, cx + bodyW * 1.02, bodyTop + 2);
    ctx.closePath();
    ctx.fill();
  }

  if (cfg.bottomType > 0) {
    const botColors: [number, number, number][] = [[50, 60, 80], [160, 100, 80]];
    const bc = botColors[cfg.bottomType - 1] || botColors[0];
    const gc = rec < 1 ? mixColors(grayScale(bc), bc, rec) : bc;
    ctx.fillStyle = rgba(gc[0], gc[1], gc[2], 0.55);

    if (cfg.bottomType === 2) {
      ctx.beginPath();
      ctx.moveTo(cx - bodyW * 0.6, legY);
      ctx.lineTo(cx - bodyW * 0.8, legY + legH * 0.5);
      ctx.lineTo(cx + bodyW * 0.8, legY + legH * 0.5);
      ctx.lineTo(cx + bodyW * 0.6, legY);
      ctx.closePath();
      ctx.fill();
    } else {
      drawRoundRect(ctx, cx - legGap - legW * 0.7, legY, legW * 1.4, legH * 0.85, 3, rgba(gc[0], gc[1], gc[2], 0.55));
      drawRoundRect(ctx, cx + legGap - legW * 0.7, legY, legW * 1.4, legH * 0.85, 3, rgba(gc[0], gc[1], gc[2], 0.55));
    }
  }

  // ── Arms ──
  drawRoundRect(ctx, cx - bodyW - armW, bodyTop + 4, armW, armLen, armW / 2, skinCol());
  drawRoundRect(ctx, cx + bodyW, bodyTop + 4, armW, armLen, armW / 2, skinCol());

  // ── Neck ──
  ctx.fillStyle = skinCol(0.9);
  ctx.fillRect(cx - W * 0.03, headY + headR - 2, W * 0.06, H * 0.03);

  // ── Head ──
  ctx.beginPath();
  ctx.ellipse(cx, headY, headR, headR * 1.08, 0, 0, Math.PI * 2);
  const headGrad = ctx.createRadialGradient(cx - headR * 0.2, headY - headR * 0.3, 0, cx, headY, headR);
  headGrad.addColorStop(0, skinCol(1));
  headGrad.addColorStop(1, skinCol(0.85));
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = skinCol(0.25);
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Hair ──
  if (cfg.hairStyle > 0) {
    ctx.fillStyle = hairCol();
    if (cfg.hairStyle === 1) {
      ctx.beginPath();
      ctx.ellipse(cx, headY - headR * 0.5, headR * 1.1, headR * 0.7, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (cfg.hairStyle === 2 || cfg.hairStyle === 3) {
      ctx.beginPath();
      ctx.ellipse(cx, headY - headR * 0.45, headR * 1.15, headR * 0.78, 0, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      const sideH = cfg.hairStyle === 3 ? headR * 2.5 : headR * 1.3;
      drawRoundRect(ctx, cx - headR * 1.12, headY - 2, headR * 0.3, sideH, 6, hairCol());
      drawRoundRect(ctx, cx + headR * 0.82, headY - 2, headR * 0.3, sideH, 6, hairCol());
    } else if (cfg.hairStyle === 4) {
      ctx.beginPath();
      ctx.moveTo(cx - headR * 0.7, headY - headR * 0.2);
      ctx.quadraticCurveTo(cx, headY - headR * 2, cx + headR * 0.7, headY - headR * 0.2);
      ctx.fill();
    }
  }

  // ── Eyes (appear at 35% recovery) ──
  if (rec > 0.35) {
    const alpha = Math.min(1, (rec - 0.35) / 0.35);
    const eyeS = headR * 0.22;
    const eyeLx = cx - headR * 0.34;
    const eyeRx = cx + headR * 0.34;
    const eyeY = headY - headR * 0.05;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(255,255,255,${0.7 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(eyeLx, eyeY, eyeS * 1.4, eyeS, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeRx, eyeY, eyeS * 1.4, eyeS, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(40,25,15,${0.8 * alpha})`;
    ctx.beginPath();
    ctx.arc(eyeLx, eyeY, eyeS * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeRx, eyeY, eyeS * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = `rgba(255,255,255,${0.5 * alpha})`;
    ctx.beginPath();
    ctx.arc(eyeLx + eyeS * 0.15, eyeY - eyeS * 0.2, eyeS * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeRx + eyeS * 0.15, eyeY - eyeS * 0.2, eyeS * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // ── Smile (appears at 55% recovery) ──
  if (rec > 0.55) {
    const alpha = Math.min(1, (rec - 0.55) / 0.25);
    ctx.strokeStyle = `rgba(40,25,15,${0.35 * alpha})`;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, headY + headR * 0.35, headR * 0.25, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // ── Accessory (appears at 45% recovery) ──
  if (cfg.accType === 1 && rec > 0.45) {
    const alpha = Math.min(1, (rec - 0.45) / 0.3) * 0.35;
    const eyeS = headR * 0.22;
    ctx.strokeStyle = `rgba(80,60,40,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx - headR * 0.34, headY - headR * 0.05, eyeS * 1.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + headR * 0.34, headY - headR * 0.05, eyeS * 1.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - headR * 0.34 + eyeS * 1.8, headY - headR * 0.05);
    ctx.lineTo(cx + headR * 0.34 - eyeS * 1.8, headY - headR * 0.05);
    ctx.stroke();
  }
}

// ── Helpers ──
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
  fill: string
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const rad = typeof r === "number" ? r : r[0];
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
