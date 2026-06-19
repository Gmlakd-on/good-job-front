"use client";

import { useEffect, useState } from "react";
import {
  getBgmSnapshot,
  pauseBgm,
  playBgm,
  playNextBgm,
  playPreviousBgm,
  stopBgm,
  subscribeBgm,
  type BgmSnapshot,
} from "@/lib/editor/bgmEngine";

export default function BgmPlayer() {
  const [snapshot, setSnapshot] = useState<BgmSnapshot>(() => getBgmSnapshot());

  useEffect(() => {
    return subscribeBgm(() => setSnapshot(getBgmSnapshot()));
  }, []);

  useEffect(() => {
    return () => stopBgm();
  }, []);

  const handleToggle = () => {
    if (snapshot.isPlaying) {
      pauseBgm();
      return;
    }

    void playBgm();
  };

  return (
    <div className="bgm-player" aria-label="일기 작성 BGM 플레이어">
      <div className="bgm-player__controls">
        <button
          type="button"
          className="bgm-player__btn"
          onClick={playPreviousBgm}
          aria-label="이전 BGM"
          title="이전 BGM"
        >
          ⏮
        </button>
        <button
          type="button"
          className="bgm-player__btn bgm-player__btn--primary"
          onClick={handleToggle}
          aria-label={snapshot.isPlaying ? "BGM 정지" : "BGM 재생"}
          title={snapshot.isPlaying ? "BGM 정지" : "BGM 재생"}
        >
          {snapshot.isPlaying ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          className="bgm-player__btn"
          onClick={playNextBgm}
          aria-label="다음 BGM"
          title="다음 BGM"
        >
          ⏭
        </button>
      </div>

      <div className="bgm-player__title-window" aria-live="polite">
        <div className="bgm-player__title-track">
          <span>♪ {snapshot.currentTrack.title}</span>
          <span aria-hidden="true">♪ {snapshot.currentTrack.title}</span>
        </div>
      </div>

      <style>{`
        .bgm-player {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          max-width: 260px;
          height: 32px;
          padding: 3px 8px 3px 5px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.46);
          color: inherit;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }

        .bgm-player__controls {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex: 0 0 auto;
        }

        .bgm-player__btn {
          width: 25px;
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 11px;
          line-height: 1;
          opacity: 0.62;
          transition: opacity var(--duration-fast), background var(--duration-fast), transform var(--duration-fast);
        }

        .bgm-player__btn:hover {
          opacity: 0.92;
          background: rgba(0, 0, 0, 0.06);
        }

        .bgm-player__btn:active {
          transform: scale(0.94);
        }

        .bgm-player__btn--primary {
          opacity: 0.82;
          background: rgba(0, 0, 0, 0.06);
        }

        .bgm-player__title-window {
          position: relative;
          flex: 1 1 auto;
          min-width: 78px;
          max-width: 138px;
          overflow: hidden;
          white-space: nowrap;
          mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
        }

        .bgm-player__title-track {
          display: inline-flex;
          width: max-content;
          animation: bgm-title-marquee 13s linear infinite;
          will-change: transform;
        }

        .bgm-player__title-track span {
          display: inline-block;
          padding-right: 28px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.02em;
          opacity: 0.72;
        }

        @keyframes bgm-title-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .bgm-player__title-track {
            animation: none;
          }
        }

        @media (max-width: 767px) {
          .editor-toolbar {
            gap: 8px;
            justify-content: flex-start;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .editor-toolbar::-webkit-scrollbar {
            display: none;
          }

          .editor-toolbar__tools,
          .editor-toolbar__actions {
            flex: 0 0 auto;
          }

          .bgm-player {
            max-width: 176px;
            height: 38px;
            padding-right: 9px;
          }

          .bgm-player__btn {
            width: 31px;
            height: 31px;
            font-size: 12px;
          }

          .bgm-player__title-window {
            max-width: 60px;
          }
        }
      `}</style>
    </div>
  );
}
