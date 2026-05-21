"use client";
import { useState } from "react";

const C = { s1:"#0f0f18",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",tx:"#e8e8f2",tx2:"#8080a0",r:"#f43f5e" };

interface Props { onClose: () => void; onSuccess: () => void; }

export default function AddCampaignModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name:"", brandName:"", budget:"", startDate:"", endDate:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
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

  const inp = (label: string, key: keyof typeof form, placeholder: string, type = "text") => (
    <div style={{ marginBottom:13 }}>
      <label style={{ display:"block", fontSize:11, color:C.tx2, marginBottom:5, fontFamily:"DM Mono, monospace" }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder} style={{ width:"100%", background:"#09090f", border:`1px solid ${C.bd}`, borderRadius:7, padding:"8px 12px", color:C.tx, fontSize:13, outline:"none" }} />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.s1, border:`1px solid ${C.bd2}`, borderRadius:14, padding:28, width:420, maxWidth:"95vw" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.tx, marginBottom:20, fontFamily:"Syne, sans-serif" }}>캠페인 생성</div>
        {error && <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.2)", borderRadius:7, padding:"9px 13px", fontSize:12, color:C.r, marginBottom:14 }}>{error}</div>}
        {inp("캠페인명 *", "name", "예: 뷰티 브랜드 X 여름 캠페인")}
        {inp("브랜드명", "brandName", "예: Brand X")}
        {inp("예산 (원)", "budget", "예: 5000000", "number")}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {inp("시작일", "startDate", "", "date")}
          {inp("종료일", "endDate", "", "date")}
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
          <button onClick={onClose} style={{ background:"transparent", border:`1px solid ${C.bd}`, color:C.tx2, borderRadius:7, padding:"7px 16px", fontSize:12, cursor:"pointer" }}>취소</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ background:loading?"#555":C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:500, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "생성 중..." : "생성하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
