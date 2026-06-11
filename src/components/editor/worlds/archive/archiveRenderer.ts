import type {
  WorldRenderer,
  WorldRendererConfig,
  StrokePoint,
  StrokeData,
  ToolConfig,
  EraseStyle,
} from "@/lib/editor/worldInterface";
import { createStrokeData } from "@/lib/editor/strokeEngine";
import { generateHanjiTexture } from "./hanjiTexture";
import { stampSeal } from "./sealStamp";

export class ArchiveRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private bgCanvas: OffscreenCanvas | null = null;
  private fiberMap: Float32Array | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private allStrokes: StrokeData[] = [];

  // Ink bleed simulation
  private inkLayer: OffscreenCanvas | null = null;
  private bleedQueue: { x: number; y: number; amount: number; frame: number }[] = [];
  private animFrame: number | null = null;

  init(canvas: HTMLCanvasElement, config: WorldRendererConfig): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = config.width;
    this.height = config.height;

    canvas.width = config.width;
    canvas.height = config.height;

    // Generate hanji texture
    const texW = Math.min(512, config.width);
    const texH = Math.min(512, config.height);
    const { colorData, fiberMap } = generateHanjiTexture(texW, texH);
    this.fiberMap = fiberMap;

    // Background
    this.bgCanvas = new OffscreenCanvas(config.width, config.height);
    const bgCtx = this.bgCanvas.getContext("2d")!;
    const tempCanvas = new OffscreenCanvas(texW, texH);
    tempCanvas.getContext("2d")!.putImageData(colorData, 0, 0);
    const pat = bgCtx.createPattern(tempCanvas as unknown as CanvasImageSource, "repeat");
    if (pat) {
      bgCtx.fillStyle = pat;
      bgCtx.fillRect(0, 0, config.width, config.height);
    }

    // Ink layer (transparent, drawn on top)
    this.inkLayer = new OffscreenCanvas(config.width, config.height);

    this.renderBase();
    this.startBleedLoop();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.renderAll(this.allStrokes);
  }

  beginStroke(point: StrokePoint, tool: ToolConfig): void {
    // 도장 찍기 — single tap places a seal
    if (tool.id === "sticker_stamp" && this.ctx) {
      const designIdx = (tool.custom?.sealDesign as number) ?? 0;
      stampSeal(this.ctx, point.x, point.y, { designIndex: designIdx, size: tool.size * 16 });
      // Create a stroke record so it can be undone/saved
      this.currentPoints = [point];
      this.currentTool = tool;
      return;
    }

    this.currentPoints = [point];
    this.currentTool = tool;
  }

  continueStroke(point: StrokePoint): void {
    if (!this.currentTool || !this.ctx) return;
    this.currentPoints.push(point);

    if (this.currentPoints.length >= 2) {
      const p1 = this.currentPoints[this.currentPoints.length - 2];
      const p2 = this.currentPoints[this.currentPoints.length - 1];

      // Calculate speed for ink density
      const dt = (p2.timestamp - p1.timestamp) || 16;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const speed = dist / dt;

      this.drawBrushSegment(this.ctx, p1, p2, this.currentTool, speed);

      // Queue ink bleed
      this.bleedQueue.push({
        x: p2.x,
        y: p2.y,
        amount: Math.max(0.1, 1 - speed * 2) * p2.pressure,
        frame: 0,
      });
    }
  }

  endStroke(): StrokeData | null {
    if (!this.currentTool || this.currentPoints.length < 1) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    // Seal stamps are single-point; brush strokes need >= 2
    if (this.currentTool.id !== "sticker_stamp" && this.currentPoints.length < 2) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    const stroke = createStrokeData(this.currentPoints, this.currentTool, { world: "archive" });
    this.allStrokes.push(stroke);
    this.currentPoints = [];
    this.currentTool = null;
    return stroke;
  }

  renderAll(strokes: StrokeData[]): void {
    this.allStrokes = strokes;
    if (!this.ctx) return;

    this.renderBase();

    for (const stroke of strokes) {
      const tool: ToolConfig = {
        id: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        opacity: stroke.opacity,
        custom: stroke.metadata ?? {},
      };

      // Seal stamps — re-stamp at the recorded point
      if (stroke.tool === "sticker_stamp" && stroke.points.length >= 1) {
        const pt = stroke.points[0];
        const designIdx = (tool.custom?.sealDesign as number) ?? 0;
        stampSeal(this.ctx, pt.x, pt.y, { designIndex: designIdx, size: tool.size * 16 });
        continue;
      }

      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        const dt = (p2.timestamp - p1.timestamp) || 16;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const speed = dist / dt;
        this.drawBrushSegment(this.ctx, p1, p2, tool, speed);
      }
    }
  }

  eraseStroke(strokeId: string, _style: EraseStyle): void {
    // Fade effect: redraw without the stroke
    this.allStrokes = this.allStrokes.filter((s) => s.id !== strokeId);
    this.renderAll(this.allStrokes);
  }

  destroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.bleedQueue = [];
    this.canvas = null;
    this.ctx = null;
  }

  // ─── Private ───

  private renderBase(): void {
    if (!this.ctx || !this.bgCanvas) return;
    this.ctx.drawImage(this.bgCanvas as unknown as CanvasImageSource, 0, 0);
  }

  private drawBrushSegment(
    ctx: CanvasRenderingContext2D,
    p1: StrokePoint,
    p2: StrokePoint,
    tool: ToolConfig,
    speed: number
  ): void {
    const pressure = p2.pressure;
    // Slow → more ink → darker; Fast → less ink → lighter
    const inkDensity = Math.max(0.2, Math.min(1, 1 - speed * 1.5)) * tool.opacity;
    const size = tool.size * (0.4 + pressure * 1.2);

    ctx.save();

    // Outer bleed (ink spreading into hanji fibers)
    ctx.globalAlpha = inkDensity * 0.12;
    ctx.strokeStyle = tool.color;
    ctx.lineWidth = size * 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Mid spread
    ctx.globalAlpha = inkDensity * 0.25;
    ctx.lineWidth = size * 1.8;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Core brush stroke
    ctx.globalAlpha = inkDensity * (0.5 + pressure * 0.4);
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Ink pooling at high pressure + slow speed
    if (pressure > 0.6 && speed < 0.3 && Math.random() < 0.5) {
      ctx.globalAlpha = inkDensity * 0.15;
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, size * 2, 0, Math.PI * 2);
      ctx.fillStyle = tool.color;
      ctx.fill();
    }

    ctx.restore();
  }

  private startBleedLoop(): void {
    const animate = () => {
      this.animFrame = requestAnimationFrame(animate);
      if (!this.ctx || this.bleedQueue.length === 0) return;

      for (let i = this.bleedQueue.length - 1; i >= 0; i--) {
        const b = this.bleedQueue[i];
        b.frame++;

        if (b.frame <= 3) {
          // Simulate ink spreading over 3 frames
          const spread = b.frame * 2;
          this.ctx.save();
          this.ctx.globalAlpha = b.amount * 0.03;
          this.ctx.fillStyle = "#1a1008";
          this.ctx.beginPath();
          this.ctx.arc(
            b.x + (Math.random() - 0.5) * spread,
            b.y + (Math.random() - 0.5) * spread,
            spread * 0.8 + Math.random() * 2,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
          this.ctx.restore();
        } else {
          this.bleedQueue.splice(i, 1);
        }
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }
}
