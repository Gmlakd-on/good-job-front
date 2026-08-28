"use client";

import { useState, useCallback, useEffect } from "react";

type AdminTab = "dashboard" | "quotes" | "owner-comments" | "inquiries" | "users" | "reports" | "ai-health";
type AdminRole = "support" | "moderator" | "operations" | "security-admin";

interface Stats { totalUsers: number; totalDiaries: number; totalReplies: number; helpfulRate: number; criticalDiaries: number; pendingReports: number }
interface QuoteSub { id: string; quote_text: string; author: string; source?: string; is_original: boolean; status: string; created_at: string; profiles?: { nickname?: string } }
interface OwnerReq { id: string; status: string; source?: string; request_message?: string; admin_comment?: string; reply_due_at?: string; completed_reply_id?: string; created_at: string; profiles?: { nickname?: string }; diaries?: { id?: string; content?: string; risk_level?: string } }
interface Inquiry { id: string; category: string; title: string; content: string; status: string; admin_reply?: string; created_at: string; profiles?: { nickname?: string } }
interface RecentItem { id: string; created_at: string; [key: string]: unknown }
interface AiHealth { ok: boolean; status?: number; workingModel?: string | null; hint?: string; configuration?: Record<string, unknown>; checks?: unknown[]; reason?: string }

const ADMIN_REFRESH_INTERVAL_MS = 10000;

const TAB_ROLES: Record<AdminTab, readonly AdminRole[]> = {
  dashboard: ["support", "moderator", "operations", "security-admin"],
  quotes: ["moderator", "security-admin"],
  "owner-comments": ["support", "security-admin"],
  inquiries: ["support", "security-admin"],
  users: ["security-admin"],
  reports: ["moderator", "security-admin"],
  "ai-health": ["operations", "security-admin"],
};

