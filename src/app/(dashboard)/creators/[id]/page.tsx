export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toInput, calculate, fmtWon, fmtPct, fmtKo } from "@/lib/metrics/calculator";
import CreatorTabs from "@/components/creator/CreatorTabs";

const C = { s1:"#0f0f18",s2:"#151520",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",acc2:"#a899ff",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",g:"#0dcc8a",o:"#f97316",r:"#f43f5e",y:"#f59e0b" };

async function getCreator(id: string) {
  const creator = await prisma.creator.findUnique({
    where:{ id },
    include:{
      accounts:{ include:{ metrics:{ orderBy:{ collectedAt:"desc" }, take:20 } } },
      contents:{ orderBy:{ postedAt:"desc" }, include:{ metrics:{ orderBy:{ collectedAt:"desc" } }, campaign:{ select:{ id:true, name:true, brandName:true } } } },
      campaigns:{ include:{ campaign:true } },
    },
  });
  if(!creator) return null;

  const igAcc = creator.accounts.find(a=>a.platform==="INSTAGRAM");
  const connected = igAcc?.oauthStatus==="CONNECTED";
  const followerSnap = igAcc?.metrics.find(m=>m.metricName==="follower_count");

  let totalFee=0; const cpvList:number[]=[]; const lrList:number[]=[];
  const contentsCalc = creator.contents.map(c=>{
    if(c.fee) totalFee+=c.fee;
    const lat:Record<string,typeof c.metrics[0]>={};
    c.metrics.forEach(m=>{ if(!lat[m.metricName]||m.collectedAt>lat[m.metricName].collectedAt) lat[m.metricName]=m; });
    const arr=Object.values(lat).map(m=>({metricName:m.metricName,metricValue:m.metricValue}));
    const calc=calculate(toInput(arr,{fee:c.fee,follower_count:followerSnap?.metricValue??null}));
    if(calc.cpv.value!==null) cpvList.push(calc.cpv.value);
    if(calc.like_rate.value!==null) lrList.push(calc.like_rate.value);
    return { id:c.id, url:c.url, contentType:c.contentType, platform:c.platform, postedAt:c.postedAt?.toLocaleDateString("ko-KR")??null, fee:c.fee, campaign:c.campaign,
      views:lat["video_views"]?.metricValue??null, likes:lat["likes_count"]?.metricValue??null, comments:lat["comments_count"]?.metricValue??null,
      src:Object.values(lat)[0]?.source??"UNKNOWN", conf:Object.values(lat)[0]?.confidence??"LOW",
      cpv:calc.cpv.value, lr:calc.like_rate.value };
  });
  const avgCpv=cpvList.length?cpvList.reduce((a,b)=>a+b)/cpvList.length:null;
  const avgLr=lrList.length?lrList.reduce((a,b)=>a+b)/lrList.length:null;
  const tokenDaysLeft=igAcc?.tokenExpiry?Math.floor((igAcc.tokenExpiry.getTime()-Date.now())/86400000):null;
  return { creator, igAcc, connected, followerSnap, contentsCalc, totalFee, avgCpv, avgLr, tokenDaysLeft };
}

export default async function CreatorDetailPage({ params }: { params: { id: string } }) {
  const data = await getCreator(params.id);
  if(!data) notFound();
  const { creator, igAcc, connected, followerSnap, contentsCalc, totalFee, avgCpv, avgLr, tokenDaysLeft } = data;

  return (
    <div style={{ padding:24 }}>
      <Link href="/creators" style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:C.tx2, textDecoration:"none", marginBottom:16, padding:"5px 10px", borderRadius:6, background:"transparent" }}>
        ← 크리에이터 목록
      </Link>

      {/* Hero */}
      <div style={{ background:C.s1, border:`1px solid ${connected?"rgba(13,204,138,.2)":C.bd}`, borderRadius:10, padding:"20px 24px", marginBottom:20, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:20, alignItems:"start" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, fontFamily:"Syne, sans-serif", background:connected?"rgba(13,204,138,.12)":"rgba(123,108,246,.1)", color:connected?C.g:C.acc2, border:connected?"2px solid rgba(13,204,138,.3)":"none" }}>
          {creator.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif", letterSpacing:"-0.5px" }}>{creator.name}</h1>
          <div style={{ fontSize:12, color:C.acc2, fontFamily:"DM Mono, monospace", marginTop:2 }}>{creator.accounts.map(a=>a.handle).join(" · ")}</div>
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" as const }}>
            {creator.accounts.map(a=>(
              <span key={a.id} style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:a.platform==="INSTAGRAM"?"rgba(225,48,108,.12)":a.platform==="YOUTUBE"?"rgba(255,0,0,.1)":"rgba(255,255,255,.05)", color:a.platform==="INSTAGRAM"?"#e1306c":a.platform==="YOUTUBE"?"#ff4040":C.tx2 }}>{a.platform}</span>
            ))}
            <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:connected?"rgba(13,204,138,.12)":"rgba(244,63,94,.12)", color:connected?C.g:C.r }}>
              {connected?"OAuth 연동됨":"미연동"}
            </span>
            {tokenDaysLeft!==null && <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:tokenDaysLeft<=7?"rgba(244,63,94,.12)":"rgba(68,68,90,.2)", color:tokenDaysLeft<=7?C.r:C.tx3 }}>토큰 만료 D-{tokenDaysLeft}</span>}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, minWidth:280 }}>
          {[
            { label:"팔로워", value:connected?fmtKo(followerSnap?.metricValue??null):"—", sub:connected?"OFFICIAL_API":"OAuth 필요" },
            { label:"총 광고비", value:fmtWon(totalFee), sub:`${creator.contents.length}건` },
            { label:"평균 CPV", value:fmtWon(avgCpv), sub:"전체 평균" },
          ].map(s=>(
            <div key={s.label} style={{ background:C.s2, borderRadius:8, padding:"10px 13px" }}>
              <div style={{ fontFamily:"DM Mono, monospace", fontSize:18, fontWeight:500, color:C.tx, letterSpacing:"-1px" }}>{s.value}</div>
              <div style={{ fontSize:10, color:C.tx3, marginTop:2 }}>{s.label}</div>
              <div style={{ fontSize:9, color:C.tx3, fontFamily:"DM Mono, monospace", marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <CreatorTabs connected={connected} contentsCalc={contentsCalc} avgLr={avgLr} creatorId={creator.id} />
    </div>
  );
}
