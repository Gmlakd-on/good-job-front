import type {
  WorldRenderer,
  WorldRendererConfig,
  StrokePoint,
  StrokeData,
  ToolConfig,
  EraseStyle,
} from "@/lib/editor/worldInterface";
import { createStrokeData } from "@/lib/editor/strokeEngine";
import { generatePaperGrain, shouldDeposit, type PaperGrainData } from "./paperGrain";

// Pencil hardness configs
const PENCIL_CONFIGS: Record<string, { particleCount: number; baseOpacity: number; thresholdBias: number }> = {
  pencil_2h: { particleCount: 3,  baseOpacity: 0.2, thresholdBias: 0.3 },  // Hard, light, bumps only
  pencil_hb: { particleCount: 5,  baseOpacity: 0.35, thresholdBias: 0.15 },
  pencil_2b: { particleCount: 8,  baseOpacity: 0.5, thresholdBias: 0.05 },
  pencil_4b: { particleCount: 12, baseOpacity: 0.7, thresholdBias: -0.1 }, // Soft, dark, everywhere
};

export class SketchRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private grainData: PaperGrainData | null = null;
  private bgCanvas: OffscreenCanvas | null = null;

  // Accumulation buffer for layering
  private accumCanvas: OffscreenCanvas | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private allStrokes: StrokeData[] = [];

  // Eraser particles
  private eraserCrumbs: { x: number; y: number; size: number; alpha: number; vx: number; vy: number }[] = [];
  private animFrame: number | null = null;

  init(canvas: HTMLCanvasElement, config: WorldRendererConfig): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = config.width;
    this.height = config.height;

    canvas.width = config.width;
    canvas.height = config.height;

    // Generate paper texture
    const texW = Math.min(256, config.width);
    const texH = Math.min(256, config.height);
    this.grainData = generatePaperGrain(texW, texH);

    // Background
    this.bgCanvas = new OffscreenCanvas(config.width, config.height);
    const bgCtx = this.bgCanvas.getContext("2d")!;
    const tempCanvas = new OffscreenCanvas(texW, texH);
    tempCanvas.getContext("2d")!.putImageData(this.grainData.colorData, 0, 0);
    const pat = bgCtx.createPattern(tempCanvas as unknown as CanvasImageSource, "repeat");
    if (pat) {
      bgCtx.fillStyle = pat;
      bgCtx.fillRect(0, 0, config.width, config.height);
    }

    // Accumulation layer
    this.accumCanvas = new OffscreenCanvas(config.width, config.height);

    this.renderBase();
    this.startAnimLoop();
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
    this.currentPoints = [point];
    this.currentTool = tool;
  }

  continueStroke(point: StrokePoint): void {
    if (!this.currentTool || !this.ctx || !this.grainData) return;
    this.currentPoints.push(point);

    if (this.currentPoints.length >= 2) {
      const p1 = this.currentPoints[this.currentPoints.length - 2];
      const p2 = this.currentPoints[this.currentPoints.length - 1];
      this.drawPencilSegment(this.ctx, p1, p2, this.currentTool);
    }
  }

  endStroke(): StrokeData | null {
    if (!this.currentTool || this.currentPoints.length < 2) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    const stroke = createStrokeData(this.currentPoints, this.currentTool, { world: "sketch" });
    this.allStrokes.push(stroke);
    this.currentPoints = [];
    this.currentTool = null;
    return stroke;
  }

  renderAll(strokes: StrokeData[]): void {
    this.allStrokes = strokes;
    if (!this.ctx || !this.grainData) return;

    this.renderBase();

    for (const stroke of strokes) {
      const tool: ToolConfig = {
        id: stroke.tool,
        color: stroke.color,
        size: stroke.size,
        opacity: stroke.opacity,
        custom: {},
      };

      for (let i = 1; i < stroke.points.length; i++) {
        this.drawPencilSegment(this.ctx, stroke.points[i - 1], stroke.points[i], tool);
      }
    }
  }

  eraseStroke(strokeId: string, _style: EraseStyle): void {
    // Spawn eraser crumbs at the stroke's last known position
    const stroke = this.allStrokes.find((s) => s.id === strokeId);
    if (stroke && stroke.points.length > 0) {
      const lastPt = stroke.points[stroke.points.length - 1];
      this.spawnCrumbs(lastPt.x, lastPt.y);
    }

    this.allStrokes = this.allStrokes.filter((s) => s.id !== strokeId);
    this.renderAll(this.allStrokes);
  }

  destroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.eraserCrumbs = [];
    this.canvas = null;
    this.ctx = null;
  }

  // ─── Private ───

  private renderBase(): void {
    if (!this.ctx || !this.bgCanvas) return;
    this.ctx.drawImage(this.bgCanvas as unknown as CanvasImageSource, 0, 0);
  }

  private drawPencilSegment(
    ctx: CanvasRenderingContext2D,
    p1: StrokePoint,
    p2: StrokePoint,
    tool: ToolConfig
  ): void {
    if (!this.grainData) return;

    const config = PENCIL_CONFIGS[tool.id] || PENCIL_CONFIGS.pencil_hb;
    const pressure = p2.pressure;
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist / 1.2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;

      // Spawn multiple particles per step
      for (let j = 0; j < config.particleCount; j++) {
        const px = x + (Math.random() - 0.5) * tool.size * 0.8;
        const py = y + (Math.random() - 0.5) * tool.size * 0.8;

        // Check against paper height map
        const adjustedPressure = Math.min(1, pressure + config.thresholdBias);
        if (!shouldDeposit(
          this.grainData.heightMap,
          this.grainData.width,
          this.grainData.height,
          px,
          py,
          adjustedPressure
        )) {
          continue; // Paper valley — graphite doesn't stick
        }

        // Draw particle
        const alpha = config.baseOpacity * (0.3 + pressure * 0.7) * (0.6 + Math.random() * 0.4);
        const dotSize = tool.size * (0.3 + pressure * 0.5) * (0.6 + Math.random() * 0.5);

        ctx.save();
        ctx.globalAlpha = Math.min(0.9, alpha);
        ctx.fillStyle = tool.color;
        ctx.beginPath();
        ctx.arc(px, py, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private spawnCrumbs(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      this.eraserCrumbs.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: Math.random() * 3 + 1,
        alpha: 0.4 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1 + 0.5,
      });
    }
  }

  private startAnimLoop(): void {
    const animate = () => {
      this.animFrame = requestAnimationFrame(animate);
      if (!this.ctx || this.eraserCrumbs.length === 0) return;

      for (let i = this.eraserCrumbs.length - 1; i >= 0; i--) {
        const c = this.eraserCrumbs[i];
        c.x += c.vx;
        c.y += c.vy;
        c.alpha -= 0.015;

        if (c.alpha <= 0) {
          this.eraserCrumbs.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = c.alpha;
        this.ctx.fillStyle = "#e8e0d0";
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }
}
