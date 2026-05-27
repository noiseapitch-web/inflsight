// 크리에이터가 연동 링크 클릭 시 보이는 페이지
// Instagram Business Login API로 리다이렉트
import { verifyInviteToken } from "@/lib/oauth/token";
import { prisma } from "@/lib/prisma";

const C = { bg:"#09090f", s1:"#0f0f18", bd:"#232336", acc:"#7b6cf6", acc2:"#a899ff", tx:"#e8e8f2", tx2:"#8080a0", tx3:"#44445a", r:"#f43f5e", g:"#0dcc8a" };

export default async function OAuthConnectPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;

  if (!token) {
    return <ErrorPage msg="잘못된 링크입니다" />;
  }

  const verified = verifyInviteToken(token);
  if (!verified) {
    return <ErrorPage msg="링크가 만료되었거나 유효하지 않습니다" />;
  }

  const invite = await prisma.oAuthInvite.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return <ErrorPage msg="이미 사용된 링크이거나 만료되었습니다" />;
  }

  const creator = await prisma.creator.findUnique({
    where: { id: verified.creatorId },
    select: { name: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const appId = process.env.IG_APP_ID ?? "";

  // Instagram Business Login OAuth URL — Meta가 제공한 형식 그대로 사용
  // searchParams.set() 쓰면 redirect_uri가 자동 인코딩되어 callback에서 토큰 교환 실패함
  console.log("[OAuth] connect page redirect_uri:", `${baseUrl}/api/oauth/callback`);
  const igAuthUrl =
    `https://www.instagram.com/oauth/authorize` +
    `?force_reauth=true` +
    `&client_id=${appId}` +
    `&redirect_uri=${baseUrl}/api/oauth/callback` +
    `&response_type=code` +
    `&scope=instagram_business_basic,instagram_business_manage_insights` +
    `&state=${token}`;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:C.s1, border:`1px solid ${C.bd}`, borderRadius:14, padding:36, maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:20, fontWeight:800, color:C.tx, fontFamily:"Syne, sans-serif", marginBottom:6 }}>
          INFL<span style={{ color:C.acc2 }}>.</span>SIGHT
        </div>
        <div style={{ fontSize:11, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:28 }}>인플루언서 인사이트 플랫폼</div>

        {creator && (
          <div style={{ fontSize:16, fontWeight:600, color:C.tx, marginBottom:8 }}>
            {creator.name}님
          </div>
        )}

        <div style={{ fontSize:13, color:C.tx2, lineHeight:1.7, marginBottom:28 }}>
          Instagram 비즈니스 계정을 연동하면<br/>
          광고 성과 데이터가 자동으로 수집됩니다.<br/>
          <span style={{ fontSize:11, color:C.tx3 }}>아래 버튼을 눌러 Instagram에 로그인해주세요</span>
        </div>

        <div style={{ background:"#151520", border:`1px solid ${C.bd}`, borderRadius:8, padding:"12px 16px", marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:11, color:C.tx3, fontFamily:"DM Mono, monospace", marginBottom:8 }}>수집되는 정보</div>
          {["게시물 좋아요·댓글·공유수", "릴스 조회수·도달", "프로필 방문수", "팔로워 수"].map(item => (
            <div key={item} style={{ fontSize:12, color:C.tx2, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:C.g, fontSize:10 }}>✓</span> {item}
            </div>
          ))}
          <div style={{ fontSize:11, color:C.tx3, marginTop:8, paddingTop:8, borderTop:`1px solid ${C.bd}` }}>
            ※ 개인 메시지, 비밀번호 등은 수집하지 않습니다
          </div>
        </div>

        <a href={igAuthUrl}
          style={{ display:"block", background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", color:"#fff", textDecoration:"none", borderRadius:9, padding:"13px 20px", fontSize:14, fontWeight:600, marginBottom:12 }}>
          Instagram으로 연동하기
        </a>

        <div style={{ fontSize:11, color:C.tx3 }}>
          이 링크는 24시간 후 만료됩니다
        </div>
      </div>
    </div>
  );
}

function ErrorPage({ msg }: { msg: string }) {
  return (
    <div style={{ minHeight:"100vh", background:"#09090f", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#0f0f18", border:"1px solid #232336", borderRadius:14, padding:36, maxWidth:380, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:16, fontWeight:600, color:"#f43f5e", marginBottom:8 }}>링크 오류</div>
        <div style={{ fontSize:13, color:"#8080a0", lineHeight:1.6 }}>{msg}</div>
        <div style={{ fontSize:11, color:"#44445a", marginTop:16 }}>담당자에게 새 링크를 요청해주세요</div>
      </div>
    </div>
  );
}
