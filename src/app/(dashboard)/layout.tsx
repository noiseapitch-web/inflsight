import Link from "next/link";
import { type ReactNode } from "react";

const S = {
  shell: { display:"grid", gridTemplateColumns:"210px 1fr", height:"100vh", overflow:"hidden", background:"#09090f" } as React.CSSProperties,
  sidebar: { background:"#0f0f18", borderRight:"1px solid #232336", display:"flex", flexDirection:"column" as const, height:"100vh", overflowY:"auto" as const },
  logo: { padding:"20px 18px 16px", borderBottom:"1px solid #232336" },
  logoMark: { fontSize:16, fontWeight:800, color:"#e8e8f2", display:"flex", alignItems:"center", gap:8, fontFamily:"Syne, sans-serif", letterSpacing:"-0.4px" },
  logoDot: { width:7, height:7, borderRadius:"50%", background:"#7b6cf6", boxShadow:"0 0 10px rgba(123,108,246,.5)" },
  logoSub: { fontSize:10, color:"#44445a", fontFamily:"DM Mono, monospace", marginTop:3 },
  nav: { flex:1, padding:"10px 10px" },
  navGroup: { marginBottom:18 },
  navLabel: { fontSize:"9.5px", color:"#44445a", fontFamily:"DM Mono, monospace", letterSpacing:"1.5px", textTransform:"uppercase" as const, padding:"0 8px", marginBottom:5, display:"block" },
  footer: { padding:"12px 16px", borderTop:"1px solid #232336" },
  footerTxt: { display:"flex", alignItems:"center", gap:7, fontSize:11, color:"#44445a", fontFamily:"DM Mono, monospace" },
  dot: { width:6, height:6, borderRadius:"50%", background:"#0dcc8a" },
  main: { overflowY:"auto" as const, background:"#09090f" },
};

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 10px", borderRadius:7, fontSize:12.5, color:"#8080a0", textDecoration:"none", marginBottom:2, transition:"all .12s" }}
    >
      <span style={{fontSize:15}}>{icon}</span> {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}>
            <div style={S.logoDot} />
            INFL<span style={{color:"#a899ff"}}>.</span>SIGHT
          </div>
          <div style={S.logoSub}>인플루언서 인사이트 플랫폼</div>
        </div>
        <nav style={S.nav}>
          <div style={S.navGroup}>
            <span style={S.navLabel}>MAIN</span>
            <NavItem href="/"          label="대시보드"    icon="◈" />
            <NavItem href="/creators"  label="크리에이터"  icon="◉" />
            <NavItem href="/campaigns" label="캠페인"      icon="◇" />
          </div>
          <div style={S.navGroup}>
            <span style={S.navLabel}>DATA</span>
            <NavItem href="/sheet" label="성과 시트" icon="◫" />
            <NavItem href="/oauth" label="OAuth 관리" icon="⟳" />
          </div>
        </nav>
        <div style={S.footer}>
          <div style={S.footerTxt}>
            <div style={S.dot} /> 자동수집 활성 · 매일 09:00
          </div>
        </div>
      </aside>
      <main style={S.main}>{children}</main>
    </div>
  );
}
