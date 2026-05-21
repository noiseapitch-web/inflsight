const C = { bg:"#09090f", s1:"#0f0f18", bd:"#232336", tx:"#e8e8f2", tx2:"#8080a0", tx3:"#44445a", r:"#f43f5e" };

const ERROR_MESSAGES: Record<string, string> = {
  missing_params:         "링크가 올바르지 않습니다",
  invalid_or_expired_link:"링크가 만료되었습니다 (24시간)",
  link_expired_or_used:   "이미 사용된 링크입니다",
  token_exchange_failed:  "Instagram 인증에 실패했습니다",
  longtoken_failed:       "토큰 발급에 실패했습니다",
  server_error:           "서버 오류가 발생했습니다",
  access_denied:          "Instagram 연동을 취소했습니다",
};

export default function OAuthErrorPage({ searchParams }: { searchParams: { msg?: string } }) {
  const rawMsg = searchParams.msg ?? "unknown_error";
  const msg = ERROR_MESSAGES[rawMsg] ?? rawMsg;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.s1, border:"1px solid rgba(244,63,94,.2)", borderRadius:14, padding:36, maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(244,63,94,.12)", border:"2px solid rgba(244,63,94,.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>
          ✕
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:C.r, fontFamily:"Syne, sans-serif", marginBottom:8 }}>
          연동 실패
        </div>
        <div style={{ fontSize:13, color:C.tx2, lineHeight:1.7, marginBottom:16 }}>{msg}</div>
        <div style={{ fontSize:11, color:C.tx3 }}>담당자에게 새 연동 링크를 요청해주세요</div>
      </div>
    </div>
  );
}
