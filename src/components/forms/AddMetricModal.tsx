"use client";
import { useState } from "react";

const C = { s1:"#0f0f18",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",r:"#f43f5e",o:"#f97316",y:"#f59e0b" };

interface Props {
  contentId: string;
  creatorId: string;
  contentUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMetricModal({ contentId, creatorId, contentUrl, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ likes:"", comments:"", videoViews:"", shares:"", note:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.likes && !form.comments && !form.videoViews && !form.shares) {
      setError("최소 하나의 지표를 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/creators/${creatorId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, ...form }),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "오류 발생"); return; }
      onSuccess();
      onClose();
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  };

  const shortUrl = contentUrl.replace(/https?:\/\/(www\.)?/, "").slice(0, 35) + "...";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.s1, border:`1px solid ${C.bd2}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.tx, marginBottom:6, fontFamily:"Syne, sans-serif" }}>지표 수동 입력</div>
        <div style={{ fontSize:11, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:16 }}>{shortUrl}</div>

        <div style={{ background:"rgba(249,115,22,.08)", border:"1px solid rgba(249,115,22,.15)", borderRadius:7, padding:"9px 13px", fontSize:11.5, color:C.o, marginBottom:16 }}>
          ⚠ source: MANUAL_INPUT · confidence: MEDIUM 으로 저장됩니다
        </div>

        {error && <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.2)", borderRadius:7, padding:"9px 13px", fontSize:12, color:C.r, marginBottom:14 }}>{error}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"좋아요 수", key:"likes",      placeholder:"예: 1200" },
            { label:"댓글 수",   key:"comments",   placeholder:"예: 45" },
            { label:"조회수 (릴스만)", key:"videoViews", placeholder:"예: 50000" },
            { label:"공유수",    key:"shares",     placeholder:"예: 30" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:10 }}>
              <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:4, fontFamily:"DM Mono, monospace" }}>{f.label}</label>
              <input type="number" value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none" }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:4, fontFamily:"DM Mono, monospace" }}>메모 (출처 기록)</label>
          <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            placeholder="예: 인플루언서 스크린샷 제출"
            style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none" }} />
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:8 }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.bd}`, color:C.tx2, borderRadius:7, padding:"7px 16px", fontSize:12, cursor:"pointer" }}>취소</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ background:loading?"#555":C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:500, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "저장 중..." : "저장 (MANUAL)"}
          </button>
        </div>
      </div>
    </div>
  );
}
