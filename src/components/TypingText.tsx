"use client";

import { useEffect, useState } from "react";

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
}

export default function TypingText(props: TypingTextProps) {
  // text가 바뀌면 내부 컴포넌트를 다시 만들어 타이핑 상태를 안전하게 초기화한다.
  return <TypingTextInner key={props.text} {...props} />;
}

function TypingTextInner({ text, speed = 40, onComplete }: TypingTextProps) {
  const [index, setIndex] = useState(0);
  const done = index >= text.length;

  useEffect(() => {
    if (done) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [done, index, onComplete, speed]);

  return (
    <span>
      {text.slice(0, index)}
      {!done && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ background: "var(--soft-accent)", verticalAlign: "text-bottom" }}
        />
      )}
    </span>
  );
}
