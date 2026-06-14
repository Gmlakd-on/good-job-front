# 참 잘했어요 — Frontend

Next.js 16 + TypeScript + Tailwind CSS v4. **Vercel 배포.**

## 역할

- 화면(UI) 전부: 홈, 일기 작성, 책장, 교환일기, 알림, 설정, 관리자 화면
- Supabase **브라우저 인증** (Google OAuth, 이메일 가입/로그인, 비밀번호 재설정)
- `/auth/callback` 라우트 핸들러 (OAuth/이메일 확인 콜백 — 쿠키가 이 도메인에 설정되어야 하므로 프론트에 위치)
- `/api/*` 요청은 `next.config.ts` rewrites가 백엔드로 프록시
