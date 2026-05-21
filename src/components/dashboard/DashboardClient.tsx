"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtWon, fmtPct, fmtKo } from "@/lib/metrics/calculator";
import AddCreatorModal from "@/components/forms/AddCreatorModal";
import AddCampaignModal from "@/components/forms/AddCampaignModal";

const C = {
  bg:"#09090f", s1:"#0f0f18", s2:"#151520", s3:"#1c1c2a",
  bd:"#232336", bd2:"#2d2d45",
  acc:"#7b6cf6", acc2:"#a899ff", ag:"rgba(123,108,246,.12)",
  tx:"#e8e8f2", tx2:"#8080a0", tx3:"#44445a",
  g:"#0dcc8a", gd:"rgba(13,204,138,.12)",
  o:"#f97316", od:"rgba(249,115,22,.12)",
  r:"#f43f5e", rd:"rgba(244,63,94,.12)",
  y:"#f59e0b", yd:"rgba(245,158,11,.12)",
};

interface DashData {
  isEmpty: boolean;
  stats: { creatorCount:number; campaignCount:number; contentCount:number; oauthCount:number; totalFee:number; avgCpv:number|null; avgLr:number|null; };
  recentCampaigns: { id:string; name:string; brandName:string|null; status:string; }[];
  recentContents: { id:string; creatorName:string; platform:string; views:number|null; cpv:number|null; lr:number|null; fee:number|null; src:string; url:string; }[];
  creators: { id:string; name:string; igAcc:{ handle:string; oauthStatus:string } | null; }[];
}

const STATUS_STYLE: Record<string, {bg:string;c:string}> = {
  ACTIVE:    { bg:C.gd, c:C.g },
  DRAFT:     { bg:C.yd, c:C.y },
  COMPLETED: { bg:"rgba(80,80,112,.15)", c:C.tx3 },
  CANCELLED: { bg:C.rd, c:C.r },
};

