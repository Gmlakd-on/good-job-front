"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { StoneRenderer } from "./stone/stoneRenderer";


interface StoneWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const StoneWorld = forwardRef<WorldComponentHandle, StoneWorldProps>(
  function StoneWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<StoneRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new StoneRenderer();
      rendererRef.current = renderer;

      const config: WorldRendererConfig = {
        id: "stone",
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

export default StoneWorld;
