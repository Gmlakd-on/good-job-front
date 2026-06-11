"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { WorldRendererConfig, WorldComponentHandle } from "@/lib/editor/worldInterface";
import { ArchiveRenderer } from "./archive/archiveRenderer";


interface ArchiveWorldProps {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

const ArchiveWorld = forwardRef<WorldComponentHandle, ArchiveWorldProps>(
  function ArchiveWorld({ width, height, devicePixelRatio = 1 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<ArchiveRenderer | null>(null);

    useImperativeHandle(ref, () => ({
      get renderer() { return rendererRef.current; },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const renderer = new ArchiveRenderer();
      rendererRef.current = renderer;

      const config: WorldRendererConfig = {
        id: "archive",
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

export default ArchiveWorld;
