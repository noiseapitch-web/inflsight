export const dynamic = "force-dynamic";

// POST /api/oauth/generate
// 크리에이터용 OAuth 연동 링크 생성
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteToken } from "@/lib/oauth/token";
import { ok, fail, handleError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const { creatorId } = await req.json();
    if (!creatorId) return fail("creatorId 필요", 400);

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { accounts: { where: { platform: "INSTAGRAM" } } },
    });
    if (!creator) return fail("크리에이터를 찾을 수 없습니다", 404);
    if (creator.accounts.length === 0) return fail("Instagram 계정이 등록되지 않은 크리에이터입니다", 400);

    const token = generateInviteToken(creatorId);
    const expiresAt = new Date(Date.now() + 86_400_000); // 24시간

    // 기존 미사용 초대 토큰 무효화
    await prisma.oAuthInvite.updateMany({
      where: { creatorId, platform: "INSTAGRAM", usedAt: null },
      data: { expiresAt: new Date(0) }, // 즉시 만료
    });

    // 새 토큰 저장
    await prisma.oAuthInvite.create({
      data: { creatorId, platform: "INSTAGRAM", token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const link = `${baseUrl}/oauth/connect?token=${token}`;

    return ok({ link, expiresAt: expiresAt.toISOString() });
  } catch (e) { return handleError(e); }
}
