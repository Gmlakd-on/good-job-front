"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { Stroke, WorldConfig, ToolType } from "@/lib/editor/editorTypes";

interface DrawingCanvasProps {
  world: WorldConfig;
  selectedTool: ToolType;
  strokes: Stroke[];
  onStroke: (stroke: Stroke) => void;
  onErase: (strokeId: string) => void;
  width: number;
  height: number;
}

export default function DrawingCanvas({
  world,
  selectedTool,
  strokes,
  onStroke,
  onErase,
  width,
  height,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<Stroke | null>(null);

  const getTool = useCallback(() => {
    return world.tools.find((t) => t.id === selectedTool) || world.tools[0];
  }, [world, selectedTool]);

  // Redraw all strokes
  const redrawAll = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Apply world texture
    applyWorldTexture(ctx, world, width, height);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke, world);
    }
  }, [strokes, world, width, height]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  function getPointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure || 0.5,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const pos = getPointerPos(e);
    const tool = getTool();

    if (selectedTool === "eraser") {
      // Find and erase stroke near this point
      const hit = findStrokeAt(pos.x, pos.y, strokes);
      if (hit) onErase(hit);
      return;
    }

    const stroke: Stroke = {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tool: selectedTool,
      points: [pos],
      color: tool.color || "#000",
      size: tool.size || 2,
      opacity: tool.opacity || 1,
      timestamp: Date.now(),
    };

    currentStroke.current = stroke;
    setIsDrawing(true);

    // Draw preview on overlay
    const octx = overlayRef.current?.getContext("2d");
    if (octx) {
      octx.clearRect(0, 0, width, height);
      drawStrokePoint(octx, pos, stroke, world);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentStroke.current) return;
    e.preventDefault();

    const pos = getPointerPos(e);
    currentStroke.current.points.push(pos);

    const octx = overlayRef.current?.getContext("2d");
    if (octx) {
      const pts = currentStroke.current.points;
      if (pts.length >= 2) {
        drawStrokeSegment(
          octx,
          pts[pts.length - 2],
          pts[pts.length - 1],
          currentStroke.current,
          world
        );
      }
    }
  }

  function handlePointerUp() {
    if (!currentStroke.current) return;

    if (currentStroke.current.points.length >= 2) {
      onStroke(currentStroke.current);
    }

    currentStroke.current = null;
    setIsDrawing(false);

    const octx = overlayRef.current?.getContext("2d");
    if (octx) octx.clearRect(0, 0, width, height);
  }

  return (
    <div className="drawing-canvas-wrap" style={{ position: "relative", width: "100%", aspectRatio: `${width}/${height}` }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <canvas
        ref={overlayRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          touchAction: "none", cursor: selectedTool === "eraser" ? "cell" : "crosshair",
        }}
      />
    </div>
  );
}

// ─── Drawing functions with per-world physics ───

function applyWorldTexture(ctx: CanvasRenderingContext2D, world: WorldConfig, w: number, h: number) {
  if (!world.bgStyle.texture) return;

  ctx.save();
  ctx.globalAlpha = 0.06;

  // Noise-based texture simulation
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  const seed = world.id === "stone" ? 42 : world.id === "archive" ? 137 : 89;

  for (let i = 0; i < data.length; i += 4) {
    const noise = ((Math.sin(i * seed * 0.00001) * 43758.5453) % 1) * 255;
    const grain = world.id === "stone" ? noise * 0.8 : world.id === "archive" ? noise * 0.4 : noise * 0.3;
    data[i] = grain;
    data[i + 1] = grain;
    data[i + 2] = grain;
    data[i + 3] = world.id === "stone" ? 25 : 12;
  }

  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, world: WorldConfig) {
  if (stroke.points.length < 2) return;

  for (let i = 1; i < stroke.points.length; i++) {
    drawStrokeSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke, world);
  }
}

