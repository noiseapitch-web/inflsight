"use client";
import { useState, useEffect } from "react";

const C = { s1:"#0f0f18",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",acc2:"#a899ff",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",r:"#f43f5e",g:"#0dcc8a",y:"#f59e0b" };

interface Creator { id: string; name: string; accounts: { platform: string; handle: string }[]; }
interface Campaign { id: string; name: string; brandName: string | null; }
interface Props { onClose: () => void; onSuccess: () => void; defaultCampaignId?: string; }

export default function AddContentModal({ onClose, onSuccess, defaultCampaignId }: Props) {
  const [form, setForm] = useState({ campaignId: defaultCampaignId || "", creatorId: "", url: "", fee: "", postedAt: "" });
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlInfo, setUrlInfo] = useState("");

  useEffect(() => {
    fetch("/api/creators").then(r => r.json()).then(j => setCreators(j.data || []));
    fetch("/api/campaigns").then(r => r.json()).then(j => setCampaigns(j.data || []));
  }, []);

  // URL 자동 분석
  const handleUrlChange = (url: string) => {
    setForm(p => ({ ...p, url }));
    if (url.includes("instagram.com/reel")) setUrlInfo("Instagram 릴스 · 조회수·좋아요·댓글 수집 가능");
    else if (url.includes("instagram.com/p/")) setUrlInfo("Instagram 피드 · 좋아요·댓글 수집 가능 (조회수 없음)");
    else if (url.includes("youtube.com/shorts")) setUrlInfo("YouTube Shorts");
    else if (url.includes("tiktok.com")) setUrlInfo("TikTok");
    else if (url) setUrlInfo("알 수 없는 플랫폼");
    else setUrlInfo("");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "오류 발생"); return; }
      onSuccess();
      onClose();
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.s1, border:`1px solid ${C.bd2}`, borderRadius:14, padding:28, width:440, maxWidth:"95vw" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.tx, marginBottom:20, fontFamily:"Syne, sans-serif" }}>콘텐츠 추가</div>
        {error && <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.2)", borderRadius:7, padding:"9px 13px", fontSize:12, color:C.r, marginBottom:14 }}>{error}</div>}

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>캠페인 *</label>
          <select value={form.campaignId} onChange={e => setForm(p => ({ ...p, campaignId: e.target.value }))}
            style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:form.campaignId?C.tx:C.tx3, fontSize:13, outline:"none" }}>
            <option value="">캠페인 선택</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.brandName ? `${c.brandName} — ` : ""}{c.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>크리에이터 *</label>
          <select value={form.creatorId} onChange={e => setForm(p => ({ ...p, creatorId: e.target.value }))}
            style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:form.creatorId?C.tx:C.tx3, fontSize:13, outline:"none" }}>
            <option value="">크리에이터 선택</option>
            {creators.map(c => <option key={c.id} value={c.id}>{c.name} ({c.accounts[0]?.handle || ""})</option>)}
          </select>
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>콘텐츠 URL *</label>
          <input value={form.url} onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://instagram.com/reel/..." style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none", fontFamily:"DM Mono, monospace" }} />
          {urlInfo && <div style={{ fontSize:11, color:C.g, marginTop:5, fontFamily:"DM Mono, monospace" }}>✓ {urlInfo}</div>}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ marginBottom:13 }}>
            <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>광고비 (원)</label>
            <input type="number" value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))}
              placeholder="500000" style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none" }} />
          </div>
          <div style={{ marginBottom:13 }}>
            <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>게시 일시</label>
            <input type="datetime-local" value={form.postedAt} onChange={e => setForm(p => ({ ...p, postedAt: e.target.value }))}
              style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:form.postedAt?C.tx:C.tx3, fontSize:12, outline:"none" }} />
          </div>
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.bd}`, color:C.tx2, borderRadius:7, padding:"7px 16px", fontSize:12, cursor:"pointer" }}>취소</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ background:loading?"#555":C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:500, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "추가 중..." : "추가하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
