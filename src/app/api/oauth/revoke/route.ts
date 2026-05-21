export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const { creatorId } = await req.json();
    if (!creatorId) return fail("creatorId 필요", 400);
    await prisma.creatorAccount.updateMany({
      where: { creatorId, platform: "INSTAGRAM" },
      data: { accessToken: null, tokenExpiry: null, oauthStatus: "REVOKED", platformId: null },
    });
    return ok({ revoked: true });
  } catch (e) { return handleError(e); }
}
