"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig as Config, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { SketchRenderer } from "./sketch/sketchRenderer";


interface SketchWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const SketchWorld = forwardRef<WorldComponentHandle, SketchWorldProps>(
  function SketchWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<SketchRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new SketchRenderer();
      rendererRef.current = renderer;

      const config: Config = {
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

export default SketchWorld;
