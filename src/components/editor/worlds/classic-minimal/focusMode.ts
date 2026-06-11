/**
 * focusMode.ts — Minimal World (2010s) focus mode system
 * Progressive dimming of surrounding content, highlight active area
 */

export interface FocusState {
  active: boolean;
  centerY: number;         // focal point Y position
  radius: number;          // visible radius in px
  dimOpacity: number;      // 0-1 for surrounding dim
  transition: number;      // 0-1 animation progress
}

const FOCUS_CONFIG = {
  radius: 120,             // sharp focus area
  fadeRadius: 80,          // gradient fade zone
  dimOpacity: 0.55,
  transitionDuration: 400, // ms
};

export function createFocusState(): FocusState {
  return {
    active: false,
    centerY: 0,
    radius: FOCUS_CONFIG.radius,
    dimOpacity: 0,
    transition: 0,
  };
}

/**
 * Apply focus overlay onto the canvas.
 * Dims everything except the active writing zone.
 */
export function drawFocusOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: FocusState
) {
  if (!state.active || state.dimOpacity < 0.01) return;

  ctx.save();

  // Top dim zone
  const topEnd = Math.max(0, state.centerY - state.radius);
  if (topEnd > 0) {
    const grad1 = ctx.createLinearGradient(0, topEnd - FOCUS_CONFIG.fadeRadius, 0, topEnd);
    grad1.addColorStop(0, `rgba(255,255,255,${state.dimOpacity})`);
    grad1.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = `rgba(255,255,255,${state.dimOpacity})`;
    ctx.fillRect(0, 0, width, Math.max(0, topEnd - FOCUS_CONFIG.fadeRadius));
    ctx.fillStyle = grad1;
    ctx.fillRect(0, topEnd - FOCUS_CONFIG.fadeRadius, width, FOCUS_CONFIG.fadeRadius);
  }

  // Bottom dim zone
  const bottomStart = Math.min(height, state.centerY + state.radius);
  if (bottomStart < height) {
    const grad2 = ctx.createLinearGradient(0, bottomStart, 0, bottomStart + FOCUS_CONFIG.fadeRadius);
    grad2.addColorStop(0, "rgba(255,255,255,0)");
    grad2.addColorStop(1, `rgba(255,255,255,${state.dimOpacity})`);

    ctx.fillStyle = grad2;
    ctx.fillRect(0, bottomStart, width, FOCUS_CONFIG.fadeRadius);
    ctx.fillStyle = `rgba(255,255,255,${state.dimOpacity})`;
    ctx.fillRect(0, bottomStart + FOCUS_CONFIG.fadeRadius, width, height);
  }

  ctx.restore();
}

/**
 * Animate focus state transition (fade in/out).
 */
export function updateFocusTransition(
  state: FocusState,
  targetActive: boolean,
  deltaMs: number
): FocusState {
  const speed = deltaMs / FOCUS_CONFIG.transitionDuration;

  let nextTransition = state.transition;
  if (targetActive) {
    nextTransition = Math.min(1, state.transition + speed);
  } else {
    nextTransition = Math.max(0, state.transition - speed);
  }

  return {
    ...state,
    active: nextTransition > 0,
    transition: nextTransition,
    dimOpacity: nextTransition * FOCUS_CONFIG.dimOpacity,
  };
}
