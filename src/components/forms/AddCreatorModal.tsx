"use client";
import { useState } from "react";

const C = { s1:"#0f0f18",s2:"#151520",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",acc2:"#a899ff",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",r:"#f43f5e" };

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCreatorModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: "", handle: "", platform: "INSTAGRAM", category: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) { setError(json.error || "오류가 발생했습니다"); return; }
      onSuccess();
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.s1, border:`1px solid ${C.bd2}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.tx, marginBottom:20, fontFamily:"Syne, sans-serif" }}>크리에이터 추가</div>

        {error && <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.2)", borderRadius:7, padding:"9px 13px", fontSize:12, color:C.r, marginBottom:14 }}>{error}</div>}

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>이름 *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="예: 월화" style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none", fontFamily:"DM Sans, sans-serif" }} />
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>플랫폼 *</label>
          <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
            style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none" }}>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>계정 핸들 *</label>
          <input value={form.handle} onChange={e => setForm(p => ({ ...p, handle: e.target.value }))}
            placeholder="예: @woxhwa" style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none", fontFamily:"DM Mono, monospace" }} />
        </div>

        <div style={{ marginBottom:13 }}>
          <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>카테고리</label>
          <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            placeholder="예: 뷰티, 패션, 라이프스타일" style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none", fontFamily:"DM Sans, sans-serif" }} />
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
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
