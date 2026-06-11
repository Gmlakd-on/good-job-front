"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import SocialAuthPanel from "./SocialAuthPanel";

type AuthMode = "login" | "signup";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  next?: string;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModal({ open, mode, next, onClose, onModeChange }: AuthModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="auth-modal__backdrop" role="presentation" onClick={onClose}>
      <div
        className="auth-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "로그인" : "회원가입"}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <SocialAuthPanel mode={mode} next={next} onModeChange={onModeChange} />
      </div>
    </div>,
    document.body,
  );
}
