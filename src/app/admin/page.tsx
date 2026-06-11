"use client";

import { useState, useCallback } from "react";

type AdminTab = "dashboard" | "quotes" | "owner-comments" | "inquiries" | "users" | "reports";

interface Stats { totalUsers: number; totalDiaries: number; totalReplies: number; helpfulRate: number; criticalDiaries: number; pendingReports: number }
interface QuoteSub { id: string; quote_text: string; author: string; source?: string; is_original: boolean; status: string; created_at: string; profiles?: { nickname?: string } }
interface OwnerReq { id: string; status: string; request_message?: string; admin_comment?: string; created_at: string; profiles?: { nickname?: string }; diaries?: { content?: string } }
interface Inquiry { id: string; category: string; title: string; content: string; status: string; admin_reply?: string; created_at: string; profiles?: { nickname?: string } }
interface RecentItem { id: string; created_at: string; [key: string]: unknown }

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentItem[]>([]);
  const [quoteSubs, setQuoteSubs] = useState<QuoteSub[]>([]);
  const [ownerReqs, setOwnerReqs] = useState<OwnerReq[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<{ id: string; nickname?: string; created_at: string }[]>([]);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [statsRes, quotesRes, ownerRes, inqRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"), fetch("/api/admin/quotes"),
        fetch("/api/admin/owner-comments"), fetch("/api/admin/inquiries"), fetch("/api/admin/users"),
      ]);
      if (!statsRes.ok) { setError("관리자 권한이 필요해요. 관리자 이메일로 로그인해주세요."); setLoading(false); return; }
      const sd = await statsRes.json();
      setStats(sd.stats); setRecentReports(sd.recentReports || []);
      if (quotesRes.ok) { const d = await quotesRes.json(); setQuoteSubs(d.submissions || []); }
      if (ownerRes.ok) { const d = await ownerRes.json(); setOwnerReqs(d.requests || []); }
      if (inqRes.ok) { const d = await inqRes.json(); setInquiries(d.inquiries || []); }
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users || []); }
      setAuthenticated(true);
    } catch { setError("서버 오류가 발생했어요."); }
    setLoading(false);
  }, []);

  const patchQuote = async (id: string, status: string) => {
    await fetch("/api/admin/quotes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, reject_reason: rejectReason[id] }) });
    setQuoteSubs((p) => p.map((q) => q.id === id ? { ...q, status } : q));
  };
  const patchOwner = async (id: string, status: string, comment?: string) => {
    await fetch("/api/admin/owner-comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, admin_comment: comment }) });
    setOwnerReqs((p) => p.map((r) => r.id === id ? { ...r, status, admin_comment: comment ?? r.admin_comment } : r));
  };
  const patchInquiry = async (id: string, status: string) => {
    await fetch("/api/admin/inquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, admin_reply: replyDraft[id] }) });
    setInquiries((p) => p.map((i) => i.id === id ? { ...i, status, admin_reply: replyDraft[id] } : i));
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const pendingQ = quoteSubs.filter((q) => q.status === "pending").length;
  const pendingO = ownerReqs.filter((r) => r.status === "pending").length;
  const openI = inquiries.filter((i) => i.status === "open").length;

  const TABS: { key: AdminTab; label: string; badge?: number }[] = [
    { key: "dashboard", label: "대시보드" },
    { key: "quotes", label: "명언", badge: pendingQ },
    { key: "owner-comments", label: "코멘트", badge: pendingO },
    { key: "inquiries", label: "문의", badge: openI },
    { key: "users", label: "사용자" },
    { key: "reports", label: "신고", badge: stats?.pendingReports },
  ];

  const cardS: React.CSSProperties = { borderRadius: "16px", padding: "16px", background: "var(--paper-white)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-hairline)", marginBottom: "12px" };
  const inputS: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "10px", fontSize: "14px", outline: "none", background: "var(--paper-aged)", color: "var(--ink-dark)", border: "1px solid var(--border-subtle)", boxSizing: "border-box" };
  const taS: React.CSSProperties = { ...inputS, resize: "none" };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: "400px", margin: "60px auto", padding: "0 20px" }}>
        <h1 style={{ fontFamily: "Noto Serif KR, serif", fontWeight: 700, fontSize: "22px", textAlign: "center", marginBottom: "20px", color: "var(--ink-dark)" }}>관리자</h1>
        <div style={cardS}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "20px" }}>관리자 이메일로 로그인 후 접근하세요.</p>
          <button onClick={fetchAll} disabled={loading} style={{ width: "100%", padding: "15px", borderRadius: "12px", background: "var(--stamp-vermilion)", color: "white", fontWeight: 600, fontSize: "15px", opacity: loading ? 0.6 : 1, minHeight: "52px", cursor: "pointer" }}>
            {loading ? "확인 중…" : "관리자 인증"}
          </button>
          {error && <p style={{ fontSize: "13px", marginTop: "12px", color: "var(--stamp-vermilion)", textAlign: "center" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--paper-cream)", minHeight: "100dvh", paddingBottom: "80px" }}>
      {/* 상단 헤더 */}
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Noto Serif KR, serif", fontWeight: 700, fontSize: "18px", color: "var(--ink-dark)" }}>관리자</h1>
        <button onClick={fetchAll} disabled={loading} style={{ fontSize: "12px", color: "var(--text-secondary)", padding: "8px 12px", borderRadius: "8px", background: "var(--paper-aged)", minHeight: "36px" }}>
          {loading ? "갱신 중…" : "🔄 새로고침"}
        </button>
      </div>

      {/* 탭 - 가로 스크롤 */}
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

        {/* 대시보드 */}
        {tab === "dashboard" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {[
              { label: "전체 사용자", value: stats.totalUsers },
              { label: "전체 일기", value: stats.totalDiaries },
              { label: "만족도", value: `${stats.helpfulRate}%`, hi: stats.helpfulRate >= 60 },
              { label: "CRITICAL", value: stats.criticalDiaries, warn: stats.criticalDiaries > 0 },
              { label: "대기 명언", value: pendingQ, warn: pendingQ > 0 },
              { label: "대기 코멘트", value: pendingO, warn: pendingO > 0 },
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

        {/* 명언 관리 */}
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

        {/* 주인장 코멘트 */}
        {tab === "owner-comments" && (
          <>
            {ownerReqs.length === 0 && <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)", padding: "40px 0" }}>코멘트 요청이 없어요.</p>}
            {ownerReqs.map((r) => (
              <div key={r.id} style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fmt(r.created_at)} · {r.profiles?.nickname || "익명"}</span>
                  <OwnerStatusBadge status={r.status} />
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

        {/* 문의 관리 */}
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

        {/* 사용자 목록 */}
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

        {/* 신고 관리 */}
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
