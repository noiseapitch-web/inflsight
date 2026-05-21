"use client";
import { useState } from "react";

const C = { s1:"#0f0f18",s2:"#151520",bd:"#232336",bd2:"#2d2d45",tx:"#e8e8f2",tx2:"#8080a0",tx3:"#44445a",acc:"#7b6cf6",acc2:"#a899ff",g:"#0dcc8a",o:"#f97316",r:"#f43f5e",y:"#f59e0b" };

interface Row { id:string;creatorName:string;brand:string;platform:string;url:string;postedAt:string;views:number|null;likes:number|null;comments:number|null;fee:number;cpv:number|null;lr:number|null;src:string; }

const fN=(n:number|null)=>n===null?"—":Math.round(n).toLocaleString("ko-KR");
const fW=(n:number|null)=>n===null?"—":"₩"+Math.round(n).toLocaleString("ko-KR");
const fP=(n:number|null)=>n===null?"—":n.toFixed(2)+"%";
const cpvC=(v:number|null)=>v===null?C.tx3:v<80?C.g:v<150?C.y:C.o;
const lrC=(v:number|null)=>v===null?C.tx3:v>1.5?C.g:v>0.5?C.y:C.r;
const calcCPV=(fee:number,views:number|null)=>views&&views>0?fee/views:null;
const calcLR=(likes:number|null,views:number|null)=>likes!==null&&views&&views>0?(likes/views)*100:null;

function PlatBadge({p}:{p:string}){
  const m:{[k:string]:{bg:string;c:string;l:string}}={INSTAGRAM:{bg:"rgba(225,48,108,.12)",c:"#e1306c",l:"IG"},YOUTUBE:{bg:"rgba(255,0,0,.1)",c:"#ff4040",l:"YT"},TIKTOK:{bg:"rgba(255,255,255,.05)",c:C.tx2,l:"TT"}};
  const s=m[p]??{bg:C.s2,c:C.tx2,l:p.slice(0,2)};
  return <span style={{fontSize:10,fontFamily:"DM Mono, monospace",padding:"2px 7px",borderRadius:20,background:s.bg,color:s.c}}>{s.l}</span>;
}

export default function SheetTable({initialRows,totalFee:iT,avgCpv:iA}:{initialRows:Row[];totalFee:number;avgCpv:number|null}){
  const [rows,setRows]=useState(initialRows);
  const updateFee=(id:string,val:string)=>{ const fee=parseInt(val)||0; setRows(p=>p.map(r=>r.id===id?{...r,fee}:r)); };
  const total=rows.reduce((s,r)=>s+r.fee,0);
  const cpvList=rows.map(r=>calcCPV(r.fee,r.views)).filter((v):v is number=>v!==null);
  const avg=cpvList.length?cpvList.reduce((a,b)=>a+b)/cpvList.length:null;

  return (
    <div style={{background:C.s1,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
          <thead>
            <tr>
              {["게시일","크리에이터","브랜드","플랫폼","조회수","좋아요","댓글","좋아요율","광고비(₩)","CPV","단가/1K","source"].map(h=>(
                <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:10,color:C.tx3,fontFamily:"DM Mono, monospace",letterSpacing:".8px",textTransform:"uppercase" as const,borderBottom:`1px solid ${C.bd}`,background:C.s2,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>{
              const cpv=calcCPV(r.fee,r.views);
              const lr=calcLR(r.likes,r.views);
              const cpm=r.views&&r.views>0?(r.fee/r.views)*1000:null;
              return (
                <tr key={r.id} style={{borderBottom:`1px solid ${C.bd}`}}>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:10,color:C.tx3,whiteSpace:"nowrap"}}>{r.postedAt}</td>
                  <td style={{padding:"10px 13px",fontSize:12,fontWeight:500,color:C.tx}}>{r.creatorName}</td>
                  <td style={{padding:"10px 13px",fontSize:12,color:C.tx2}}>{r.brand}</td>
                  <td style={{padding:"10px 13px"}}><PlatBadge p={r.platform}/></td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fN(r.views)}</td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fN(r.likes)}</td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:C.tx}}>{fN(r.comments)}</td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:lrC(lr)}}>{fP(lr)}</td>
                  <td style={{padding:"10px 13px"}}>
                    <input type="number" value={r.fee} onChange={e=>updateFee(r.id,e.target.value)} step={100000}
                      style={{background:C.s2,border:`1px solid ${C.bd}`,borderRadius:5,padding:"4px 8px",color:C.tx,fontFamily:"DM Mono, monospace",fontSize:11,width:110,textAlign:"right",outline:"none"}}
                    />
                  </td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:12,color:cpvC(cpv)}}>{fW(cpv)}</td>
                  <td style={{padding:"10px 13px",fontFamily:"DM Mono, monospace",fontSize:11,color:C.tx2}}>{fW(cpm)}</td>
                  <td style={{padding:"10px 13px"}}>
                    <span style={{fontSize:9,fontFamily:"DM Mono, monospace",padding:"2px 7px",borderRadius:20,background:r.src==="OFFICIAL_API"?"rgba(13,204,138,.12)":"rgba(249,115,22,.12)",color:r.src==="OFFICIAL_API"?C.g:C.o}}>
                      {r.src==="OFFICIAL_API"?"API":"MANUAL"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{padding:"9px 14px",background:C.s2,borderTop:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",fontSize:11,color:C.tx3}}>
        <span>{rows.length}건</span>
        <span style={{fontFamily:"DM Mono, monospace"}}>
          광고비 합계: <span style={{color:C.tx,marginLeft:4}}>{fW(total)}</span>
          &nbsp;·&nbsp; 평균 CPV: <span style={{color:C.acc2,marginLeft:4}}>{fW(avg)}</span>
        </span>
      </div>
    </div>
  );
}
