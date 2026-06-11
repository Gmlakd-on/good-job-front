import type {
  WorldRenderer,
  WorldRendererConfig,
  StrokePoint,
  StrokeData,
  ToolConfig,
  EraseStyle,
} from "@/lib/editor/worldInterface";
import { createStrokeData } from "@/lib/editor/strokeEngine";
import { generateStoneTexture } from "./stoneTexture";

export class StoneRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private textureData: ImageData | null = null;
  private textureCanvas: OffscreenCanvas | null = null;

  // Current stroke state
  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private allStrokes: StrokeData[] = [];

  // Particle system
  private particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }[] = [];
  private animFrame: number | null = null;

  init(canvas: HTMLCanvasElement, config: WorldRendererConfig): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    this.width = config.width;
    this.height = config.height;

    canvas.width = config.width;
    canvas.height = config.height;

    // Generate stone texture
    const texW = Math.min(512, config.width);
    const texH = Math.min(512, config.height);
    this.textureData = generateStoneTexture(texW, texH);

    // Create tiling texture canvas
    this.textureCanvas = new OffscreenCanvas(config.width, config.height);
    const tCtx = this.textureCanvas.getContext("2d")!;
    const tempCanvas = new OffscreenCanvas(texW, texH);
    const tmpCtx = tempCanvas.getContext("2d")!;
    tmpCtx.putImageData(this.textureData, 0, 0);

    // Tile the texture
    const pat = tCtx.createPattern(tempCanvas as unknown as CanvasImageSource, "repeat");
    if (pat) {
      tCtx.fillStyle = pat;
      tCtx.fillRect(0, 0, config.width, config.height);
    }

    this.renderBase();
    this.startParticleLoop();
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
    if (!this.currentTool || !this.ctx) return;
    this.currentPoints.push(point);

    // Draw incremental engrave effect
    if (this.currentPoints.length >= 2) {
      const p1 = this.currentPoints[this.currentPoints.length - 2];
      const p2 = this.currentPoints[this.currentPoints.length - 1];
      this.drawEngraveSegment(this.ctx, p1, p2, this.currentTool);

      // Spawn dust particles
      this.spawnDustParticles(p2.x, p2.y, p2.pressure);
    }
  }

  endStroke(): StrokeData | null {
    if (!this.currentTool || this.currentPoints.length < 2) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    const stroke = createStrokeData(this.currentPoints, this.currentTool, { world: "stone" });
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
      this.drawEngraveStroke(this.ctx, stroke);
    }
  }

  eraseStroke(strokeId: string, _style: EraseStyle): void {
    this.allStrokes = this.allStrokes.filter((s) => s.id !== strokeId);
    this.renderAll(this.allStrokes);
  }

  destroy(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }

  // ─── Private Methods ───

  private renderBase(): void {
    if (!this.ctx || !this.textureCanvas) return;

    // Draw stone background
    this.ctx.drawImage(this.textureCanvas as unknown as CanvasImageSource, 0, 0, this.width, this.height);
  }

  private drawEngraveStroke(ctx: CanvasRenderingContext2D, stroke: StrokeData): void {
    const tool: ToolConfig = {
      id: stroke.tool,
      color: stroke.color,
      size: stroke.size,
      opacity: stroke.opacity,
      custom: {},
    };

    for (let i = 1; i < stroke.points.length; i++) {
      this.drawEngraveSegment(ctx, stroke.points[i - 1], stroke.points[i], tool);
    }
  }

  private drawEngraveSegment(ctx: CanvasRenderingContext2D, p1: StrokePoint, p2: StrokePoint, tool: ToolConfig): void {
    const pressure = p2.pressure;
    const size = tool.size * (0.5 + pressure * 1.5);

    ctx.save();

    // V-groove: darker center with highlight edges
    // Deep inner line
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.3 + pressure * 0.5;
    ctx.strokeStyle = `rgba(40, 32, 24, ${0.4 + pressure * 0.5})`;
    ctx.lineWidth = size * 0.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Main groove
    ctx.globalAlpha = 0.4 + pressure * 0.4;
    ctx.strokeStyle = tool.color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Edge highlight (V-cut light)
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.08 + pressure * 0.06;
    ctx.strokeStyle = "#d0c8b8";
    ctx.lineWidth = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(p1.x - 0.8, p1.y - 0.8);
    ctx.lineTo(p2.x - 0.8, p2.y - 0.8);
    ctx.stroke();

    // Depth shadow
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = pressure * 0.3;
    ctx.strokeStyle = "#1a1008";
    ctx.lineWidth = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(p1.x + 0.5, p1.y + 1);
    ctx.lineTo(p2.x + 0.5, p2.y + 1);
    ctx.stroke();

    ctx.restore();
  }

  private spawnDustParticles(x: number, y: number, pressure: number): void {
    const count = Math.floor(1 + pressure * 3);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1.5 + 0.5, // fall down
        size: Math.random() * 2 + 0.5,
        alpha: 0.3 + Math.random() * 0.3,
        life: 30 + Math.random() * 20,
      });
    }
  }

  private startParticleLoop(): void {
    const animate = () => {
      this.animFrame = requestAnimationFrame(animate);
      if (!this.ctx || this.particles.length === 0) return;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= 0.01;
        p.life -= 1;

        if (p.life <= 0 || p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = "#b0a898";
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
        this.ctx.restore();
      }
    };

    this.animFrame = requestAnimationFrame(animate);
  }
}