function StatCard({ label, value, sub, accent }: { label:string; value:string; sub:string; accent?:string }) {
  return (
    <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent??C.acc},transparent)` }} />
      <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace", letterSpacing:".8px", textTransform:"uppercase" as const, marginBottom:7 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif", letterSpacing:"-1px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.tx2, marginTop:5 }}>{sub}</div>
    </div>
  );
}

// 빈 상태 카드
function EmptyCard({ icon, title, desc, action, onClick }: { icon:string; title:string; desc:string; action:string; onClick:()=>void }) {
  return (
    <div style={{ background:C.s1, border:`1px dashed ${C.bd2}`, borderRadius:10, padding:"24px 20px", textAlign:"center" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:600, color:C.tx, marginBottom:6, fontFamily:"Syne, sans-serif" }}>{title}</div>
      <div style={{ fontSize:12, color:C.tx3, lineHeight:1.6, marginBottom:14 }}>{desc}</div>
      <button onClick={onClick} style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
        {action}
      </button>
    </div>
  );
}

export default function DashboardClient({ data }: { data: DashData }) {
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const router = useRouter();
  const { isEmpty, stats, recentCampaigns, recentContents, creators } = data;

  // ── 온보딩 화면 (데이터 없을 때) ──────────────────────
  if (isEmpty) {
    return (
      <div style={{ padding:32, maxWidth:800, margin:"0 auto" }}>
        {/* 환영 헤더 */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:32, fontWeight:800, color:C.tx, fontFamily:"Syne, sans-serif", letterSpacing:"-1px", marginBottom:10 }}>
            INFL<span style={{ color:C.acc2 }}>.</span>SIGHT에 오신 걸 환영해요
          </div>
          <div style={{ fontSize:14, color:C.tx2, lineHeight:1.7 }}>
            크리에이터를 추가하고 캠페인을 만들면<br/>광고 성과가 자동으로 취합됩니다
          </div>
        </div>

        {/* 시작 가이드 */}
        <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:12, padding:24, marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:16, letterSpacing:"1px" }}>// 시작하는 방법</div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:0 }}>
            {[
              { n:"1", icon:"◉", title:"크리에이터 추가", desc:"소속 크리에이터의 Instagram / YouTube / TikTok 계정을 등록하세요", done:false, href:"/creators" },
              { n:"2", icon:"◇", title:"캠페인 생성", desc:"브랜드 캠페인을 만들고 크리에이터를 연결하세요", done:false, href:"/campaigns" },
              { n:"3", icon:"◫", title:"콘텐츠 & 지표 입력", desc:"광고 링크를 등록하고 좋아요·조회수·댓글을 입력하면 CPV가 자동 계산됩니다", done:false, href:"/creators" },
              { n:"4", icon:"⟳", title:"OAuth 연동 (선택)", desc:"크리에이터에게 연동 링크를 보내면 지표가 자동으로 수집됩니다", done:false, href:"/oauth" },
            ].map((s, i) => (
              <div key={s.n}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 0" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:C.s2, border:`1px solid ${C.bd}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.tx3, flexShrink:0, fontFamily:"DM Mono, monospace" }}>
                    {s.n}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.tx, marginBottom:3 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:C.tx2, lineHeight:1.6 }}>{s.desc}</div>
                  </div>
                  <Link href={s.href} style={{ fontSize:11, color:C.acc2, textDecoration:"none", background:C.ag, padding:"5px 12px", borderRadius:6, whiteSpace:"nowrap" as const, flexShrink:0 }}>
                    시작하기 →
                  </Link>
                </div>
                {i < 3 && <div style={{ height:1, background:C.bd, marginLeft:46 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 시작 버튼 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <button onClick={() => setShowAddCreator(true)} style={{ background:C.acc, color:"#fff", border:"none", borderRadius:10, padding:"14px 20px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontFamily:"Syne, sans-serif" }}>
            <span style={{ fontSize:20 }}>◉</span>
            <div style={{ textAlign:"left" as const }}>
              <div>크리에이터 추가</div>
              <div style={{ fontSize:11, fontWeight:400, opacity:.7, marginTop:1 }}>첫 크리에이터를 등록하세요</div>
            </div>
          </button>
          <button onClick={() => setShowAddCampaign(true)} style={{ background:C.s1, color:C.tx, border:`1px solid ${C.bd}`, borderRadius:10, padding:"14px 20px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontFamily:"Syne, sans-serif" }}>
            <span style={{ fontSize:20 }}>◇</span>
            <div style={{ textAlign:"left" as const }}>
              <div>캠페인 생성</div>
              <div style={{ fontSize:11, fontWeight:400, color:C.tx3, marginTop:1 }}>브랜드 캠페인을 만드세요</div>
            </div>
          </button>
        </div>

        {showAddCreator && <AddCreatorModal onClose={() => setShowAddCreator(false)} onSuccess={() => router.refresh()} />}
        {showAddCampaign && <AddCampaignModal onClose={() => setShowAddCampaign(false)} onSuccess={() => router.refresh()} />}
      </div>
    );
  }

  // ── 데이터 있을 때 대시보드 ────────────────────────────
  return (
    <div style={{ padding:24 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        <StatCard label="CREATORS"  value={String(stats.creatorCount)}  sub={`OAuth ${stats.oauthCount}명 연동`} accent={C.acc} />
        <StatCard label="CAMPAIGNS" value={String(stats.campaignCount)} sub={`콘텐츠 ${stats.contentCount}개`} accent={C.acc} />
        <StatCard label="총 광고비"  value={fmtWon(stats.totalFee)}       sub="누적 집행" accent={C.g} />
        <StatCard label="평균 CPV"   value={fmtWon(stats.avgCpv)}         sub={`좋아요율 ${fmtPct(stats.avgLr)}`} accent={C.y} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14 }}>

        {/* 왼쪽: 최근 성과 */}
        <div style={{ display:"flex", flexDirection:"column" as const, gap:14 }}>

          {/* 최근 콘텐츠 성과 */}
          <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.tx }}>최근 콘텐츠 성과</span>
              <Link href="/sheet" style={{ fontSize:11, color:C.tx2, textDecoration:"none" }}>전체 보기 →</Link>
            </div>

            {recentContents.length === 0 ? (
              <div style={{ padding:"32px 16px", textAlign:"center", color:C.tx3, fontSize:12 }}>
                아직 콘텐츠 데이터가 없어요
                <div style={{ marginTop:10 }}>
                  <Link href="/creators" style={{ color:C.acc2, textDecoration:"none", fontSize:12 }}>크리에이터에서 콘텐츠 추가 →</Link>
                </div>
              </div>
            ) : (
              <div>
                {recentContents.map((c, i) => {
                  const cpvC = c.cpv === null ? C.tx3 : c.cpv < 80 ? C.g : c.cpv < 150 ? C.y : C.o;
                  const lrC  = c.lr  === null ? C.tx3 : c.lr  > 1.5 ? C.g : c.lr  > 0.5 ? C.y : C.r;
                  const platC: Record<string,string> = { INSTAGRAM:"#e1306c", YOUTUBE:"#ff4040", TIKTOK:C.tx2 };
                  const platL: Record<string,string> = { INSTAGRAM:"IG", YOUTUBE:"YT", TIKTOK:"TT" };
                  const isLast = i === recentContents.length - 1;
                  return (
                    <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1fr auto auto auto auto", gap:0, alignItems:"center", padding:"11px 16px", borderBottom:isLast?"none":`1px solid ${C.bd}` }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:500, color:C.tx }}>{c.creatorName}</div>
                        <div style={{ fontSize:10, color:C.tx3, marginTop:1, fontFamily:"DM Mono, monospace" }}>
                          <span style={{ color:platC[c.platform]??C.tx2 }}>{platL[c.platform]??c.platform}</span>
                          {c.src === "OFFICIAL_API"
                            ? <span style={{ marginLeft:6, color:C.g }}>● API</span>
                            : <span style={{ marginLeft:6, color:C.o }}>● MANUAL</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" as const, padding:"0 16px" }}>
                        <div style={{ fontSize:12, fontFamily:"DM Mono, monospace", color:C.tx }}>{fmtKo(c.views)}</div>
                        <div style={{ fontSize:10, color:C.tx3 }}>조회수</div>
                      </div>
                      <div style={{ textAlign:"right" as const, padding:"0 16px" }}>
                        <div style={{ fontSize:12, fontFamily:"DM Mono, monospace", color:lrC }}>{fmtPct(c.lr)}</div>
                        <div style={{ fontSize:10, color:C.tx3 }}>좋아요율</div>
                      </div>
                      <div style={{ textAlign:"right" as const, padding:"0 16px" }}>
                        <div style={{ fontSize:12, fontFamily:"DM Mono, monospace", color:cpvC }}>{fmtWon(c.cpv)}</div>
                        <div style={{ fontSize:10, color:C.tx3 }}>CPV</div>
                      </div>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color:C.tx3, textDecoration:"none", paddingLeft:8, fontSize:14 }}>↗</a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 최근 캠페인 */}
          <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.tx }}>캠페인</span>
              <Link href="/campaigns" style={{ fontSize:11, color:C.tx2, textDecoration:"none" }}>전체 보기 →</Link>
            </div>
            {recentCampaigns.length === 0 ? (
              <div style={{ padding:"24px 16px", textAlign:"center", color:C.tx3, fontSize:12 }}>
                캠페인이 없어요
                <button onClick={() => setShowAddCampaign(true)} style={{ display:"block", margin:"10px auto 0", background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>+ 캠페인 생성</button>
              </div>
            ) : (
              recentCampaigns.map((c, i) => {
                const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT;
                const isLast = i === recentCampaigns.length - 1;
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px", borderBottom:isLast?"none":`1px solid ${C.bd}` }}>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:500, color:C.tx }}>{c.brandName ? `${c.brandName} — ` : ""}{c.name}</div>
                    </div>
                    <span style={{ fontSize:10, fontFamily:"DM Mono, monospace", padding:"2px 8px", borderRadius:20, background:st.bg, color:st.c }}>{c.status}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 오른쪽 사이드 */}
        <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>

          {/* 크리에이터 현황 */}
          <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.tx }}>크리에이터</span>
              <Link href="/creators" style={{ fontSize:11, color:C.tx2, textDecoration:"none" }}>전체 →</Link>
            </div>
            {creators.length === 0 ? (
              <div style={{ padding:"20px 16px", textAlign:"center", color:C.tx3, fontSize:12 }}>
                <button onClick={() => setShowAddCreator(true)} style={{ background:C.acc, color:"#fff", border:"none", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>+ 크리에이터 추가</button>
              </div>
            ) : (
              creators.map((cr, i) => {
                const conn = cr.igAcc?.oauthStatus === "CONNECTED";
                const isLast = i === creators.length - 1;
                return (
                  <Link key={cr.id} href={`/creators/${cr.id}`} style={{ textDecoration:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:isLast?"none":`1px solid ${C.bd}` }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background:conn?C.gd:C.ag, color:conn?C.g:C.acc2, flexShrink:0 }}>
                        {cr.name.charAt(0)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:500, color:C.tx, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cr.name}</div>
                        <div style={{ fontSize:10, color:C.tx3, fontFamily:"DM Mono, monospace" }}>{cr.igAcc?.handle ?? ""}</div>
                      </div>
                      <span style={{ fontSize:9, fontFamily:"DM Mono, monospace", padding:"2px 6px", borderRadius:20, background:conn?C.gd:C.rd, color:conn?C.g:C.r, flexShrink:0 }}>
                        {conn ? "연동" : "미연동"}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* 빠른 액션 */}
          <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.tx, marginBottom:12 }}>빠른 실행</div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:7 }}>
              {[
                { label:"+ 크리에이터 추가",  action:() => setShowAddCreator(true),  accent:C.acc },
                { label:"+ 캠페인 생성",       action:() => setShowAddCampaign(true), accent:C.acc },
                { label:"OAuth 연동 관리",     href:"/oauth",    accent:C.g },
                { label:"성과 시트 보기",      href:"/sheet",    accent:C.tx2 },
              ].map(item => (
                item.href ? (
                  <Link key={item.label} href={item.href} style={{ display:"block", padding:"8px 12px", borderRadius:7, border:`1px solid ${C.bd}`, fontSize:12, color:item.accent, textDecoration:"none", transition:"background .12s" }}>
                    {item.label}
                  </Link>
                ) : (
                  <button key={item.label} onClick={item.action} style={{ display:"block", width:"100%", padding:"8px 12px", borderRadius:7, border:`1px solid ${C.bd}`, fontSize:12, color:item.accent, background:"transparent", cursor:"pointer", textAlign:"left" as const }}>
                    {item.label}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* OAuth 미연동 알림 */}
          {stats.oauthCount < stats.creatorCount && (
            <div style={{ background:C.od, border:"1px solid rgba(249,115,22,.2)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.o, marginBottom:4 }}>OAuth 미연동 크리에이터</div>
              <div style={{ fontSize:11, color:C.o, opacity:.8, lineHeight:1.5, marginBottom:10 }}>
                {stats.creatorCount - stats.oauthCount}명이 미연동 상태예요.<br/>연동하면 지표가 자동 수집됩니다.
              </div>
              <Link href="/oauth" style={{ fontSize:11, color:C.o, textDecoration:"none", background:"rgba(249,115,22,.2)", padding:"5px 10px", borderRadius:6, display:"inline-block" }}>
                연동 링크 발송 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {showAddCreator && <AddCreatorModal onClose={() => setShowAddCreator(false)} onSuccess={() => router.refresh()} />}
      {showAddCampaign && <AddCampaignModal onClose={() => setShowAddCampaign(false)} onSuccess={() => router.refresh()} />}
    </div>
  );
}
