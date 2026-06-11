"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { KitschRenderer } from "./pop-kitsch/kitschRenderer";


interface KitschWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const KitschWorld = forwardRef<WorldComponentHandle, KitschWorldProps>(
  function KitschWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<KitschRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new KitschRenderer();
      rendererRef.current = renderer;

      const config: WorldRendererConfig = {
        id: "1980",
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

export default KitschWorld;
