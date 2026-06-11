"use client";

/**
 * 설정 화면.
 * 변경점:
 * - 데스크톱(≥1024px): 사이드바 + 내용 2단 레이아웃. 목록→상세로 들어갔다 나오는 depth 제거.
 * - 모바일(<1024px): 기존처럼 목록 → 상세 흐름 유지 (data-view로 CSS 제어, ui-overrides.css 참고).
 * - 언어: useI18n().setLanguage 사용 → 화면이 즉시 번역되고 계정에도 저장됨 (기존: 저장만 되고 화면 무반응).
 * - 모든 라벨이 i18n 사전을 통해 한국어/영어로 전환됨.
 */
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey, Language } from "@/lib/i18n/dictionary";
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

const SECTIONS: { key: Section; icon: string; labelKey: DictKey }[] = [
  { key: "profile",       icon: "👤", labelKey: "settings.section.profile" },
  { key: "notifications", icon: "🔔", labelKey: "settings.section.notifications" },
  { key: "language",      icon: "🌐", labelKey: "settings.section.language" },
  { key: "diary",         icon: "📒", labelKey: "settings.section.diary" },
  { key: "exchange",      icon: "📮", labelKey: "settings.section.exchange" },
  { key: "quote",         icon: "💬", labelKey: "settings.section.quote" },
  { key: "inquiry",       icon: "📨", labelKey: "settings.section.inquiry" },
  { key: "account",       icon: "⚙️", labelKey: "settings.section.account" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const [active, setActive] = useState<Section | null>(null); // 모바일: null = 목록
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

  // 마운트 시 1회 초기 데이터 로드
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // 데스크톱은 사이드바+내용 동시 표시라 기본 섹션을 펼쳐둔다
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setActive((prev) => prev ?? "profile");
    }
  }, []);

  const toast = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 2000); };

  const saveSettings = async (updates: Partial<UserSettings>) => {
    setSaving(true);
    setSettings((p) => ({ ...p, ...updates }));
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    toast(t("settings.saved"));
    setSaving(false);
  };

  // 언어는 i18n 컨텍스트를 통해 변경 → 화면 즉시 번역 + 계정 저장
  const changeLanguage = async (lang: Language) => {
    setSettings((p) => ({ ...p, language: lang }));
    await setLanguage(lang);
    toast(t("settings.saved"));
  };

  const saveProfile = async () => {
    setSaving(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nickname: profile.nickname, bio: profile.bio }) });
    toast(t("settings.saved"));
    setSaving(false);
  };

  const submitQuote = async () => {
    if (!quoteText.trim()) { setQuoteMsg(t("settings.quote.needText")); return; }
    const res = await fetch("/api/quote-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quote_text: quoteText, author: quoteAuthor, source: quoteSource, is_original: quoteIsOriginal }) });
    if (res.ok) { setQuoteMsg(t("settings.quote.submitted")); setQuoteText(""); setQuoteAuthor(""); setQuoteSource(""); setQuoteIsOriginal(false); load(); }
    else setQuoteMsg(t("settings.quote.failed"));
  };

  const submitInquiry = async () => {
    if (!inqTitle.trim() || !inqContent.trim()) { setInqMsg(t("settings.inquiry.needFields")); return; }
    const res = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: inqCategory, title: inqTitle, content: inqContent }) });
    if (res.ok) { setInqMsg(t("settings.inquiry.submitted")); setInqTitle(""); setInqContent(""); }
    else setInqMsg(t("settings.inquiry.failed"));
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const statusLabelKey: Record<string, DictKey> = {
    pending: "settings.quote.status.pending",
    approved: "settings.quote.status.approved",
    rejected: "settings.quote.status.rejected",
    published: "settings.quote.status.published",
  };
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

  // 모바일 뒤로가기: 상세 → 목록 → 홈
  const back = () => {
    if (active) setActive(null);
    else router.push("/");
  };

  const activeSection = SECTIONS.find((s) => s.key === active);

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
          className="settings-shell__back-mobile"
          style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--text-secondary)", padding: "0 4px", WebkitTapHighlightColor: "transparent" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          {activeSection ? t(activeSection.labelKey) : t("settings.back.home")}
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
          {t("settings.title")}
        </h1>

        {saveMsg && (
          <span style={{ fontSize: "12px", color: "var(--cloth-sage)", fontWeight: 500 }}>{saveMsg}</span>
        )}
      </div>

      {/* 데스크톱 2단 / 모바일 목록↔상세 — ui-overrides.css의 .settings-shell 참고 */}
      <div className="settings-shell" data-view={active ? "detail" : "list"}>

        {/* ── 섹션 목록 (모바일: 목록 화면 / 데스크톱: 좌측 사이드바) ── */}
        <div className="settings-shell__nav">
          <div style={cardStyle}>
            {SECTIONS.map(({ key, icon, labelKey }, i) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={active === key ? "settings-nav__item--active" : ""}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 8px",
                  borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--border-hairline)" : "none",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: "52px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "20px", width: "28px", textAlign: "center" }}>{icon}</span>
                  <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-dark)" }}>{t(labelKey)}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--ink-ghost)", flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        </div>

        {/* ── 내용 패널 ── */}
        <div className="settings-shell__panel">

          {/* 나의 정보 */}
          {active === "profile" && (
            <div style={cardStyle}>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>{profile.email}</p>
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.profile.nickname")}</label>
              <input value={profile.nickname} onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))} placeholder={t("settings.profile.nicknamePlaceholder")} style={inputStyle} />
              <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.profile.bio")}</label>
              <input value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder={t("settings.profile.bioPlaceholder")} style={inputStyle} />
              <CTABtn onClick={saveProfile} loading={saving} label={t("settings.profile.save")} />
            </div>
          )}

          {/* 소식 알림 */}
          {active === "notifications" && (
            <div style={cardStyle}>
              {([
                { key: "notif_exchange_reply", labelKey: "settings.notif.exchangeReply" },
                { key: "notif_friend_request", labelKey: "settings.notif.friendRequest" },
                { key: "notif_random_exchange", labelKey: "settings.notif.randomExchange" },
                { key: "notif_quote_approval", labelKey: "settings.notif.quoteApproval" },
                { key: "notif_owner_comment", labelKey: "settings.notif.ownerComment" },
                { key: "notif_collection_update", labelKey: "settings.notif.collectionUpdate" },
              ] as { key: keyof UserSettings; labelKey: DictKey }[]).map(({ key, labelKey }) => (
                <div key={key} style={rowStyle}>
                  <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>{t(labelKey)}</span>
                  <Toggle value={settings[key] as boolean} onChange={(v) => saveSettings({ [key]: v } as Partial<UserSettings>)} />
                </div>
              ))}
            </div>
          )}

          {/* 언어 */}
          {active === "language" && (
            <div style={cardStyle}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>{t("settings.language.desc")}</p>
              {([
                { val: "ko" as Language, flag: "🇰🇷", nameKey: "settings.language.ko" as DictKey },
                { val: "en" as Language, flag: "🇺🇸", nameKey: "settings.language.en" as DictKey },
              ]).map(({ val, flag, nameKey }) => (
                <button
                  key={val}
                  onClick={() => changeLanguage(val)}
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
                    background: language === val ? "rgba(196,85,58,0.08)" : "var(--paper-aged)",
                    border: `1px solid ${language === val ? "var(--stamp-vermilion)" : "transparent"}`,
                    color: "var(--ink-dark)",
                    minHeight: "52px",
                    WebkitTapHighlightColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span>{flag} {t(nameKey)}</span>
                  {language === val && <span style={{ color: "var(--stamp-vermilion)", fontSize: "18px" }}>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* 내 일기장 */}
          {active === "diary" && (
            <div style={cardStyle}>
              <div style={rowStyle}>
                <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>{t("settings.diary.autosave")}</span>
                <Toggle value={settings.autosave} onChange={(v) => saveSettings({ autosave: v })} />
              </div>
              <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                <p style={{ fontSize: "15px", color: "var(--ink-body)", marginBottom: "10px" }}>{t("settings.diary.visibility")}</p>
                <select value={settings.diary_visibility} onChange={(e) => saveSettings({ diary_visibility: e.target.value })}
                  style={{ ...inputStyle, marginBottom: 0 }}>
                  <option value="private">{t("settings.diary.visibility.private")}</option>
                  <option value="friends">{t("settings.diary.visibility.friends")}</option>
                  <option value="public">{t("settings.diary.visibility.public")}</option>
                </select>
              </div>
              <MenuRow label={t("settings.diary.download")} onClick={() => {}} />
              <MenuRow label={t("settings.diary.restore")} onClick={() => {}} last />
            </div>
          )}

          {/* 교환일기 */}
          {active === "exchange" && (
            <div style={cardStyle}>
              <div style={rowStyle}>
                <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>{t("settings.exchange.friendAllowed")}</span>
                <Toggle value={settings.exchange_friend_allowed} onChange={(v) => saveSettings({ exchange_friend_allowed: v })} />
              </div>
              <div style={rowStyle}>
                <span style={{ fontSize: "15px", color: "var(--ink-body)" }}>{t("settings.exchange.randomAllowed")}</span>
                <Toggle value={settings.exchange_random_allowed} onChange={(v) => saveSettings({ exchange_random_allowed: v })} />
              </div>
              <MenuRow label={t("settings.exchange.blocked")} onClick={() => router.push("/exchange")} color="var(--cloth-indigo)" last />
            </div>
          )}

          {/* 명언 보내기 */}
          {active === "quote" && (
            <div style={cardStyle}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                {t("settings.quote.desc")}
              </p>
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.quote.text")}</label>
              <textarea value={quoteText} onChange={(e) => setQuoteText(e.target.value)} rows={3} placeholder={t("settings.quote.textPlaceholder")}
                style={{ ...inputStyle, resize: "none" }} />
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.quote.author")}</label>
              <input value={quoteAuthor} onChange={(e) => setQuoteAuthor(e.target.value)} placeholder={t("settings.quote.authorPlaceholder")} style={inputStyle} />
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.quote.source")}</label>
              <input value={quoteSource} onChange={(e) => setQuoteSource(e.target.value)} placeholder={t("settings.quote.sourcePlaceholder")} style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer", minHeight: "44px" }}>
                <input type="checkbox" checked={quoteIsOriginal} onChange={(e) => setQuoteIsOriginal(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--stamp-vermilion)" }} />
                <span style={{ fontSize: "14px", color: "var(--ink-body)" }}>{t("settings.quote.original")}</span>
              </label>
              {quoteMsg && (
                <p style={{ fontSize: "13px", marginBottom: "12px", color: quoteMsg === t("settings.quote.failed") ? "var(--stamp-vermilion)" : "var(--cloth-sage)" }}>{quoteMsg}</p>
              )}
              <CTABtn onClick={submitQuote} label={t("settings.quote.submit")} />

              {mySubmissions.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>{t("settings.quote.mySubmissions")}</p>
                  {mySubmissions.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                      <p style={{ fontSize: "13px", flex: 1, marginRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-body)" }}>{s.quote_text}</p>
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: statusBg[s.status] || "var(--paper-aged)", color: "var(--ink-body)", flexShrink: 0, fontWeight: 500 }}>
                        {statusLabelKey[s.status] ? t(statusLabelKey[s.status]) : s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 운영진 문의 */}
          {active === "inquiry" && (
            <div style={cardStyle}>
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.inquiry.category")}</label>
              <select value={inqCategory} onChange={(e) => setInqCategory(e.target.value)} style={inputStyle}>
                <option value="bug">{t("settings.inquiry.cat.bug")}</option>
                <option value="feature">{t("settings.inquiry.cat.feature")}</option>
                <option value="quote">{t("settings.inquiry.cat.quote")}</option>
                <option value="report_block">{t("settings.inquiry.cat.report_block")}</option>
                <option value="account">{t("settings.inquiry.cat.account")}</option>
                <option value="general">{t("settings.inquiry.cat.general")}</option>
              </select>
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.inquiry.title")}</label>
              <input value={inqTitle} onChange={(e) => setInqTitle(e.target.value)} placeholder={t("settings.inquiry.titlePlaceholder")} style={inputStyle} />
              <label style={{ fontSize: "13px", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 500 }}>{t("settings.inquiry.content")}</label>
              <textarea value={inqContent} onChange={(e) => setInqContent(e.target.value)} rows={5} placeholder={t("settings.inquiry.contentPlaceholder")}
                style={{ ...inputStyle, resize: "none" }} />
              {inqMsg && <p style={{ fontSize: "13px", marginBottom: "12px", color: inqMsg === t("settings.inquiry.failed") ? "var(--stamp-vermilion)" : "var(--cloth-sage)" }}>{inqMsg}</p>}
              <CTABtn onClick={submitInquiry} label={t("settings.inquiry.submit")} />
            </div>
          )}

          {/* 계정 */}
          {active === "account" && (
            <div style={cardStyle}>
              <MenuRow label={t("nav.logout")} onClick={handleLogout} color="var(--stamp-vermilion)" />
              <MenuRow label={t("settings.account.terms")} onClick={() => router.push("/terms")} />
              <MenuRow label={t("settings.account.privacy")} onClick={() => router.push("/privacy")} />
              <div style={{ marginTop: "24px" }}>
                <MenuRow
                  label={t("settings.account.delete")}
                  onClick={async () => {
                    if (!confirm(t("settings.account.deleteConfirm"))) return;
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
    </div>
  );
}
