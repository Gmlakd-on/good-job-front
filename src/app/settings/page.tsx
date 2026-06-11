"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toggle, CTABtn, MenuRow } from "./_components/SettingsControls";

interface UserSettings {
  language: string;
  notif_exchange_reply: boolean;
  notif_friend_request: boolean;
  notif_random_exchange: boolean;
  notif_quote_approval: boolean;
  notif_owner_comment: boolean;
  notif_collection_update: boolean;
  diary_visibility: string;
  autosave: boolean;
  exchange_friend_allowed: boolean;
  exchange_random_allowed: boolean;
}

interface Profile { nickname: string; bio: string; email: string }

type Section = "profile" | "notifications" | "language" | "diary" | "exchange" | "quote" | "inquiry" | "account";

const SECTIONS: { key: Section; icon: string; label: string }[] = [
  { key: "profile",       icon: "👤", label: "나의 정보" },
  { key: "notifications", icon: "🔔", label: "소식 알림" },
  { key: "language",      icon: "🌐", label: "언어" },
  { key: "diary",         icon: "📒", label: "내 일기장" },
  { key: "exchange",      icon: "📮", label: "교환일기" },
  { key: "quote",         icon: "💬", label: "명언 보내기" },
  { key: "inquiry",       icon: "📨", label: "운영진 문의" },
  { key: "account",       icon: "⚙️", label: "계정" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState<Section | null>(null); // null = 목록
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [profile, setProfile] = useState<Profile>({ nickname: "", bio: "", email: "" });
  const [settings, setSettings] = useState<UserSettings>({
    language: "ko", notif_exchange_reply: true, notif_friend_request: true,
    notif_random_exchange: true, notif_quote_approval: true, notif_owner_comment: true,
    notif_collection_update: false, diary_visibility: "private", autosave: true,
    exchange_friend_allowed: true, exchange_random_allowed: false,
  });
  const [quoteText, setQuoteText] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [quoteIsOriginal, setQuoteIsOriginal] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState("");
  const [mySubmissions, setMySubmissions] = useState<{ id: string; quote_text: string; status: string }[]>([]);
  const [inqCategory, setInqCategory] = useState("general");
  const [inqTitle, setInqTitle] = useState("");
  const [inqContent, setInqContent] = useState("");
  const [inqMsg, setInqMsg] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    const [pr, sr, qr] = await Promise.all([
      fetch("/api/profile"), fetch("/api/settings"), fetch("/api/quote-submissions"),
    ]);
    if (pr.ok) { const d = await pr.json(); setProfile({ nickname: d.profile?.nickname || "", bio: d.profile?.bio || "", email: user.email || "" }); }
    if (sr.ok) { const d = await sr.json(); if (d.settings) setSettings((p) => ({ ...p, ...d.settings })); }
    if (qr.ok) { const d = await qr.json(); setMySubmissions(d.submissions || []); }
  }, [router]);

  // 마운트 시 1회 초기 데이터 로드 — 비동기 fetch 후 상태 반영 패턴
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const toast = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2000); };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    setSettings((p) => ({ ...p, ...updates }));
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    toast("저장됐어요 ✓");
    setSaving(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: profile.nickname, bio: profile.bio }) });
    toast("저장됐어요 ✓");
    setSaving(false);
  };

  const submitQuote = async () => {
    if (!quoteText.trim()) { setQuoteMsg("명언 내용을 입력해주세요."); return; }
    const res = await fetch("/api/quote-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quote_text: quoteText, author: quoteAuthor, source: quoteSource, is_original: quoteIsOriginal }) });
    if (res.ok) { setQuoteMsg("등록 요청이 접수됐어요! 검토 후 알림을 드려요."); setQuoteText(""); setQuoteAuthor(""); setQuoteSource(""); setQuoteIsOriginal(false); load(); }
    else setQuoteMsg("제출에 실패했어요.");
  };

  const submitInquiry = async () => {
    if (!inqTitle.trim() || !inqContent.trim()) { setInqMsg("제목과 내용을 입력해주세요."); return; }
    const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: inqCategory, title: inqTitle, content: inqContent }) });
    if (res.ok) { setInqMsg("문의가 접수됐어요."); setInqTitle(""); setInqContent(""); }
    else setInqMsg("접수에 실패했어요.");
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const statusLabel: Record<string, string> = { pending: "검토 중", approved: "승인됨", rejected: "반려됨", published: "노출됨" };
  const statusBg: Record<string, string> = { pending: "rgba(196,160,84,0.15)", approved: "rgba(126,155,114,0.15)", rejected: "rgba(196,85,58,0.1)", published: "rgba(90,110,138,0.15)" };

  // 공통 스타일
  const cardStyle: React.CSSProperties = {
    borderRadius: "20px",
    padding: "20px",
    background: "var(--paper-white)",
    boxShadow: "var(--shadow-card)",
    border: "1px solid var(--border-hairline)",
    marginBottom: "12px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    background: "var(--paper-aged)",
    color: "var(--ink-dark)",
    border: "1px solid var(--border-subtle)",
    marginBottom: "12px",
    boxSizing: "border-box",
  };
  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid var(--border-hairline)",
  };

  // 뒤로가기 핸들러
  const back = () => {
    if (active) setActive(null);
    else router.push("/");
  };

  return (
    <div style={{ background: "var(--paper-cream)", minHeight: "100dvh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* 공통 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(249,243,232,0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-hairline)",
          padding: "0 16px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={back}
          style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--text-secondary)", padding: "0 4px", WebkitTapHighlightColor: "transparent" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          {active ? SECTIONS.find((s) => s.key === active)?.label : "홈"}
        </button>

        <h1
          style={{
            fontFamily: "Noto Serif KR, serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--ink-dark)",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          설정
        </h1>

        {saveMsg && (
          <span style={{ fontSize: "12px", color: "var(--cloth-sage)", fontWeight: 500 }}>{saveMsg}</span>
        )}
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "12px 16px 80px" }}>

        {/* ── 섹션 목록 (active가 null일 때) ── */}
        {!active && (
          <div style={cardStyle}>
            {SECTIONS.map(({ key, icon, label }, i) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 4px",
                  borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--border-hairline)" : "none",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "52px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px", width: "28px", textAlign: "center" }}>{icon}</span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-dark)" }}>{label}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--ink-ghost)", flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        )}

        {/* ── 나의 정보 ── */}
        {active === "profile" && (
          <div style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>{profile.email}</p>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>닉네임</label>
            <input value={profile.nickname} onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))} placeholder="닉네임을 입력해주세요" style={inputStyle} />
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>한 줄 소개</label>
            <input value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="짧게 소개해주세요" style={inputStyle} />
            <CTABtn onClick={saveProfile} loading={saving} label="저장하기" />
          </div>
        )}

        {/* ── 소식 알림 ── */}
        {active === "notifications" && (
          <div style={cardStyle}>
            {[
              { key: "notif_exchange_reply", label: "교환일기 답장 알림" },
              { key: "notif_friend_request", label: "친구 요청 알림" },
              { key: "notif_random_exchange", label: "랜덤 교환 알림" },
              { key: "notif_quote_approval", label: "명언 승인/반려 알림" },
              { key: "notif_owner_comment", label: "주인장 코멘트 알림" },
              { key: "notif_collection_update", label: "도감 업데이트 알림" },
            ].map(({ key, label }) => (
              <div key={key} style={rowStyle}>
                <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>{label}</span>
                <Toggle value={settings[key as keyof UserSettings] as boolean} onChange={(v) => saveSettings({ [key]: v } as Partial<UserSettings>)} />
              </div>
            ))}
          </div>
        )}

        {/* ── 언어 ── */}
        {active === "language" && (
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>선택한 언어는 계정에 저장돼요.</p>
            {[{ val: "ko", flag: "🇰🇷", name: "한국어" }, { val: "en", flag: "🇺🇸", name: "English" }].map(({ val, flag, name }) => (
              <button
                key={val}
                onClick={() => saveSettings({ language: val })}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: 500,
                  background: settings.language === val ? "rgba(196,85,58,0.08)" : "var(--paper-aged)",
                  border: `1px solid ${settings.language === val ? "var(--stamp-vermilion)" : "transparent"}`,
                  color: "var(--ink-dark)",
                  minHeight: "52px",
                  WebkitTapHighlightColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <span>{flag} {name}</span>
                {settings.language === val && <span style={{ color: "var(--stamp-vermilion)", fontSize: "18px" }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── 내 일기장 ── */}
        {active === "diary" && (
          <div style={cardStyle}>
            <div style={rowStyle}>
              <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>자동 저장</span>
              <Toggle value={settings.autosave} onChange={(v) => saveSettings({ autosave: v })} />
            </div>
            <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: "15px", color: "var(--ink-body)", marginBottom: "10px" }}>일기 공개 범위</p>
              <select value={settings.diary_visibility} onChange={(e) => saveSettings({ diary_visibility: e.target.value })}
                style={{ ...inputStyle, marginBottom: 0 }}>
                <option value="private">나만 보기</option>
                <option value="friends">친구 공개</option>
                <option value="public">전체 공개</option>
              </select>
            </div>
            <MenuRow label="📥 내 일기 다운로드" onClick={() => {}} />
            <MenuRow label="🗑️ 삭제한 일기 복구" onClick={() => {}} last />
          </div>
        )}

        {/* ── 교환일기 ── */}
        {active === "exchange" && (
          <div style={cardStyle}>
            <div style={rowStyle}>
              <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>친구 교환 허용</span>
              <Toggle value={settings.exchange_friend_allowed} onChange={(v) => saveSettings({ exchange_friend_allowed: v })} />
            </div>
            <div style={rowStyle}>
              <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>랜덤 교환 허용</span>
              <Toggle value={settings.exchange_random_allowed} onChange={(v) => saveSettings({ exchange_random_allowed: v })} />
            </div>
            <MenuRow label="차단한 사용자 관리 →" onClick={() => router.push("/exchange")} color="var(--cloth-indigo)" last />
          </div>
        )}

        {/* ── 명언 보내기 ── */}
        {active === "quote" && (
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              등록 요청한 명언은 운영진 검토 후 배너에 노출돼요.
            </p>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>명언 문장 *</label>
            <textarea value={quoteText} onChange={(e) => setQuoteText(e.target.value)} rows={3} placeholder="명언을 입력해주세요"
              style={{ ...inputStyle, resize: "none" }} />
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>작성자</label>
            <input value={quoteAuthor} onChange={(e) => setQuoteAuthor(e.target.value)} placeholder="예: 에이브러햄 링컨" style={inputStyle} />
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>출처 / 비고</label>
            <input value={quoteSource} onChange={(e) => setQuoteSource(e.target.value)} placeholder="책 이름 또는 출처 (선택)" style={inputStyle} />
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer", minHeight: "44px" }}>
              <input type="checkbox" checked={quoteIsOriginal} onChange={(e) => setQuoteIsOriginal(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--stamp-vermilion)" }} />
              <span style={{ fontSize: "14px", color: "var(--ink-body)" }}>직접 작성한 문장이에요</span>
            </label>
            {quoteMsg && (
              <p style={{ fontSize: "13px", marginBottom: "12px", color: quoteMsg.includes("실패") ? "var(--stamp-vermilion)" : "var(--cloth-sage)" }}>{quoteMsg}</p>
            )}
            <CTABtn onClick={submitQuote} label="등록 요청 보내기" />

            {mySubmissions.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>내 제출 목록</p>
                {mySubmissions.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                    <p style={{ fontSize: "13px", flex: 1, marginRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-body)" }}>{s.quote_text}</p>
                    <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: statusBg[s.status] || "var(--paper-aged)", color: "var(--ink-body)", flexShrink: 0, fontWeight: 500 }}>
                      {statusLabel[s.status] || s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 운영진 문의 ── */}
        {active === "inquiry" && (
          <div style={cardStyle}>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>문의 유형</label>
            <select value={inqCategory} onChange={(e) => setInqCategory(e.target.value)} style={inputStyle}>
              <option value="bug">오류 제보</option>
              <option value="feature">기능 제안</option>
              <option value="quote">명언 관련 문의</option>
              <option value="report_block">신고/차단 문의</option>
              <option value="account">계정 문의</option>
              <option value="general">기타 문의</option>
            </select>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>제목</label>
            <input value={inqTitle} onChange={(e) => setInqTitle(e.target.value)} placeholder="문의 제목" style={inputStyle} />
            <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>내용</label>
            <textarea value={inqContent} onChange={(e) => setInqContent(e.target.value)} rows={5} placeholder="자세하게 적어주세요"
              style={{ ...inputStyle, resize: "none" }} />
            {inqMsg && <p style={{ fontSize: "13px", marginBottom: "12px", color: inqMsg.includes("실패") ? "var(--stamp-vermilion)" : "var(--cloth-sage)" }}>{inqMsg}</p>}
            <CTABtn onClick={submitInquiry} label="문의 보내기" />
          </div>
        )}

        {/* ── 계정 ── */}
        {active === "account" && (
          <div style={cardStyle}>
            <MenuRow label="로그아웃" onClick={handleLogout} color="var(--stamp-vermilion)" />
            <MenuRow label="이용약관" onClick={() => router.push("/terms")} />
            <MenuRow label="개인정보 처리방침" onClick={() => router.push("/privacy")} />
            <div style={{ marginTop: "24px" }}>
              <MenuRow
                label="계정 탈퇴"
                onClick={async () => {
                  if (!confirm("정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.")) return;
                  const res = await fetch("/api/account", { method: "DELETE" });
                  if (res.ok) { await createClient().auth.signOut(); router.push("/"); }
                }}
                color="rgba(196,85,58,0.5)"
                last
              />
            </div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "var(--ink-ghost)", marginTop: "24px" }}>참 잘했어요 v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
