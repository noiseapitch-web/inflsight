"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtWon, fmtPct, fmtKo } from "@/lib/metrics/calculator";
import AddMetricModal from "@/components/forms/AddMetricModal";
import AddContentModal from "@/components/forms/AddContentModal";

const C = { s1:"#0f0f18",s2:"#151520",s3:"#1c1c2a",bd:"#232336",bd2:"#2d2d45",acc:"#7b6cf6",acc2:"#a899ff",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",g:"#0dcc8a",o:"#f97316",r:"#f43f5e",y:"#f59e0b" };

interface ContentRow {
  id:string; url:string; contentType:string|null; platform:string;
  postedAt:string|null; fee:number|null;
  campaign:{id:string;name:string;brandName:string|null}|null;
  views:number|null; likes:number|null; comments:number|null;
  src:string; conf:string; cpv:number|null; lr:number|null;
}
interface Props { connected:boolean; contentsCalc:ContentRow[]; avgLr:number|null; creatorId:string; }

function SrcBadge({ src }:{src:string}) {
  const api = src === "OFFICIAL_API";
  return <span style={{fontSize:9,fontFamily:"DM Mono, monospace",padding:"2px 7px",borderRadius:20,background:api?"rgba(13,204,138,.12)":"rgba(249,115,22,.12)",color:api?C.g:C.o}}>{api?"API":"MANUAL"}</span>;
}
function ConfBadge({ conf }:{conf:string}) {
  const s = conf==="HIGH"?{bg:"rgba(13,204,138,.12)",c:C.g,l:"HIGH"}:conf==="MEDIUM"?{bg:"rgba(245,158,11,.12)",c:C.y,l:"MED"}:{bg:"rgba(244,63,94,.12)",c:C.r,l:"LOW"};
  return <span style={{fontSize:9,fontFamily:"DM Mono, monospace",padding:"2px 7px",borderRadius:20,background:s.bg,color:s.c}}>{s.l}</span>;
}
function PlatBadge({ p }:{p:string}) {
  const m:{[k:string]:{bg:string;c:string;l:string}}={INSTAGRAM:{bg:"rgba(225,48,108,.12)",c:"#e1306c",l:"IG"},YOUTUBE:{bg:"rgba(255,0,0,.1)",c:"#ff4040",l:"YT"},TIKTOK:{bg:"rgba(255,255,255,.05)",c:C.tx2,l:"TT"}};
  const s=m[p]??{bg:C.s2,c:C.tx2,l:p.slice(0,2)};
  return <span style={{fontSize:10,fontFamily:"DM Mono, monospace",padding:"2px 7px",borderRadius:20,background:s.bg,color:s.c}}>{s.l}</span>;
}

const TABS = [
  {id:"account",label:"계정 데이터",locked:true},
  {id:"cases",  label:"광고 진행 사례",locked:false},
  {id:"addata", label:"광고 데이터",locked:false},
];

export default function CreatorTabs({ connected, contentsCalc, avgLr, creatorId }:Props) {
  const [active, setActive] = useState(connected ? "account" : "cases");
  const [metricModal, setMetricModal] = useState<ContentRow | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const router = useRouter();

  return (
    <div>
      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.bd}`,marginBottom:20}}>
        {TABS.map(t => {
          const locked = t.locked && !connected;
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => !locked && setActive(t.id)} disabled={locked}
              style={{padding:"9px 18px",fontSize:12.5,color:locked?C.tx3:on?C.acc2:C.tx2,borderBottom:`2px solid ${on?C.acc:"transparent"}`,background:"none",border:"none",cursor:locked?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,transition:"color .12s",fontFamily:"DM Sans, sans-serif"}}>
              {locked && "🔒"} {t.label}
            </button>
          );
        })}
      </div>

      {/* 계정 데이터 */}
      {active === "account" && (
        <div>
          <div style={{background:"rgba(13,204,138,.08)",border:"1px solid rgba(13,204,138,.15)",borderRadius:8,padding:"10px 14px",fontSize:11.5,color:C.g,marginBottom:16}}>
            ✓ Instagram Graph API 연동 · source: OFFICIAL_API · confidence: HIGH
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
            {[{label:"팔로워 수",v:"연동 후 수집",sub:"OFFICIAL_API"},{label:"프로필 방문 (주간)",v:"연동 후 수집",sub:"OFFICIAL_API"},{label:"계정 도달 (주간)",v:"연동 후 수집",sub:"OFFICIAL_API"}].map(s=>(
              <div key={s.label} style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:C.tx3,fontFamily:"DM Mono, monospace",textTransform:"uppercase" as const,letterSpacing:".8px",marginBottom:6}}>{s.label}</div>
                <div style={{fontFamily:"DM Mono, monospace",fontSize:18,fontWeight:500,color:C.tx3}}>{s.v}</div>
                <div style={{fontSize:10,color:C.tx3,marginTop:3}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 광고 진행 사례 */}
      {active === "cases" && (
        <div>
          {!connected && <div style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.15)",borderRadius:8,padding:"10px 14px",fontSize:11.5,color:C.o,marginBottom:12}}>⚠ 미연동 · 전체 MANUAL_INPUT · confidence: MEDIUM</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{background:"rgba(123,108,246,.08)",border:"1px solid rgba(123,108,246,.15)",borderRadius:8,padding:"8px 14px",fontSize:11.5,color:C.acc2,flex:1,marginRight:10}}>
              총 {contentsCalc.length}건의 광고 진행 이력
            </div>
            <button onClick={() => setShowAddContent(true)}
              style={{background:C.acc,color:"#fff",border:"none",borderRadius:7,padding:"7px 13px",fontSize:11.5,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap" as const}}>
              + 콘텐츠 추가
            </button>
          </div>
          <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
            {contentsCalc.length === 0 && (
              <div style={{textAlign:"center",padding:"32px 20px",color:C.tx3}}>
                <div style={{fontSize:12,marginBottom:8}}>등록된 콘텐츠가 없어요</div>
                <button onClick={() => setShowAddContent(true)} style={{background:C.acc,color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,cursor:"pointer"}}>+ 콘텐츠 추가하기</button>
              </div>
            )}
            {contentsCalc.map(c => {
              const cpvC=c.cpv===null?C.tx3:c.cpv<80?C.g:c.cpv<150?C.y:C.o;
              const lrC=c.lr===null?C.tx3:c.lr>1.5?C.g:c.lr>0.5?C.y:C.r;
              const emoji=c.campaign?.brandName?.includes("뷰티")?"💄":c.campaign?.brandName?.includes("패션")?"👗":c.campaign?.brandName?.includes("식음료")?"🍽️":"📣";
              const hasMetrics = c.views !== null || c.likes !== null;
              return (
                <div key={c.id} style={{background:C.s2,borderRadius:8,padding:"12px 15px",border:`1px solid ${C.bd}`,display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:6,background:C.s1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{emoji}</div>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:600,color:C.tx}}>{c.campaign?.brandName??c.campaign?.name??"미지정 캠페인"}</div>
                    <div style={{fontSize:10,color:C.tx3,fontFamily:"DM Mono, monospace",marginTop:2}}>{c.postedAt??"날짜 미입력"} · {c.contentType??"content"}</div>
                    <div style={{display:"flex",gap:5,marginTop:5}}>
                      <PlatBadge p={c.platform}/>
                      <SrcBadge src={c.src}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    {hasMetrics ? (
                      <>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"DM Mono, monospace",fontSize:12,color:cpvC}}>{fmtWon(c.cpv)}</div>
                          <div style={{fontSize:10,color:C.tx3}}>CPV</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"DM Mono, monospace",fontSize:12,color:lrC}}>{fmtPct(c.lr)}</div>
                          <div style={{fontSize:10,color:C.tx3}}>좋아요율</div>
                        </div>
                      </>
                    ) : (
                      <div style={{fontSize:11,color:C.tx3}}>지표 없음</div>
                    )}
                    <button onClick={() => setMetricModal(c)}
                      style={{background:"rgba(123,108,246,.12)",color:C.acc2,border:"1px solid rgba(123,108,246,.2)",borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap" as const}}>
                      {hasMetrics ? "지표 수정" : "+ 지표 입력"}
                    </button>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{color:C.tx3,textDecoration:"none",fontSize:14}}>↗</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 광고 데이터 테이블 */}
      {active === "addata" && (
        <div>
          {!connected && <div style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.15)",borderRadius:8,padding:"10px 14px",fontSize:11.5,color:C.o,marginBottom:12}}>⚠ 전체 MANUAL_INPUT · confidence: MEDIUM</div>}
          {contentsCalc.length === 0 ? (
            <div style={{textAlign:"center",padding:"32px 20px",color:C.tx3,fontSize:12}}>등록된 콘텐츠가 없어요</div>
          ) : (
            <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      {["게시일","플랫폼","콘텐츠","조회수","좋아요","댓글","좋아요율","광고비","CPV","source","conf",""].map(h=>(
                        <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,color:C.tx3,fontFamily:"DM Mono, monospace",letterSpacing:".8px",textTransform:"uppercase" as const,borderBottom:`1px solid ${C.bd}`,background:C.s2,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contentsCalc.map(c => {
                      const cpvC=c.cpv===null?C.tx3:c.cpv<80?C.g:c.cpv<150?C.y:C.o;
                      const lrC=c.lr===null?C.tx3:c.lr>1.5?C.g:c.lr>0.5?C.y:C.r;
                      const shortUrl = c.url.replace(/https?:\/\/(www\.)?/,"").slice(0,22)+"...";
                      return (
                        <tr key={c.id} style={{borderBottom:`1px solid ${C.bd}`}}>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:10,color:C.tx3,whiteSpace:"nowrap"}}>{c.postedAt??"—"}</td>
                          <td style={{padding:"10px 13px"}}><PlatBadge p={c.platform}/></td>
                          <td style={{padding:"10px 13px"}}><a href={c.url} target="_blank" rel="noopener noreferrer" style={{color:C.acc2,fontFamily:"DM Mono, monospace",fontSize:11,textDecoration:"none"}}>{shortUrl}</a></td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fmtKo(c.views)}</td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fmtKo(c.likes)}</td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fmtKo(c.comments)}</td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:lrC}}>{fmtPct(c.lr)}</td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fmtWon(c.fee??null)}</td>
                          <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:cpvC}}>{fmtWon(c.cpv)}</td>
                          <td style={{padding:"10px 13px"}}><SrcBadge src={c.src}/></td>
                          <td style={{padding:"10px 13px"}}><ConfBadge conf={c.conf}/></td>
                          <td style={{padding:"10px 13px"}}>
                            <button onClick={() => setMetricModal(c)}
                              style={{background:"rgba(123,108,246,.1)",color:C.acc2,border:"none",borderRadius:5,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>
                              수정
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{padding:"8px 14px",background:C.s2,borderTop:`1px solid ${C.bd}`,fontSize:10,color:C.tx3}}>
                CPV = 광고비 ÷ 조회수 · 좋아요율 = 좋아요 ÷ 조회수 × 100
              </div>
            </div>
          )}
        </div>
      )}

      {/* 수동 지표 입력 모달 */}
      {metricModal && (
        <AddMetricModal
          contentId={metricModal.id}
          creatorId={creatorId}
          contentUrl={metricModal.url}
          onClose={() => setMetricModal(null)}
          onSuccess={() => { setMetricModal(null); router.refresh(); }}
        />
      )}

      {/* 콘텐츠 추가 모달 */}
      {showAddContent && (
        <AddContentModal
          onClose={() => setShowAddContent(false)}
          onSuccess={() => { setShowAddContent(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
