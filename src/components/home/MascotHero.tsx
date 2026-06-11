"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * 메인 배너 마스코트.
 *
 * - 평소: mascot-idle.png (눈 뜬 표정)
 * - 클릭/탭: 하트가 퐁퐁 떠오르고 mascot-happy.png (웃는 표정)로 잠시 전환
 * - 두 이미지를 겹쳐두고 opacity로 전환해 깜빡임(깨짐) 없이 부드럽게 바뀐다.
 * - 누끼(투명 배경) PNG이므로 박스/테두리가 보이지 않도록
 *   배경·보더 없는 버튼 + drop-shadow 필터만 사용한다.
 */

interface Heart {
  id: number;
  /** 가로 시작 위치 (%) */
  left: number;
  /** 좌우로 흔들리는 정도 (px) */
  drift: number;
  /** 크기 배율 */
  scale: number;
  /** 시작 지연 (ms) */
  delay: number;
}

const HAPPY_DURATION_MS = 1500;
const HEART_LIFETIME_MS = 1900;
const HEARTS_PER_TAP = 7;

export default function MascotHero() {
  const [happy, setHappy] = useState(false);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const happyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    return () => {
      if (happyTimer.current) clearTimeout(happyTimer.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    const spawned: Heart[] = Array.from({ length: HEARTS_PER_TAP }, () => ({
      id: nextId.current++,
      left: 18 + Math.random() * 64,
      drift: (Math.random() - 0.5) * 60,
      scale: 0.6 + Math.random() * 0.8,
      delay: Math.random() * 220,
    }));

    setHearts((current) => [...current, ...spawned]);
    setHappy(true);

    if (happyTimer.current) clearTimeout(happyTimer.current);
    happyTimer.current = setTimeout(() => setHappy(false), HAPPY_DURATION_MS);

    const spawnedIds = new Set(spawned.map((heart) => heart.id));
    setTimeout(() => {
      setHearts((current) => current.filter((heart) => !spawnedIds.has(heart.id)));
    }, HEART_LIFETIME_MS + 250);
  }, []);

  return (
    <button
      type="button"
      className={`mascot-hero${happy ? " mascot-hero--happy" : ""}`}
      onClick={handleTap}
      aria-label="마스코트 쓰다듬기. 누르면 하트와 함께 웃어줘요."
    >
      <span className="mascot-hero__hearts" aria-hidden="true">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="mascot-hero__heart"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.delay}ms`,
              ["--heart-drift" as string]: `${heart.drift}px`,
              ["--heart-scale" as string]: heart.scale,
            }}
          >
            ❤️
          </span>
        ))}
      </span>

      <span className="mascot-hero__stack">
        <Image
          src="/mascot/mascot-idle.png"
          alt=""
          width={351}
          height={393}
          className="mascot-hero__face mascot-hero__face--idle"
          sizes="(max-width: 720px) 58vw, 420px"
          priority
        />
        <Image
          src="/mascot/mascot-happy.png"
          alt=""
          width={396}
          height={432}
          className="mascot-hero__face mascot-hero__face--happy"
          sizes="(max-width: 720px) 58vw, 420px"
          priority
        />
      </span>
    </button>
  );
}
