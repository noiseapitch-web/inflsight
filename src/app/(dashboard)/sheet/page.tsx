export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toInput, calculate } from "@/lib/metrics/calculator";
import SheetTable from "@/components/creator/SheetTable";

const C = { s1:"#0f0f18",bd:"#232336",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",acc:"#7b6cf6",acc2:"#a899ff",g:"#0dcc8a",o:"#f97316" };

async function getData() {
  const contents = await prisma.content.findMany({
    orderBy:{ postedAt:"desc" },
    include:{ creator:{ select:{ id:true, name:true } }, campaign:{ select:{ id:true, name:true, brandName:true } }, metrics:{ orderBy:{ collectedAt:"desc" } } },
  });
  return contents.map(c=>{
    const lat:Record<string,typeof c.metrics[0]>={};
    c.metrics.forEach(m=>{ if(!lat[m.metricName]||m.collectedAt>lat[m.metricName].collectedAt) lat[m.metricName]=m; });
    const arr=Object.values(lat).map(m=>({metricName:m.metricName,metricValue:m.metricValue}));
    const calc=calculate(toInput(arr,{fee:c.fee}));
    return {
      id:c.id, creatorName:c.creator.name, brand:c.campaign?.brandName??c.campaign?.name??"—",
      platform:c.platform, url:c.url, postedAt:c.postedAt?.toLocaleDateString("ko-KR")??"—",
      views:lat["video_views"]?.metricValue??null, likes:lat["likes_count"]?.metricValue??null,
      comments:lat["comments_count"]?.metricValue??null, fee:c.fee??0,
      cpv:calc.cpv.value, lr:calc.like_rate.value, src:Object.values(lat)[0]?.source??"UNKNOWN",
    };
  });
}

export default async function SheetPage() {
  const rows = await getData();
  const totalFee = rows.reduce((s,r)=>s+r.fee,0);
  const cpvList = rows.map(r=>r.cpv).filter((v):v is number=>v!==null);
  const avgCpv = cpvList.length?cpvList.reduce((a,b)=>a+b)/cpvList.length:null;

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif" }}>성과 시트</h1>
          <p style={{ fontSize:11, color:C.tx3, fontFamily:"DM Mono, monospace", marginTop:2 }}>CPV·좋아요율 자동계산 · 광고비 직접 수정 가능</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ background:"transparent", color:C.tx2, border:`1px solid ${C.bd}`, borderRadius:7, padding:"6px 13px", fontSize:12, cursor:"pointer" }}>CSV 업로드</button>
          <button style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"6px 13px", fontSize:12, fontWeight:500, cursor:"pointer" }}>+ 행 추가</button>
        </div>
      </div>
      <div style={{ background:"rgba(123,108,246,.08)", border:"1px solid rgba(123,108,246,.15)", borderRadius:8, padding:"10px 14px", fontSize:11.5, color:C.acc2, marginBottom:14 }}>
        💡 <span style={{color:C.g,fontWeight:600}}>API</span>=OAuth 자동수집·HIGH &nbsp;·&nbsp; <span style={{color:C.o,fontWeight:600}}>MANUAL</span>=직접입력·MEDIUM &nbsp;·&nbsp; CPV/좋아요율 자동계산
      </div>
      <SheetTable initialRows={rows} totalFee={totalFee} avgCpv={avgCpv} />
    </div>
  );
}
