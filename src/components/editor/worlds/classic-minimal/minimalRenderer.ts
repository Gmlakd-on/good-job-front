/**
 * minimalRenderer.ts — Minimal World (2010s) renderer
 * Ultra-clean single-weight pen, white space, focus mode
 */

import type {
  WorldRenderer,
  StrokePoint,
  StrokeData,
  ToolConfig,
  EraseStyle,
  WorldRendererConfig,
} from "@/lib/editor/worldInterface";
import { getStrokeOutline, outlineToSvgPath } from "@/lib/editor/strokeEngine";
import { createFocusState, drawFocusOverlay, updateFocusTransition, type FocusState } from "./focusMode";

export class MinimalRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: WorldRendererConfig | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private strokes: StrokeData[] = [];
  private focusState: FocusState;
  private animFrame = 0;
  private lastFrameTime = 0;

  constructor() {
    this.focusState = createFocusState();
  }

  init(canvas: HTMLCanvasElement, config: WorldRendererConfig) {
    this.canvas = canvas;
    this.config = config;

    canvas.width = config.width * config.devicePixelRatio;
    canvas.height = config.height * config.devicePixelRatio;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(config.devicePixelRatio, config.devicePixelRatio);
    this.ctx = ctx;

    this.drawBackground();
  }

  resize(width: number, height: number) {
    if (!this.canvas || !this.config) return;
    this.config.width = width;
    this.config.height = height;
    this.canvas.width = width * this.config.devicePixelRatio;
    this.canvas.height = height * this.config.devicePixelRatio;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.scale(this.config.devicePixelRatio, this.config.devicePixelRatio);
    this.renderAll(this.strokes);
  }

  private drawBackground() {
    if (!this.ctx || !this.config) return;
    const { ctx } = this;
    const { width, height } = this.config;

    // Pure white — maximum clarity
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Single subtle baseline indicator (not full rules)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
    ctx.lineWidth = 0.5;
    const centerY = height * 0.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.15, centerY);
    ctx.lineTo(width * 0.85, centerY);
    ctx.stroke();
  }

  beginStroke(point: StrokePoint, tool: ToolConfig) {
    this.currentPoints = [point];
    this.currentTool = tool;

    // Activate focus mode while drawing
    this.focusState = {
      ...this.focusState,
      centerY: point.y,
    };
    this.startFocusAnimation(true);
  }

  continueStroke(point: StrokePoint) {
    if (!this.ctx || !this.currentTool) return;
    this.currentPoints.push(point);

    // Update focus center to follow the pen
    this.focusState.centerY = point.y;

    const outline = getStrokeOutline(
      this.currentPoints,
      this.currentTool.id,
      this.currentTool.size
    );
    if (outline.length < 2) return;

    this.redrawAll();

    const { ctx } = this;
    // Minimal: always dark gray, consistent opacity
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#2c2c2c";
    const path = new Path2D(outlineToSvgPath(outline));
    ctx.fill(path);
    ctx.globalAlpha = 1;

    // Focus overlay on top
    if (this.config) {
      drawFocusOverlay(ctx, this.config.width, this.config.height, this.focusState);
    }
  }

  endStroke(): StrokeData | null {
    // Deactivate focus mode
    this.startFocusAnimation(false);

    if (this.currentPoints.length < 2 || !this.currentTool) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    const outline = getStrokeOutline(
      this.currentPoints,
      this.currentTool.id,
      this.currentTool.size
    );

    const stroke: StrokeData = {
      id: `minimal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: this.currentTool.id,
      points: [...this.currentPoints],
      outline,
      color: "#2c2c2c",
      size: this.currentTool.size,
      opacity: 0.85,
      metadata: { world: "minimal" },
    };

    this.strokes.push(stroke);
    this.currentPoints = [];
    this.currentTool = null;
    this.redrawAll();

    return stroke;
  }

  renderAll(strokes: StrokeData[]) {
    this.strokes = strokes;
    this.redrawAll();
  }

  private redrawAll() {
    if (!this.ctx || !this.config) return;
    const { ctx, config } = this;

    ctx.clearRect(0, 0, config.width, config.height);
    this.drawBackground();

    for (const stroke of this.strokes) {
      if (stroke.outline.length < 2) continue;
      ctx.globalAlpha = stroke.opacity;
      ctx.fillStyle = stroke.color;
      const path = new Path2D(outlineToSvgPath(stroke.outline));
      ctx.fill(path);
    }

    ctx.globalAlpha = 1;
  }

  private startFocusAnimation(activate: boolean) {
    const animate = (timestamp: number) => {
      if (!this.ctx || !this.config) return;

      const delta = this.lastFrameTime ? timestamp - this.lastFrameTime : 16;
      this.lastFrameTime = timestamp;

      this.focusState = updateFocusTransition(this.focusState, activate, delta);

      this.redrawAll();
      drawFocusOverlay(this.ctx, this.config.width, this.config.height, this.focusState);

      // Continue until transition complete
      if ((activate && this.focusState.transition < 1) ||
          (!activate && this.focusState.transition > 0)) {
        this.animFrame = requestAnimationFrame(animate);
      }
    };

    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.lastFrameTime = 0;
    this.animFrame = requestAnimationFrame(animate);
  }

  eraseStroke(strokeId: string, _style: EraseStyle) {
    // Clean instant erase — minimal world is decisive
    const idx = this.strokes.findIndex(s => s.id === strokeId);
    if (idx === -1) return;
    this.strokes.splice(idx, 1);
    this.redrawAll();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas = null;
    this.ctx = null;
    this.strokes = [];
  }
}
