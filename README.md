# 참 잘했어요 — Frontend

Next.js 16 + TypeScript + Tailwind CSS v4. **Vercel 배포.**

## 역할

- 화면(UI) 전부: 홈, 일기 작성, 책장, 교환일기, 알림, 설정, 관리자 화면
- Supabase **브라우저 인증** (Google OAuth, 이메일 가입/로그인, 비밀번호 재설정)
- `/auth/callback` 라우트 핸들러 (OAuth/이메일 확인 콜백 — 쿠키가 이 도메인에 설정되어야 하므로 프론트에 위치)
- `/api/*` 요청은 `next.config.ts` rewrites가 백엔드로 프록시

## 환경 변수 (`.env.example` 참고)

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable 키 (브라우저 안전) |
| `API_BASE_URL` | 백엔드 주소. 로컬 `http://localhost:3001`, 프로덕션은 백엔드 Vercel 도메인 |
| `NEXT_PUBLIC_SITE_URL` | 프론트 배포 도메인 (sitemap/OG) |

## 마스코트 인터랙션

- `src/components/home/MascotHero.tsx` — 클릭/탭하면 하트가 떠오르며 웃는 표정(`mascot-happy.png`)으로 전환
- 이미지는 진짜 알파 채널을 가진 누끼 PNG(`public/mascot/`)로 재가공되어 박스/테두리가 보이지 않음
- 그림자는 `drop-shadow` 필터만 사용(박스섀도 금지), 모바일 탭 하이라이트 제거, `prefers-reduced-motion` 대응

## 명령어

```bash
pnpm dev          # 개발 서버 (3000)
pnpm check        # typecheck + lint(--max-warnings=0)
pnpm build        # 프로덕션 빌드
pnpm test:e2e     # Playwright E2E
```
