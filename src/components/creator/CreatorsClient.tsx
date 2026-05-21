"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddCreatorModal from "@/components/forms/AddCreatorModal";
import { fmtWon, fmtPct } from "@/lib/metrics/calculator";

const C = { s1:"#0f0f18",s2:"#151520",bd:"#232336",acc:"#7b6cf6",acc2:"#a899ff",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",g:"#0dcc8a",o:"#f97316",r:"#f43f5e",y:"#f59e0b" };

interface Creator {
  id: string; name: string; category: string | null;
  totalFee: number; avgCpv: number | null; avgLr: number | null; contentCount: number;
  igAcc: { handle: string; oauthStatus: string; platform: string } | null;
  accounts: { platform: string; handle: string }[];
}

export default function CreatorsClient({ initialCreators }: { initialCreators: Creator[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif", letterSpacing:"-0.4px" }}>크리에이터</h1>
          <p style={{ fontSize:11, color:C.tx3, marginTop:3 }}>OAuth 연동 시 자동 수집 · 미연동 시 수동 입력</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 14px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
          + 크리에이터 추가
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {initialCreators.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 20px", color:C.tx3 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>◉</div>
            <div style={{ fontSize:14, color:C.tx2, marginBottom:6 }}>등록된 크리에이터가 없어요</div>
            <button onClick={() => setShowAdd(true)} style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"8px 16px", fontSize:12, cursor:"pointer", marginTop:8 }}>
              + 첫 크리에이터 추가하기
            </button>
          </div>
        )}

        {initialCreators.map(cr => {
          const conn = cr.igAcc?.oauthStatus === "CONNECTED";
          const cpvC = cr.avgCpv === null ? C.tx3 : cr.avgCpv < 80 ? C.g : cr.avgCpv < 150 ? C.y : C.o;
          const lrC  = cr.avgLr  === null ? C.tx3 : cr.avgLr  > 1.5 ? C.g : cr.avgLr  > 0.5 ? C.y : C.r;
          return (
            <Link key={cr.id} href={`/creators/${cr.id}`} style={{ textDecoration:"none" }}>
              <div style={{ background:C.s1, border:`1px solid ${conn ? "rgba(13,204,138,.25)" : C.bd}`, borderRadius:10, overflow:"hidden", cursor:"pointer" }}>
                <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:16, alignItems:"center", padding:"16px 20px" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, fontFamily:"Syne, sans-serif", background:conn ? "rgba(13,204,138,.12)" : "rgba(123,108,246,.1)", color:conn ? C.g : C.acc2 }}>
                    {cr.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.tx }}>{cr.name}</div>
                    <div style={{ fontSize:11, color:C.acc2, fontFamily:"DM Mono, monospace", marginTop:2 }}>{cr.igAcc?.handle ?? ""}</div>
                    <div style={{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" as const }}>
                      {cr.accounts.map(a => (
                        <span key={a.platform} style={{ fontSize:9.5, fontFamily:"DM Mono, monospace", padding:"1px 7px", borderRadius:20, background:a.platform === "INSTAGRAM" ? "rgba(225,48,108,.12)" : a.platform === "YOUTUBE" ? "rgba(255,0,0,.1)" : "rgba(255,255,255,.05)", color:a.platform === "INSTAGRAM" ? "#e1306c" : a.platform === "YOUTUBE" ? "#ff4040" : C.tx2 }}>
                          {a.platform}
                        </span>
                      ))}
                      <span style={{ fontSize:9, fontFamily:"DM Mono, monospace", padding:"2px 7px", borderRadius:20, background:conn ? "rgba(13,204,138,.12)" : "rgba(244,63,94,.12)", color:conn ? C.g : C.r }}>
                        {conn ? "OAuth 연동됨" : "미연동"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                    {[
                      { label:"총 광고비", v:fmtWon(cr.totalFee), c:C.tx },
                      { label:"평균 CPV",  v:fmtWon(cr.avgCpv),  c:cpvC },
                      { label:"좋아요율",  v:fmtPct(cr.avgLr),   c:lrC },
                      { label:"콘텐츠",    v:`${cr.contentCount}건`, c:C.tx },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"DM Mono, monospace", fontSize:13, fontWeight:500, color:s.c }}>{s.v}</div>
                        <div style={{ fontSize:10, color:C.tx3, marginTop:1 }}>{s.label}</div>
                      </div>
                    ))}
                    <span style={{ color:C.tx3 }}>›</span>
                  </div>
                </div>
                {!conn && (
                  <div style={{ padding:"7px 16px", background:"rgba(249,115,22,.08)", borderTop:"1px solid rgba(249,115,22,.15)", fontSize:11, color:C.o }}>
                    ⚠ 전체 MANUAL_INPUT · OAuth 연동 시 자동 수집 전환
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {showAdd && (
        <AddCreatorModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
