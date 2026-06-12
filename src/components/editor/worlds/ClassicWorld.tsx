"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { ClassicRenderer } from "./classic-minimal/classicRenderer";


interface ClassicWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const ClassicWorld = forwardRef<WorldComponentHandle, ClassicWorldProps>(
  function ClassicWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<ClassicRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new ClassicRenderer();
      rendererRef.current = renderer;

      const config: WorldRendererConfig = {
        id: "1950",
        width,
        height,
        devicePixelRatio,
      };

      renderer.init(canvasRef.current, config);

      return () => {
        renderer.destroy();
        rendererRef.current = null;
      };
    }, [width, height, devicePixelRatio]);

    return (
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      />
    );
  }
);

export default ClassicWorld;
