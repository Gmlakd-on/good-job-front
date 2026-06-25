"use client";

import { useCallback, useEffect, useState } from "react";

const NEWS_ID = "chami-care-widget-2026-06-26";
const STORAGE_KEY = "chami-home-news-dismissed-id";

export default function HomeNewsPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(STORAGE_KEY) !== NEWS_ID);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, NEWS_ID);
    } catch {
      // localStorage를 사용할 수 없는 환경에서도 닫기 동작은 유지합니다.
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, open]);

  if (!open) return null;

  return (
    <div className="home-news-popup" role="dialog" aria-modal="true" aria-labelledby="home-news-popup-title">
      <button type="button" className="home-news-popup__backdrop" aria-label="닫기" onClick={dismiss} />
      <section className="home-news-popup__card">
        <button type="button" className="home-news-popup__close" aria-label="닫기" onClick={dismiss}>
          <span aria-hidden="true">×</span>
        </button>

        <div className="home-news-popup__icon" aria-hidden="true">
          <span>🌱</span>
        </div>

        <p className="home-news-popup__eyebrow">NEW!</p>
        <h2 id="home-news-popup-title">참이 돌봄 위젯</h2>
        <p className="home-news-popup__description">
          먹이 주기, 놀아주기, 씻기기, 재우기, 미니게임까지 가볍게 즐겨보세요
        </p>
      </section>
    </div>
  );
}
