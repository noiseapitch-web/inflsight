"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  s1:"#0f0f18", s2:"#151520", bd:"#232336", bd2:"#2d2d45",
  acc:"#7b6cf6", acc2:"#a899ff", ag:"rgba(123,108,246,.12)",
  tx:"#e8e8f2", tx2:"#8080a0", tx3:"#44445a",
  g:"#0dcc8a", gd:"rgba(13,204,138,.12)",
  o:"#f97316", od:"rgba(249,115,22,.12)",
  r:"#f43f5e", rd:"rgba(244,63,94,.12)",
  y:"#f59e0b",
};

interface Creator {
  id: string; name: string; handle: string | null;
  oauthStatus: string; tokenExpiry: string | null;
  daysLeft: number | null; hasIgAccount: boolean;
}

function StatusBadge({ status, daysLeft }: { status: string; daysLeft: number | null }) {
  if (status === "CONNECTED") {
    const urgent = daysLeft !== null && daysLeft <= 7;
    return (
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:C.gd, color:C.g }}>연동됨</span>
        {daysLeft !== null && (
          <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:urgent?C.rd:"rgba(68,68,90,.2)", color:urgent?C.r:C.tx3 }}>
            D-{daysLeft}
          </span>
        )}
      </div>
    );
  }
  if (status === "EXPIRED") return <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:C.rd, color:C.r }}>만료됨</span>;
  return <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:C.rd, color:C.r }}>미연동</span>;
}

