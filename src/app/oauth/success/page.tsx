const C = { bg:"#09090f", s1:"#0f0f18", bd:"#232336", acc2:"#a899ff", tx:"#e8e8f2", tx2:"#8080a0", tx3:"#44445a", g:"#0dcc8a" };

export default function OAuthSuccessPage() {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.s1, border:"1px solid rgba(13,204,138,.2)", borderRadius:14, padding:36, maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(13,204,138,.12)", border:"2px solid rgba(13,204,138,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>
          ✓
        </div>
        <div style={{ fontSize:20, fontWeight:700, color:C.tx, fontFamily:"Syne, sans-serif", marginBottom:8 }}>
          연동 완료!
        </div>
        <div style={{ fontSize:13, color:C.tx2, lineHeight:1.7, marginBottom:20 }}>
          Instagram 계정이 성공적으로 연동되었습니다.<br/>
          이제부터 광고 성과 데이터가 자동으로 수집됩니다.
        </div>
        <div style={{ background:"#151520", border:`1px solid ${C.bd}`, borderRadius:8, padding:"12px 16px", fontSize:12, color:C.tx2, lineHeight:1.6 }}>
          📊 매일 자동 수집됩니다<br/>
          🔒 언제든지 연동을 해제할 수 있습니다
        </div>
        <div style={{ fontSize:11, color:C.tx3, marginTop:20 }}>
          이 페이지를 닫아도 됩니다
        </div>
      </div>
    </div>
  );
}
