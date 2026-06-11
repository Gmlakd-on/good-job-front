/**
 * popRenderer.ts — Pop World (1990s) renderer
 * Bold saturated strokes, halftone overlay, neon-outline aesthetic
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
import { applyPopStrokeStyle, clearPopShadow } from "./colorBrush";

export class PopRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: WorldRendererConfig | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private strokes: StrokeData[] = [];
  private animFrame = 0;

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

    // Bright white base
    ctx.fillStyle = "#fefefe";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern (90s graphic design vibe)
    ctx.strokeStyle = "rgba(200, 200, 210, 0.15)";
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  beginStroke(point: StrokePoint, tool: ToolConfig) {
    this.currentPoints = [point];
    this.currentTool = tool;
  }

  continueStroke(point: StrokePoint) {
    if (!this.ctx || !this.currentTool) return;
    this.currentPoints.push(point);

    const outline = getStrokeOutline(this.currentPoints, this.currentTool.id, this.currentTool.size);
    if (outline.length < 2) return;

    // Redraw everything + live stroke
    this.redrawAll();

    const { ctx } = this;
    applyPopStrokeStyle(ctx, this.currentTool.color, this.currentTool.size);
    ctx.globalAlpha = this.currentTool.opacity;

    const path = new Path2D(outlineToSvgPath(outline));
    ctx.fill(path);
    clearPopShadow(ctx);
    ctx.globalAlpha = 1;
  }

  endStroke(): StrokeData | null {
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
      id: `pop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: this.currentTool.id,
      points: [...this.currentPoints],
      outline,
      color: this.currentTool.color,
      size: this.currentTool.size,
      opacity: this.currentTool.opacity,
      metadata: { world: "pop" },
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
      applyPopStrokeStyle(ctx, stroke.color, stroke.size);
      ctx.globalAlpha = stroke.opacity;
      const path = new Path2D(outlineToSvgPath(stroke.outline));
      ctx.fill(path);
      clearPopShadow(ctx);
    }

    ctx.globalAlpha = 1;
  }

  eraseStroke(strokeId: string, _style: EraseStyle) {
    // Pop dissolve: quick fade-out
    const idx = this.strokes.findIndex(s => s.id === strokeId);
    if (idx === -1) return;

    const target = this.strokes[idx];
    let frame = 0;
    const totalFrames = 8;

    const animate = () => {
      if (!this.ctx || !this.config) return;
      frame++;
      const t = frame / totalFrames;

      this.redrawAll();

      // Draw dissolving stroke with reducing opacity + pixel scatter
      const { ctx } = this;
      ctx.globalAlpha = target.opacity * (1 - t);
      ctx.filter = `blur(${t * 4}px)`;
      applyPopStrokeStyle(ctx, target.color, target.size);
      const path = new Path2D(outlineToSvgPath(target.outline));
      ctx.fill(path);
      clearPopShadow(ctx);
      ctx.filter = "none";
      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        this.animFrame = requestAnimationFrame(animate);
      } else {
        this.strokes.splice(idx, 1);
        this.redrawAll();
      }
    };
    animate();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas = null;
    this.ctx = null;
    this.strokes = [];
  }
}