function CreatorCard({ creator }: { creator: Creator }) {
  const [link, setLink] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const router = useRouter();

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setLink(json.data.link);
        setExpiry(new Date(json.data.expiresAt).toLocaleString("ko-KR"));
      }
    } finally { setLoading(false); }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareKakao = () => {
    if (!link) return;
    const msg = `[INFL.SIGHT] ${creator.name}님, 아래 링크를 클릭해서 Instagram 계정을 연동해주세요.\n\n${link}\n\n(24시간 유효)`;
    const kakaoUrl = `https://open.kakao.com/o/share?text=${encodeURIComponent(msg)}`;
    window.open(kakaoUrl, "_blank");
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      await fetch(`/api/sync?creatorId=${creator.id}`, { method: "POST" });
      setSyncDone(true);
      setTimeout(() => { setSyncDone(false); router.refresh(); }, 1500);
    } finally { setSyncing(false); }
  };

  const revokeOAuth = async () => {
    if (!confirm(`${creator.name}님의 OAuth 연동을 해제할까요?`)) return;
    await fetch(`/api/oauth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId: creator.id }),
    });
    router.refresh();
  };

  const conn = creator.oauthStatus === "CONNECTED";

  return (
    <div style={{ background:C.s1, border:`1px solid ${conn ? "rgba(13,204,138,.2)" : C.bd}`, borderRadius:10, overflow:"hidden" }}>
      {/* 헤더 */}
      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, fontFamily:"Syne, sans-serif", background:conn?C.gd:C.ag, color:conn?C.g:C.acc2 }}>
            {creator.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:600, color:C.tx }}>{creator.name}</div>
            <div style={{ fontSize:11, color:C.acc2, fontFamily:"DM Mono, monospace", marginTop:2 }}>{creator.handle ?? "핸들 없음"}</div>
          </div>
        </div>
        <StatusBadge status={creator.oauthStatus} daysLeft={creator.daysLeft} />
      </div>

      {/* 연동됨 상태 */}
      {conn && (
        <div style={{ padding:"0 20px 16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
            {[
              { label:"수집 항목", v:"조회수·좋아요·댓글·공유수" },
              { label:"수집 주기", v:"매일 자동" },
              { label:"토큰 만료", v:creator.daysLeft !== null ? `D-${creator.daysLeft}` : "—" },
            ].map(s => (
              <div key={s.label} style={{ background:C.s2, borderRadius:7, padding:"9px 12px" }}>
                <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:3 }}>{s.label}</div>
                <div style={{ fontSize:12, color:C.tx }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={syncNow} disabled={syncing}
              style={{ background:syncDone?"rgba(13,204,138,.2)":C.gd, border:"1px solid rgba(13,204,138,.2)", color:C.g, borderRadius:7, padding:"6px 13px", fontSize:12, cursor:"pointer", flex:1 }}>
              {syncDone ? "✓ 완료" : syncing ? "수집 중..." : "⟳ 지금 수집"}
            </button>
            <button onClick={revokeOAuth}
              style={{ background:"transparent", border:`1px solid ${C.bd}`, color:C.r, borderRadius:7, padding:"6px 13px", fontSize:12, cursor:"pointer" }}>
              연동 해제
            </button>
          </div>
        </div>
      )}

      {/* 미연동 / 만료 상태 */}
      {!conn && (
        <div style={{ padding:"0 20px 16px" }}>
          {!creator.hasIgAccount && (
            <div style={{ background:C.od, borderRadius:7, padding:"9px 13px", fontSize:12, color:C.o, marginBottom:12 }}>
              ⚠ Instagram 계정이 등록되지 않았습니다. 크리에이터 프로필에서 먼저 추가해주세요.
            </div>
          )}
          {creator.hasIgAccount && !link && (
            <button onClick={generateLink} disabled={loading}
              style={{ width:"100%", background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"9px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}>
              {loading ? "생성 중..." : "🔗 연동 링크 생성"}
            </button>
          )}
          {link && (
            <div>
              {/* 링크 박스 */}
              <div style={{ background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"9px 13px", display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ flex:1, fontSize:11, fontFamily:"DM Mono, monospace", color:C.acc2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                  {link}
                </span>
                <button onClick={copyLink}
                  style={{ background:"transparent", border:"none", color:copied?C.g:C.tx3, cursor:"pointer", fontSize:13, flexShrink:0 }}>
                  {copied ? "✓" : "복사"}
                </button>
              </div>
              {expiry && <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:12 }}>만료: {expiry}</div>}

              {/* 발송 버튼 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                <button onClick={copyLink}
                  style={{ background:C.s2, border:`1px solid ${C.bd}`, color:C.tx2, borderRadius:7, padding:"8px 0", fontSize:12, cursor:"pointer" }}>
                  {copied ? "✓ 복사됨" : "📋 링크 복사"}
                </button>
                <button onClick={shareKakao}
                  style={{ background:"#FEE500", border:"none", color:"#000", borderRadius:7, padding:"8px 0", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  카카오톡
                </button>
                <a href={`mailto:?subject=Instagram%20연동%20링크&body=${encodeURIComponent(`안녕하세요 ${creator.name}님,\n\nInstagram 계정 연동 링크입니다.\n\n${link}\n\n링크는 24시간 유효합니다.`)}`}
                  style={{ background:C.s2, border:`1px solid ${C.bd}`, color:C.tx2, borderRadius:7, padding:"8px 0", fontSize:12, cursor:"pointer", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  📧 이메일
                </a>
              </div>

              <button onClick={generateLink}
                style={{ width:"100%", marginTop:8, background:"transparent", border:`1px solid ${C.bd}`, color:C.tx3, borderRadius:7, padding:"7px 0", fontSize:11, cursor:"pointer" }}>
                링크 재생성
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OAuthClient({ creators }: { creators: Creator[] }) {
  const connectedCount = creators.filter(c => c.oauthStatus === "CONNECTED").length;

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif", marginBottom:4 }}>OAuth 연동 관리</h1>
        <p style={{ fontSize:11, color:C.tx3 }}>크리에이터에게 링크를 발송하면 클릭 한 번으로 연동됩니다 · 연동 후 매일 자동 수집</p>
      </div>

      {/* 연동 현황 요약 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"전체 크리에이터", v:String(creators.length), c:C.tx },
          { label:"연동됨",          v:String(connectedCount), c:C.g },
          { label:"미연동",          v:String(creators.length - connectedCount), c:connectedCount < creators.length ? C.o : C.tx3 },
        ].map(s => (
          <div key={s.label} style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:9, padding:"13px 16px" }}>
            <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:5 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:s.c, fontFamily:"Syne, sans-serif" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* 플로우 안내 */}
      <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ fontSize:11, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:12, letterSpacing:"1px" }}>// 연동 방법</div>
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
          {[
            { n:"①", label:"링크 생성",       sub:"아래 버튼 클릭" },
            { n:"②", label:"크리에이터 발송",  sub:"카카오톡/이메일" },
            { n:"③", label:"Instagram 로그인", sub:"크리에이터가 클릭" },
            { n:"④", label:"자동 수집 시작",   sub:"매일 09:00" },
          ].map((s, i) => (
            <div key={s.n} style={{ flex:1, display:"flex", alignItems:"center" }}>
              <div style={{ flex:1, textAlign:"center" as const }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:C.s2, border:`1px solid ${C.bd}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:C.tx3, fontFamily:"DM Mono, monospace", margin:"0 auto 6px" }}>{s.n}</div>
                <div style={{ fontSize:11, color:C.tx2 }}>{s.label}</div>
                <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace", marginTop:1 }}>{s.sub}</div>
              </div>
              {i < 3 && <div style={{ width:20, height:1, background:C.bd2, flexShrink:0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* 크리에이터 카드 목록 */}
      {creators.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 20px", color:C.tx3 }}>
          <div style={{ fontSize:12, marginBottom:8 }}>등록된 크리에이터가 없어요</div>
          <a href="/creators" style={{ color:C.acc2, fontSize:12, textDecoration:"none" }}>크리에이터 추가하기 →</a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
          {creators.map(cr => <CreatorCard key={cr.id} creator={cr} />)}
        </div>
      )}
    </div>
  );
}
