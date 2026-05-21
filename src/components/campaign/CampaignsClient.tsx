"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddCampaignModal from "@/components/forms/AddCampaignModal";
import { fmtWon } from "@/lib/metrics/calculator";

const C = { s1:"#0f0f18",s2:"#151520",bd:"#232336",acc:"#7b6cf6",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",g:"#0dcc8a",o:"#f97316",r:"#f43f5e",y:"#f59e0b" };

const STATUS: Record<string, { bg: string; c: string }> = {
  ACTIVE:    { bg:"rgba(13,204,138,.12)", c:"#0dcc8a" },
  DRAFT:     { bg:"rgba(245,158,11,.12)", c:"#f59e0b" },
  COMPLETED: { bg:"rgba(128,128,160,.1)", c:"#44445a" },
  CANCELLED: { bg:"rgba(244,63,94,.12)",  c:"#f43f5e" },
};

interface Campaign {
  id: string; name: string; brandName: string | null; status: string;
  startDate: string | null; endDate: string | null;
  creatorCount: number; contentCount: number; totalFee: number;
}

export default function CampaignsClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif" }}>캠페인</h1>
        <button onClick={() => setShowAdd(true)}
          style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 14px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
          + 캠페인 생성
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {initialCampaigns.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 20px", color:C.tx3 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>◇</div>
            <div style={{ fontSize:14, color:C.tx2, marginBottom:6 }}>등록된 캠페인이 없어요</div>
            <button onClick={() => setShowAdd(true)} style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer", marginTop:8 }}>
              + 첫 캠페인 만들기
            </button>
          </div>
        )}

        {initialCampaigns.map(c => {
          const st = STATUS[c.status] ?? STATUS.DRAFT;
          return (
            <div key={c.id} style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:C.tx, marginBottom:5 }}>
                  {c.brandName && <span style={{ color:C.tx2, fontWeight:400 }}>{c.brandName} — </span>}
                  {c.name}
                </div>
                <div style={{ display:"flex", gap:16, fontSize:11, color:C.tx2 }}>
                  <span>크리에이터 {c.creatorCount}명</span>
                  <span>콘텐츠 {c.contentCount}개</span>
                  <span>{fmtWon(c.totalFee)}</span>
                  {c.startDate && <span style={{ color:C.tx3 }}>{c.startDate} ~ {c.endDate ?? ""}</span>}
                </div>
              </div>
              <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"3px 10px", borderRadius:20, background:st.bg, color:st.c }}>
                {c.status}
              </span>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddCampaignModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
