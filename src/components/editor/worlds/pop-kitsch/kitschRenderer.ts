/**
 * kitschRenderer.ts — Kitsch World (1980s) renderer
 * Sticker-collage aesthetic, decorative tape strips, peel-off erase
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
import { placeSticker, drawSticker, generatePeelFrames, type PlacedSticker } from "./stickerSystem";

export class KitschRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: WorldRendererConfig | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private strokes: StrokeData[] = [];
  private stickers: PlacedSticker[] = [];
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

    // Warm pastel base — diary notebook feel
    ctx.fillStyle = "#fef6e9";
    ctx.fillRect(0, 0, width, height);

    // Faint ruled lines
    ctx.strokeStyle = "rgba(200, 180, 160, 0.18)";
    ctx.lineWidth = 0.5;
    for (let y = 40; y < height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }

    // Decorative corner doodles (subtle)
    ctx.strokeStyle = "rgba(220, 180, 200, 0.2)";
    ctx.lineWidth = 1;
    // Top-left curl
    ctx.beginPath();
    ctx.arc(12, 12, 8, 0, Math.PI * 0.5);
    ctx.stroke();
    // Bottom-right curl
    ctx.beginPath();
    ctx.arc(width - 12, height - 12, 8, Math.PI, Math.PI * 1.5);
    ctx.stroke();
  }

  beginStroke(point: StrokePoint, tool: ToolConfig) {
    this.currentPoints = [point];
    this.currentTool = tool;
  }

  continueStroke(point: StrokePoint) {
    if (!this.ctx || !this.currentTool) return;
    this.currentPoints.push(point);

    // sticker_stamp tool: don't draw continuous stroke
    if (this.currentTool.id === "sticker_stamp") return;

    const outline = getStrokeOutline(this.currentPoints, this.currentTool.id, this.currentTool.size);
    if (outline.length < 2) return;

    this.redrawAll();

    const { ctx } = this;
    ctx.globalAlpha = this.currentTool.opacity;
    ctx.fillStyle = this.currentTool.color;
    const path = new Path2D(outlineToSvgPath(outline));
    ctx.fill(path);
    ctx.globalAlpha = 1;
  }

  endStroke(): StrokeData | null {
    if (!this.currentTool) {
      this.currentPoints = [];
      return null;
    }

    // Handle sticker stamp: place a sticker at the touch point
    if (this.currentTool.id === "sticker_stamp" && this.currentPoints.length > 0) {
      const pt = this.currentPoints[0];
      const stickerType = (this.currentTool.custom?.stickerId as string) || "heart";
      const placed = placeSticker(stickerType, pt.x, pt.y);

      if (placed) {
        this.stickers.push(placed);

        const stroke: StrokeData = {
          id: placed.id,
          tool: "sticker_stamp",
          points: [this.currentPoints[0]],
          outline: [],
          color: "",
          size: 32,
          opacity: 1,
          metadata: {
            world: "kitsch",
            type: "sticker",
            stickerId: stickerType,
            emoji: placed.emoji,
            rotation: placed.rotation,
            scale: placed.scale,
          },
        };

        this.strokes.push(stroke);
        this.currentPoints = [];
        this.currentTool = null;
        this.redrawAll();
        return stroke;
      }

      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    // Normal stroke
    if (this.currentPoints.length < 2) {
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
      id: `kitsch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: this.currentTool.id,
      points: [...this.currentPoints],
      outline,
      color: this.currentTool.color,
      size: this.currentTool.size,
      opacity: this.currentTool.opacity,
      metadata: { world: "kitsch" },
    };

    this.strokes.push(stroke);
    this.currentPoints = [];
    this.currentTool = null;
    this.redrawAll();

    return stroke;
  }

  renderAll(strokes: StrokeData[]) {
    this.strokes = strokes;

    // Rebuild stickers from stroke metadata
    this.stickers = [];
    for (const s of strokes) {
      if (s.metadata?.type === "sticker" && s.points.length > 0) {
        this.stickers.push({
          id: s.id,
          stickerId: s.metadata.stickerId as string,
          emoji: s.metadata.emoji as string,
          x: s.points[0].x,
          y: s.points[0].y,
          rotation: (s.metadata.rotation as number) || 0,
          scale: (s.metadata.scale as number) || 1,
          opacity: 1,
          timestamp: s.points[0].timestamp,
        });
      }
    }

    this.redrawAll();
  }

  private redrawAll() {
    if (!this.ctx || !this.config) return;
    const { ctx, config } = this;

    ctx.clearRect(0, 0, config.width, config.height);
    this.drawBackground();

    // Draw regular strokes
    for (const stroke of this.strokes) {
      if (stroke.metadata?.type === "sticker") continue;
      if (stroke.outline.length < 2) continue;

      ctx.globalAlpha = stroke.opacity;
      ctx.fillStyle = stroke.color;
      const path = new Path2D(outlineToSvgPath(stroke.outline));
      ctx.fill(path);
    }

    // Draw stickers on top
    for (const sticker of this.stickers) {
      drawSticker(ctx, sticker, 32);
    }

    ctx.globalAlpha = 1;
  }

  eraseStroke(strokeId: string, _style: EraseStyle) {
    const idx = this.strokes.findIndex(s => s.id === strokeId);
    if (idx === -1) return;

    const target = this.strokes[idx];
    const isSticker = target.metadata?.type === "sticker";

    if (isSticker) {
      // Peel animation
      const stickerIdx = this.stickers.findIndex(s => s.id === strokeId);
      if (stickerIdx === -1) {
        this.strokes.splice(idx, 1);
        this.redrawAll();
        return;
      }

      const sticker = this.stickers[stickerIdx];
      const frames = generatePeelFrames(sticker, 10);
      let frame = 0;

      const animate = () => {
        if (!this.ctx) return;
        frame++;
        if (frame >= frames.length) {
          this.stickers.splice(stickerIdx, 1);
          this.strokes.splice(idx, 1);
          this.redrawAll();
          return;
        }

        this.redrawAll();

        const f = frames[frame];
        const { ctx } = this;
        ctx.save();
        ctx.translate(sticker.x, sticker.y + f.offsetY);
        ctx.rotate((f.rotation * Math.PI) / 180);
        ctx.scale(f.scale, f.scale);
        ctx.globalAlpha = f.opacity;
        ctx.font = "32px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker.emoji, 0, 0);
        ctx.restore();

        this.animFrame = requestAnimationFrame(animate);
      };
      animate();
    } else {
      // Fade erase for normal strokes
      this.strokes.splice(idx, 1);
      this.redrawAll();
    }
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas = null;
    this.ctx = null;
    this.strokes = [];
    this.stickers = [];
  }
}
