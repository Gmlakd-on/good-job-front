"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { MinimalRenderer } from "./classic-minimal/minimalRenderer";


interface MinimalWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const MinimalWorld = forwardRef<WorldComponentHandle, MinimalWorldProps>(
  function MinimalWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<MinimalRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new MinimalRenderer();
      rendererRef.current = renderer;

      const config: WorldRendererConfig = {
        id: "2010",
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

export default MinimalWorld;
