/**
 * classicRenderer.ts — Classic World (2000s) renderer
 * Fountain pen with nib-angle width variation, ruled lines, ink pooling
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
import { getNibConfig, calculateInkOpacity } from "./fountainPen";
import { drawLineGuide, getLineGuideConfig } from "./lineGuide";

export class ClassicRenderer implements WorldRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: WorldRendererConfig | null = null;

  private currentPoints: StrokePoint[] = [];
  private currentTool: ToolConfig | null = null;
  private strokes: StrokeData[] = [];
  private animFrame = 0;
  private lineConfig = getLineGuideConfig();

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

    // Cream paper
    ctx.fillStyle = "#faf8f2";
    ctx.fillRect(0, 0, width, height);

    // Subtle paper texture
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.5;
      ctx.fillStyle = Math.random() > 0.5 ? "#a09080" : "#d0c8b8";
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 1;

    // Ruled lines
    drawLineGuide(ctx, width, height, this.lineConfig);
  }

  beginStroke(point: StrokePoint, tool: ToolConfig) {
    this.currentPoints = [point];
    this.currentTool = tool;
  }

  continueStroke(point: StrokePoint) {
    if (!this.ctx || !this.currentTool) return;
    this.currentPoints.push(point);

    const nib = getNibConfig(this.currentTool.id);
    const outline = getStrokeOutline(this.currentPoints, this.currentTool.id, this.currentTool.size);
    if (outline.length < 2) return;

    this.redrawAll();

    const { ctx } = this;

    // Calculate speed for ink opacity
    const pts = this.currentPoints;
    let speed = 0;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 1];
      const p2 = pts[pts.length - 2];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      speed = Math.sqrt(dx * dx + dy * dy);
    }

    const inkOpacity = calculateInkOpacity(point.pressure, speed, this.currentTool.opacity);
    ctx.globalAlpha = inkOpacity;
    ctx.fillStyle = nib.inkColor;
    const path = new Path2D(outlineToSvgPath(outline));
    ctx.fill(path);

    // Ink pool at start point (if pen dwells)
    if (pts.length > 1 && pts.length < 5) {
      const start = pts[0];
      ctx.beginPath();
      ctx.arc(start.x, start.y, 1.5 * start.pressure, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  endStroke(): StrokeData | null {
    if (this.currentPoints.length < 2 || !this.currentTool) {
      this.currentPoints = [];
      this.currentTool = null;
      return null;
    }

    const nib = getNibConfig(this.currentTool.id);
    const outline = getStrokeOutline(
      this.currentPoints,
      this.currentTool.id,
      this.currentTool.size
    );

    const stroke: StrokeData = {
      id: `classic_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tool: this.currentTool.id,
      points: [...this.currentPoints],
      outline,
      color: nib.inkColor,
      size: this.currentTool.size,
      opacity: this.currentTool.opacity,
      metadata: { world: "classic" },
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

  eraseStroke(strokeId: string, _style: EraseStyle) {
    // Clean erase — ink fades like blotting paper absorbing
    const idx = this.strokes.findIndex(s => s.id === strokeId);
    if (idx === -1) return;

    const target = this.strokes[idx];
    let frame = 0;
    const totalFrames = 10;

    const animate = () => {
      if (!this.ctx || !this.config) return;
      frame++;
      const t = frame / totalFrames;

      // Redraw without the target
      const remaining = this.strokes.filter(s => s.id !== strokeId);
      this.ctx.clearRect(0, 0, this.config.width, this.config.height);
      this.drawBackground();

      for (const s of remaining) {
        if (s.outline.length < 2) continue;
        this.ctx.globalAlpha = s.opacity;
        this.ctx.fillStyle = s.color;
        const path = new Path2D(outlineToSvgPath(s.outline));
        this.ctx.fill(path);
      }

      // Fading stroke
      this.ctx.globalAlpha = target.opacity * (1 - t);
      this.ctx.fillStyle = target.color;
      const path = new Path2D(outlineToSvgPath(target.outline));
      this.ctx.fill(path);
      this.ctx.globalAlpha = 1;

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
