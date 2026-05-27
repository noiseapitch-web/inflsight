// GET /api/oauth/callback?code=xxx&state=xxx
// Instagram Business Login OAuth 콜백 처리
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInviteToken, encryptToken } from "@/lib/oauth/token";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // invite token
  const error = req.nextUrl.searchParams.get("error");
  const errorDesc = req.nextUrl.searchParams.get("error_description") ?? "";

  // 사용자가 Instagram에서 권한 거부
  if (error) {
    return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=${encodeURIComponent(errorDesc || error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=missing_params`);
  }

  // 토큰 검증
  const verified = verifyInviteToken(state);
  if (!verified) {
    return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=invalid_or_expired_link`);
  }

  // 초대 링크 DB 확인
  const invite = await prisma.oAuthInvite.findUnique({ where: { token: state } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=link_expired_or_used`);
  }

  try {
    // 1. code → short-lived access token
    // 공식 문서: https://api.instagram.com/oauth/access_token
    const redirectUri = `${BASE_URL}/api/oauth/callback`;
    const cleanCode = code.replace(/#_$/, "");
    console.log("[OAuth] token exchange request:", { redirect_uri: redirectUri, code: cleanCode });

    // URLSearchParams는 redirect_uri를 percent-encode해서 Meta 검증 실패
    // connect/page.tsx와 동일하게 raw(비인코딩) 전송
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: [
        `client_id=${encodeURIComponent(process.env.IG_APP_ID ?? "")}`,
        `client_secret=${encodeURIComponent(process.env.IG_APP_SECRET ?? "")}`,
        `grant_type=authorization_code`,
        `redirect_uri=${redirectUri}`,
        `code=${encodeURIComponent(cleanCode)}`,
      ].join("&"),
    });

    const tokenData = await tokenRes.json() as {
      data?: { access_token?: string; user_id?: string; permissions?: string }[];
      access_token?: string;
      user_id?: number | string;
      error_message?: string;
    };

    // 새 API: data 배열 형태, 구버전: 평면 객체
    const shortToken = tokenData.data?.[0]?.access_token ?? tokenData.access_token;
    const userId = tokenData.data?.[0]?.user_id ?? tokenData.user_id;

    if (!shortToken) {
      console.error("[OAuth] token exchange failed:", tokenData);
      return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=token_exchange_failed`);
    }

    // 2. short-lived → long-lived token (60일)
    // 공식 문서: https://graph.instagram.com/access_token
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.IG_APP_SECRET}&access_token=${shortToken}`
    );
    const longData = await longRes.json() as {
      access_token?: string;
      expires_in?: number;
      error?: { message: string };
    };

    if (!longData.access_token) {
      console.error("[OAuth] long-lived token exchange failed:", longData);
      return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=longtoken_failed`);
    }

    const expiry = new Date(Date.now() + (longData.expires_in ?? 5184000) * 1000);
    const encryptedToken = encryptToken(longData.access_token);

    // 3. DB 저장
    await prisma.creatorAccount.updateMany({
      where: { creatorId: verified.creatorId, platform: "INSTAGRAM" },
      data: {
        accessToken:  encryptedToken,
        tokenExpiry:  expiry,
        oauthStatus:  "CONNECTED",
        platformId:   String(userId ?? ""),
        updatedAt:    new Date(),
      },
    });

    // 4. 초대 링크 사용 처리
    await prisma.oAuthInvite.update({
      where: { token: state },
      data: { usedAt: new Date() },
    });

    // 5. 즉시 지표 1회 수집 (실패해도 무시)
    fetch(`${BASE_URL}/api/sync?creatorId=${verified.creatorId}`, { method: "POST" }).catch(() => {});

    return NextResponse.redirect(`${BASE_URL}/oauth/success`);
  } catch (err) {
    console.error("[OAuth] callback error:", err);
    return NextResponse.redirect(`${BASE_URL}/oauth/error?msg=server_error`);
  }
}