function canAccessTab(tab: AdminTab, role: AdminRole): boolean {
  return TAB_ROLES[tab].includes(role);
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentItem[]>([]);
  const [quoteSubs, setQuoteSubs] = useState<QuoteSub[]>([]);
  const [ownerReqs, setOwnerReqs] = useState<OwnerReq[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<{ id: string; nickname?: string; created_at: string }[]>([]);
  const [aiHealth, setAiHealth] = useState<AiHealth | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const noStore: RequestInit = { cache: "no-store" };
      const statsRes = await fetch("/api/admin/stats", noStore);
      const statsData = await statsRes.json().catch(() => ({}));

      if (!statsRes.ok) {
        if (!silent) {
          setError(statsData.error || "관리자 인증이 필요해요.");
        }
        return;
      }

      const role = statsData.admin?.role as AdminRole | undefined;
      if (!role) {
        if (!silent) setError("관리자 역할 정보를 확인할 수 없어요.");
        return;
      }

      setAdminRole(role);
      setTab((current) => canAccessTab(current, role) ? current : "dashboard");
      setStats(statsData.stats);
      setRecentReports(statsData.recentReports || []);

      const tasks: Promise<void>[] = [];

      if (canAccessTab("quotes", role)) {
        tasks.push(fetch("/api/admin/quotes", noStore).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (response.ok) setQuoteSubs(data.submissions || []);
          else if (!silent) setError(data.error || "명언 요청 조회에 실패했어요.");
        }));
      } else {
        setQuoteSubs([]);
      }

      if (canAccessTab("owner-comments", role)) {
        tasks.push(fetch("/api/admin/owner-comments", noStore).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (response.ok) setOwnerReqs(data.requests || []);
          else if (!silent) setError(data.error || "참이 답글 요청 조회에 실패했어요.");
        }));
      } else {
        setOwnerReqs([]);
      }

      if (canAccessTab("inquiries", role)) {
        tasks.push(fetch("/api/admin/inquiries", noStore).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (response.ok) setInquiries(data.inquiries || []);
          else if (!silent) setError(data.error || "문의 조회에 실패했어요.");
        }));
      } else {
        setInquiries([]);
      }

      if (canAccessTab("users", role)) {
        tasks.push(fetch("/api/admin/users", noStore).then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (response.ok) setUsers(data.users || []);
          else if (!silent) setError(data.error || "사용자 조회에 실패했어요.");
        }));
      } else {
        setUsers([]);
      }

      await Promise.all(tasks);
      setAuthenticated(true);
    } catch {
      if (!silent) setError("서버 오류가 발생했어요.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const patchQuote = async (id: string, status: string) => {
    setError("");
    const response = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reject_reason: rejectReason[id] }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "명언 요청 처리에 실패했어요.");
      return;
    }
    setQuoteSubs((current) =>
      current.map((quote) => quote.id === id ? { ...quote, status } : quote),
    );
  };

  const patchOwner = async (id: string, status: string, comment?: string) => {
    setError("");
    const res = await fetch("/api/admin/owner-comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ id, status, admin_comment: comment }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || "처리에 실패했어요."); return; }
    setOwnerReqs((p) => p.map((r) => r.id === id ? { ...r, status, admin_comment: comment ?? r.admin_comment, completed_reply_id: data.completedReplyId ?? r.completed_reply_id } : r));
    setCommentDraft((p) => ({ ...p, [id]: "" }));
    void fetchAll({ silent: true });
  };

  const patchInquiry = async (id: string, status: string) => {
    setError("");
    const response = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_reply: replyDraft[id] }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "문의 처리에 실패했어요.");
      return;
    }
    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === id
          ? { ...inquiry, status, admin_reply: replyDraft[id] }
          : inquiry,
      ),
    );
  };

  const fetchAiHealth = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/ai-health", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      setAiHealth(data);
      if (!response.ok) setError(data.error || "AI 점검에 실패했어요.");
    } catch {
      setError("AI 점검 요청에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!authenticated) return;

    const timer = window.setInterval(() => {
      void fetchAll({ silent: true });
    }, ADMIN_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [authenticated, fetchAll]);

  const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const pendingQ = quoteSubs.filter((q) => q.status === "pending").length;
  const pendingO = ownerReqs.filter((r) => r.status === "pending").length;
  const openI = inquiries.filter((i) => i.status === "open").length;

  const ALL_TABS: { key: AdminTab; label: string; badge?: number }[] = [
    { key: "dashboard", label: "대시보드" },
    { key: "quotes", label: "명언", badge: pendingQ },
    { key: "owner-comments", label: "참이 답글", badge: pendingO },
    { key: "inquiries", label: "문의", badge: openI },
    { key: "users", label: "사용자" },
    { key: "reports", label: "신고", badge: stats?.pendingReports },
    { key: "ai-health", label: "AI 점검" },
  ];

  const TABS = ALL_TABS.filter((item) => adminRole ? canAccessTab(item.key, adminRole) : item.key === "dashboard");

  const cardS: React.CSSProperties = { borderRadius: "16px", padding: "16px", background: "var(--paper-white)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-hairline)", marginBottom: "12px" };
  const inputS: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "10px", fontSize: "14px", outline: "none", background: "var(--paper-aged)", color: "var(--ink-dark)", border: "1px solid var(--border-subtle)", boxSizing: "border-box" };
  const taS: React.CSSProperties = { ...inputS, resize: "none" };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: "400px", margin: "60px auto", padding: "0 20px" }}>
        <h1 style={{ fontFamily: "Noto Serif KR, serif", fontWeight: 700, fontSize: "22px", textAlign: "center", marginBottom: "20px", color: "var(--ink-dark)" }}>관리자</h1>
        <div style={cardS}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "12px" }}>관리자 이메일로 로그인 후 접근하세요.</p>
          <a href="/auth?next=/admin" style={{ display: "block", textAlign: "center", fontSize: "13px", color: "var(--cloth-indigo)", marginBottom: "16px" }}>로그인하러 가기</a>
          <button onClick={() => void fetchAll()} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: "12px", background: "var(--stamp-vermilion)", color: "white", fontWeight: 600, fontSize: "15px", opacity: loading ? 0.6 : 1, minHeight: "52px", cursor: "pointer" }}>
            {loading ? "확인 중…" : "관리자 인증"}
          </button>
          {error && <p style={{ fontSize: "13px", marginTop: "12px", color: "var(--stamp-vermilion)", textAlign: "center" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--paper-cream)", minHeight: "100dvh", paddingBottom: "80px" }}>
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Noto Serif KR, serif", fontWeight: 700, fontSize: "18px", color: "var(--ink-dark)" }}>관리자</h1>
        <button onClick={() => void fetchAll()} disabled={loading} style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "8px 12px", borderRadius: "8px", background: "var(--paper-aged)", minHeight: "36px" }}>
          {loading ? "갱신 중…" : "🔄 새로고침"}
        </button>
      </div>

      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          padding: "12px 16px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", gap: "8px", width: "max-content" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                position: "relative",
                padding: "8px 16px",
                borderRadius: "99px",
                fontSize: "13px",
                fontWeight: 500,
                background: tab === t.key ? "var(--stamp-vermilion)" : "var(--paper-white)",
                color: tab === t.key ? "white" : "var(--ink-body)",
                border: `1px solid ${tab === t.key ? "transparent" : "var(--border-subtle)"}`,
                whiteSpace: "nowrap",
                minHeight: "36px",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {t.label}
              {(t.badge ?? 0) > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "white", color: "var(--stamp-vermilion)", fontSize: "9px", fontWeight: 700, boxShadow: "0 0 0 1.5px var(--stamp-vermilion)" }}>
                  {(t.badge ?? 0) > 9 ? "9+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
        {error && <p style={{ fontSize: "13px", marginBottom: "12px", color: "var(--stamp-vermilion)", textAlign: "center" }}>{error}</p>}

        {tab === "dashboard" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {[
              { label: "전체 사용자", value: stats.totalUsers },
              { label: "전체 일기", value: stats.totalDiaries },
              { label: "만족도", value: `${stats.helpfulRate}%`, hi: stats.helpfulRate >= 60 },
              { label: "CRITICAL", value: stats.criticalDiaries, warn: stats.criticalDiaries > 0 },
              { label: "대기 명언", value: pendingQ, warn: pendingQ > 0 },
              { label: "대기 참이답글", value: pendingO, warn: pendingO > 0 },
              { label: "미답변 문의", value: openI, warn: openI > 0 },
              { label: "미처리 신고", value: stats.pendingReports, warn: stats.pendingReports > 0 },
            ].map(({ label, value, warn, hi }) => (
              <div key={label} style={{ ...cardS, textAlign: "center", borderLeft: warn ? "3px solid var(--stamp-vermilion)" : hi ? "3px solid var(--cloth-sage)" : undefined, marginBottom: 0 }}>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>{label}</p>
                <p style={{ fontSize: "22px", fontWeight: 700, color: warn ? "var(--stamp-vermilion)" : "var(--ink-dark)" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "quotes" && (
          <>
            {quoteSubs.length === 0 && <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", padding: "40px 0" }}>명언 요청이 없어요.</p>}
            {quoteSubs.map((q) => (
              <div key={q.id} style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(q.created_at)} · {q.profiles?.nickname || "익명"}</span>
                  <QuoteStatusBadge status={q.status} />
                </div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-dark)", marginBottom: "4px", wordBreak: "keep-all" }}>&ldquo;{q.quote_text}&rdquo;</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>— {q.author}{q.source ? ` (${q.source})` : ""}{q.is_original ? " · 직접 작성" : ""}</p>
                {q.status === "pending" && (
                  <>
                    <input value={rejectReason[q.id] || ""} onChange={(e) => setRejectReason((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="반려 사유 (선택)" style={{ ...inputS, marginBottom: "10px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button onClick={() => patchQuote(q.id, "approved")} style={{ padding: "12px", borderRadius: "10px", background: "var(--cloth-sage)", color: "white", fontSize: "14px", fontWeight: 600, minHeight: "44px", cursor: "pointer" }}>승인</button>
                      <button onClick={() => patchQuote(q.id, "rejected")} style={{ padding: "12px", borderRadius: "10px", background: "var(--stamp-vermilion)", color: "white", fontSize: "14px", fontWeight: 600, minHeight: "44px", cursor: "pointer" }}>반려</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {tab === "owner-comments" && (
          <>
            {ownerReqs.length === 0 && <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", padding: "40px 0" }}>참이 답글 요청이 없어요.</p>}
            {ownerReqs.map((r) => (
              <div key={r.id} style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(r.created_at)} · {r.profiles?.nickname || "익명"}</span>
                  <OwnerStatusBadge status={r.status} />
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {r.source === "persona_chami" && <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: "rgba(196,85,58,0.1)", color: "var(--stamp-vermilion)", fontWeight: 600 }}>참이 선택</span>}
                  {r.reply_due_at && <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "99px", background: "var(--paper-aged)", color: "var(--text-secondary)" }}>도착 예정 {fmt(r.reply_due_at)}</span>}
                </div>
                {r.request_message && <p style={{ fontSize: "13px", padding: "10px 12px", borderRadius: "10px", background: "var(--paper-aged)", color: "var(--ink-body)", marginBottom: "10px", wordBreak: "keep-all" }}>{r.request_message}</p>}
                {r.diaries?.content && (
                  <details style={{ marginBottom: "10px" }}>
                    <summary style={{ fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", padding: "6px 0" }}>일기 내용 보기</summary>
                    <p style={{ fontSize: "13px", padding: "10px 12px", borderRadius: "10px", background: "var(--paper-aged)", color: "var(--ink-body)", marginTop: "6px", wordBreak: "keep-all" }}>{r.diaries.content.slice(0, 300)}{r.diaries.content.length > 300 ? "…" : ""}</p>
                  </details>
                )}
                {r.admin_comment && <p style={{ fontSize: "13px", padding: "10px 12px", borderRadius: "10px", background: "rgba(126,155,114,0.12)", color: "var(--cloth-sage)", marginBottom: "10px", wordBreak: "keep-all" }}>💬 {r.admin_comment}</p>}
                {r.status !== "completed" && (
                  <>
                    <textarea value={commentDraft[r.id] || ""} onChange={(e) => setCommentDraft((p) => ({ ...p, [r.id]: e.target.value }))} rows={3} placeholder="코멘트 작성…" style={{ ...taS, marginBottom: "10px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "8px" }}>
                      <button onClick={() => patchOwner(r.id, "reviewing")} style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--paper-aged)", color: "var(--ink-body)", fontSize: "13px", minHeight: "44px", cursor: "pointer" }}>확인 중</button>
                      <button onClick={() => patchOwner(r.id, "completed", commentDraft[r.id])} style={{ padding: "10px", borderRadius: "10px", background: "var(--cloth-indigo)", color: "white", fontSize: "13px", fontWeight: 600, minHeight: "44px", cursor: "pointer" }}>전송</button>
                      <button onClick={() => patchOwner(r.id, "hold")} style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--paper-aged)", color: "var(--text-secondary)", fontSize: "13px", minHeight: "44px", cursor: "pointer" }}>보류</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {tab === "inquiries" && (
          <>
            {inquiries.length === 0 && <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", padding: "40px 0" }}>문의가 없어요.</p>}
            {inquiries.map((i) => (
              <div key={i.id} style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(i.created_at)} · {i.profiles?.nickname || "익명"}</span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "var(--paper-aged)", color: "var(--ink-body)" }}>{i.category}</span>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-dark)", marginBottom: "6px" }}>{i.title}</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px", wordBreak: "keep-all" }}>{i.content}</p>
                {i.admin_reply && <p style={{ fontSize: "13px", padding: "10px 12px", borderRadius: "10px", background: "rgba(126,155,114,0.12)", color: "var(--cloth-sage)", marginBottom: "10px" }}>💬 {i.admin_reply}</p>}
                {i.status === "open" && (
                  <>
                    <textarea value={replyDraft[i.id] || ""} onChange={(e) => setReplyDraft((p) => ({ ...p, [i.id]: e.target.value }))} rows={2} placeholder="답변 작성…" style={{ ...taS, marginBottom: "10px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
                      <button onClick={() => patchInquiry(i.id, "resolved")} style={{ padding: "12px", borderRadius: "10px", background: "var(--cloth-indigo)", color: "white", fontSize: "13px", fontWeight: 600, minHeight: "44px", cursor: "pointer" }}>답변 전송 & 해결</button>
                      <button onClick={() => patchInquiry(i.id, "closed")} style={{ padding: "12px", borderRadius: "10px", background: "var(--paper-aged)", color: "var(--text-secondary)", fontSize: "13px", minHeight: "44px", cursor: "pointer" }}>닫기</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {tab === "users" && (
          <>
            {users.map((u) => (
              <div key={u.id} style={{ ...cardS, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink-dark)" }}>{u.nickname || "닉네임 없음"}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(u.created_at)}</p>
                </div>
                <code style={{ fontSize: "10px", color: "var(--ink-ghost)", background: "var(--paper-aged)", padding: "2px 6px", borderRadius: "4px" }}>{u.id.slice(0, 8)}…</code>
              </div>
            ))}
          </>
        )}

        {tab === "reports" && (
          <>
            {recentReports.length === 0 && <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", padding: "40px 0" }}>신고가 없어요.</p>}
            {recentReports.map((r) => (
              <div key={r.id} style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(r.created_at)}</span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: r.status === "PENDING" ? "rgba(196,160,84,0.15)" : "rgba(126,155,114,0.15)", color: r.status === "PENDING" ? "var(--seal-gold)" : "var(--cloth-sage)" }}>{String(r.status)}</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{String(r.target_type)} · {String(r.reason)}</p>
              </div>
            ))}
          </>
        )}

        {tab === "ai-health" && (
          <div style={cardS}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink-dark)", marginBottom: "6px" }}>Gemini 답글 연결 점검</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", wordBreak: "keep-all" }}>백엔드 환경변수와 Gemini generateContent 호출이 정상인지 확인합니다. 키 값은 앞부분만 표시돼요.</p>
            <button onClick={fetchAiHealth} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "var(--cloth-indigo)", color: "white", fontSize: "13px", fontWeight: 600, minHeight: "44px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "점검 중…" : "Gemini 점검 실행"}
            </button>
            {aiHealth && (
              <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: aiHealth.ok ? "rgba(126,155,114,0.12)" : "rgba(196,85,58,0.08)", color: "var(--ink-body)", fontSize: "12px", lineHeight: 1.6 }}>
                <p style={{ fontWeight: 700, color: aiHealth.ok ? "var(--cloth-sage)" : "var(--stamp-vermilion)" }}>{aiHealth.ok ? "정상" : "점검 필요"}{aiHealth.workingModel ? ` · ${aiHealth.workingModel}` : ""}</p>
                {aiHealth.hint && <p>{aiHealth.hint}</p>}
                {aiHealth.reason && <p>reason: {aiHealth.reason}</p>}
                <pre style={{ marginTop: "8px", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "10px", opacity: 0.75 }}>{JSON.stringify({ configuration: aiHealth.configuration, checks: aiHealth.checks }, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["검토 중", "rgba(196,160,84,0.15)"],
    approved: ["승인됨", "rgba(126,155,114,0.15)"],
    rejected: ["반려됨", "rgba(196,85,58,0.1)"],
    published: ["노출됨", "rgba(90,110,138,0.15)"],
  };
  const [label, bg] = map[status] ?? [status, "var(--paper-aged)"];
  return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: bg, color: "var(--ink-body)", fontWeight: 500 }}>{label}</span>;
}

function OwnerStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: "대기 중", reviewing: "확인 중", completed: "완료", hold: "보류" };
  return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "var(--paper-aged)", color: "var(--ink-body)" }}>{map[status] ?? status}</span>;
}