function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number; pressure: number },
  p2: { x: number; y: number; pressure: number },
  stroke: Stroke,
  world: WorldConfig
) {
  ctx.save();

  const pressure = world.canvasStyle?.pressureSensitive ? p2.pressure : 0.5;
  const size = stroke.size * (0.5 + pressure * 1.2);

  if (world.canvasStyle?.compositeOp) {
    ctx.globalCompositeOperation = world.canvasStyle.compositeOp;
  }

  switch (world.canvasStyle?.textureOverlay) {
    case "engrave":
      drawEngrave(ctx, p1, p2, stroke, size, pressure);
      break;
    case "ink-bleed":
      drawInkBleed(ctx, p1, p2, stroke, size, pressure);
      break;
    case "pencil-grain":
      drawPencilGrain(ctx, p1, p2, stroke, size, pressure);
      break;
    default:
      drawDefault(ctx, p1, p2, stroke, size);
  }

  ctx.restore();
}

function drawStrokePoint(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; pressure: number },
  stroke: Stroke,
  _world: WorldConfig
) {
  ctx.save();
  const size = stroke.size * (0.5 + p.pressure * 1.2);
  ctx.globalAlpha = stroke.opacity * 0.6;
  ctx.fillStyle = stroke.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Stone: engraving effect — scratchy lines with depth
function drawEngrave(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number; pressure: number },
  p2: { x: number; y: number; pressure: number },
  stroke: Stroke,
  size: number,
  pressure: number
) {
  // Main groove
  ctx.globalAlpha = stroke.opacity * (0.5 + pressure * 0.5);
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Depth shadow (darker inner line)
  ctx.globalAlpha = pressure * 0.4;
  ctx.strokeStyle = "#2a2018";
  ctx.lineWidth = size * 0.4;
  ctx.beginPath();
  ctx.moveTo(p1.x + 0.5, p1.y + 0.8);
  ctx.lineTo(p2.x + 0.5, p2.y + 0.8);
  ctx.stroke();

  // Chip particles
  if (Math.random() < 0.3) {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#b0a898";
    const ox = (Math.random() - 0.5) * size * 3;
    const oy = (Math.random() - 0.5) * size * 3;
    ctx.fillRect(p2.x + ox, p2.y + oy, Math.random() * 2 + 1, Math.random() * 2 + 1);
  }
}

// Archive: ink bleed — wet brush on hanji paper
function drawInkBleed(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number; pressure: number },
  p2: { x: number; y: number; pressure: number },
  stroke: Stroke,
  size: number,
  pressure: number
) {
  // Outer bleed (wet ink spreading)
  ctx.globalAlpha = stroke.opacity * 0.15;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = size * 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Main stroke
  ctx.globalAlpha = stroke.opacity * (0.6 + pressure * 0.4);
  ctx.lineWidth = size * (0.8 + pressure * 0.8);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Ink pooling at pressure points
  if (pressure > 0.7 && Math.random() < 0.4) {
    ctx.globalAlpha = stroke.opacity * 0.2;
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Sketch: pencil grain — grainy lines with paper texture interaction
function drawPencilGrain(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number; pressure: number },
  p2: { x: number; y: number; pressure: number },
  stroke: Stroke,
  size: number,
  pressure: number
) {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const steps = Math.max(1, Math.ceil(dist / 1.5));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    // Paper grain interaction — some dots skip based on position hash
    const grain = Math.sin(x * 0.5) * Math.cos(y * 0.7);
    if (grain > 0.3 && pressure < 0.5) continue; // Light strokes skip paper bumps

    ctx.globalAlpha = stroke.opacity * (0.3 + pressure * 0.6) * (0.7 + Math.random() * 0.3);
    ctx.fillStyle = stroke.color;

    const dotSize = size * (0.4 + pressure * 0.6) * (0.8 + Math.random() * 0.4);
    ctx.beginPath();
    ctx.arc(
      x + (Math.random() - 0.5) * size * 0.3,
      y + (Math.random() - 0.5) * size * 0.3,
      dotSize / 2, 0, Math.PI * 2
    );
    ctx.fill();
  }
}

// Default smooth line
function drawDefault(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number; pressure: number },
  p2: { x: number; y: number; pressure: number },
  stroke: Stroke,
  size: number
) {
  ctx.globalAlpha = stroke.opacity;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function findStrokeAt(x: number, y: number, strokes: Stroke[]): string | null {
  const threshold = 12;
  for (let i = strokes.length - 1; i >= 0; i--) {
    for (const pt of strokes[i].points) {
      if (Math.abs(pt.x - x) < threshold && Math.abs(pt.y - y) < threshold) {
        return strokes[i].id;
      }
    }
  }
  return null;
}
